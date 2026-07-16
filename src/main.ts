import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap/dist/js/bootstrap.bundle.js';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '../css/main.css';
import {Toast, Modal, Tab} from 'bootstrap';
//import { create, insertMultiple, search, Orama } from '@orama/orama';
import $ from "jquery";
import { Trade, OrderType } from './poco/trade.ts';
import { Database } from './poco/database.ts';
import { KB } from './poco/kb.ts';
import { AI } from './poco/ai.ts';
import { EconomicEvent } from './poco/economicEvent.ts'
import { CentralBank } from './poco/centralBank.ts';
import { SettingAI } from './poco/setting.ts';

const COMPTE_SELECT = 4735924;
//let oramaDb: Orama<any>;

// TypeScript entry point for Forex App
$(async function() {

  //Autorisation
  if (navigator.storage && navigator.storage.persist) {
    const promise = navigator.storage.persist();
    promise.then((granted) => {console.log(granted ? "Storage persistant" : "Storage non garanti");});  
  }

  //Load
  const req_db = Database.OpenDB();
  req_db.then((db) => {
    
    const tx = db.transaction(Database.DB_STORE_NAME_SETTING, 'readonly');
    const tx_ai = db.transaction(Database.DB_STORE_NAME_SETTING_AI, 'readonly');

    var req_capital = tx.objectStore(Database.DB_STORE_NAME_SETTING).get(1);
    var req_ai = tx_ai.objectStore(Database.DB_STORE_NAME_SETTING_AI).get(1);

    req_capital.onsuccess = () => {
      $('#iCapital').val(req_capital.result.capital);
    };
    req_ai.onsuccess = () => {
      $('#chatInstructions').val(req_ai.result.Instructions);
    };
  });
  
  const today = new Date();
  const sunday = GetStartOfWeek(today);
  $('#lblSemaine').html('Semaine du ' + sunday.toLocaleDateString('fr-CA', {day:'2-digit', month:'long', year:'numeric'}))
  .attr('data-date', sunday.toLocaleDateString('en-CA'));

  //Orama
  // oramaDb = await create({
  //     schema: {
  //         entry: 'string', //texte brute
  //         embedding: 'vector[768]',
  //     },
  // });

  //const kbs = await KB.GetAllKBEntries();
  //console.log(kbs);
  // const documentOrama = kbs.map(kb => ({
  //     entry: kb.GetTextToEmbed(),
  //     embedding: Array.from(kb.Embedding!)
  // }));

  // await insertMultiple(oramaDb, documentOrama);

  // const vector_user_prompt = await AI.GenerateEmbedding("What is the dynamic with the pair EUR/USD?");
  // const searchResults = await search(oramaDb, {
  //   mode:'vector',
  //   vector: {
  //     value: Array.from(vector_user_prompt),
  //     property:'embedding'
  //   },
  //   similarity:0.68
  // });
  // console.log(searchResults);
  // searchResults.hits.forEach(hit => {
  //   console.log(`Entry: ${hit.document.entry}, Score: ${hit.score}`);
  // });

  // #region Events
  $('#btnTrades').on('click', function() {
    AddClass(new Array(...$('#divSettings'), ...$('#divInstructions')), 'd-none');
    RemoveClass(new Array(...$("#btnSettings"), ...$("#btnInstructions")), 'active');
    $("#divTrades").removeClass('d-none');
    $("#btnTrades").addClass('active');
  });
  $('#btnSettings').on('click', function() {
    AddClass(new Array(...$('#divTrades'), ...$('#divInstructions')), 'd-none');
    RemoveClass(new Array(...$("#btnTrades"), ...$("#btnInstructions")), 'active');
    $("#divSettings").removeClass('d-none');
    $("#btnSettings").addClass('active');
  });
  $('#btnInstructions').on('click', function() {
    AddClass(new Array(...$('#divTrades'), ...$('#divSettings')), 'd-none');
    RemoveClass(new Array(...$("#btnTrades"), ...$("#btnSettings")), 'active');
    $("#divInstructions").removeClass('d-none');
    $("#btnInstructions").addClass('active');
  });
  $('#btnAI').on('click', function() {
    AddClass(new Array(...$('#divGeneral'), ...$('#divBreakdown')), 'd-none');
    RemoveClass(new Array(...$("#btnGeneral"), ...$("#btnBreakdown")), 'active');
    $("#divAI").removeClass('d-none');
    $("#btnAI").addClass('active');
    $('#btnInstructions').removeClass('d-none');
    $("#btnInstructions").trigger('click');
  });
  $('#btnGeneral').on('click', function() {
    AddClass(new Array(...$('#divAI'), ...$('#divBreakdown')), 'd-none');
    RemoveClass(new Array(...$("#btnAI"), ...$("#btnBreakdown")), 'active');
    $("#divGeneral").removeClass('d-none');
    $("#btnGeneral").addClass('active');
    $("#btnTrades").trigger('click');
    $('#btnInstructions').addClass('d-none');
  });
  $('#btnBreakdown').on('click', function() {
    AddClass(new Array(...$('#divAI'), ...$('#divGeneral')), 'd-none');
    RemoveClass(new Array(...$("#btnAI"), ...$("#btnGeneral")), 'active');
    $("#divBreakdown").removeClass('d-none');
    $("#btnBreakdown").addClass('active');
    $("#btnTrades").trigger('click');
    $('#btnInstructions').addClass('d-none');
  });
  $('#btnSaveSettings').on('click', function() {

    const icapital = $('#iCapital').val()?.toString();

    var capital = 0;
    if (icapital) capital = parseFloat(icapital);
    
    const req_db = Database.OpenDB();

    req_db.then((db) => 
    {
      const tx = db.transaction(Database.DB_STORE_NAME_SETTING, 'readwrite');
      tx.objectStore(Database.DB_STORE_NAME_SETTING).put({id:1, capital:capital});

      $('#btnTrades').trigger('click');

      showToast('Succès', 'Settings enregistré avec succès', 'success');
    });
  });

  // Insert KB Entry -------------------------------------------------
  function saveKbEntry(keepModalOpen: boolean): void {
    const date = $('#kbDate').val()?.toString();
    const entry = $('#kbEntry').val()?.toString();
    
    if (!date || !entry) {
      alert('Les champs Date et Entry sont obligatoires');
      return;
    }
    
    const kb = new KB(0);
    kb.Date = new Date(date);
    kb.Entry = entry;
    kb.Comment = $('#kbCommentaire').val()?.toString() || '';
    kb.Tags = tags.join(', ');
    kb.Currency = $('#kbPair').val()?.toString() || '';
    kb.Analyst = $('#kbAnalyste').val()?.toString() || '';
    kb.WebSiteUrl = $('#kbWebSiteUrl').val()?.toString() || '';
    
    kb.Insert().then(() => {
      AI.GenerateEmbedding(kb.GetTextToEmbed()).then((embedding) => {
        kb.Embedding = embedding;
        kb.UpdateEmbedding();
      });
    });
    
    if (!keepModalOpen) {
      const modalElement = document.getElementById('modalInsertKb');
      if (modalElement) {
        const modal = Modal.getInstance(modalElement);
        if (modal) {
          modal.hide();
        }
      }
    } else {
      $('#kbEntry').val('');
      $('#kbCommentaire').val('');
    }
    
    showToast('Succès', 'Entrée KB insérée avec succès', 'success');
  }

  $('#btnInsertKb').on('click', function() {
    // Initialiser la date du jour selon la timezone Toronto
    const today = new Date().toLocaleDateString();
    $('#kbDate').val(today);
    
    // Réinitialiser les autres champs
    $('#kbEntry').val('');
    $('#kbCommentaire').val('');
    $('#kbTagsList').empty();
    $('#kbTags').val('');
    $('#kbPair').val('');
    $('#kbAnalyste').val('');
    $('#kbWebSiteUrl').val('');
    
    tags = [];
    
    // Afficher le modal
    const modalElement = document.getElementById('modalInsertKb');
    if (modalElement) {
      const modal = new Modal(modalElement);
      modal.show();
    }
  });  
  $('#btnSaveKbEntry').on('click', function() {
    saveKbEntry(false);
  });
  $('#btnSaveKbEntryAndNext').on('click', function() {
    saveKbEntry(true);
  });
  
  // Gestion des tags avec séparation par virgule
  let tags: string[] = [];
  
  $('#kbTags').on('keydown', function(e: any) {
    const input = $(this);
    let currentValue = input.val()?.toString().trim() || '';
    
    // Vérifier si la touche est une virgule
    if (e.key === ',' || e.keyCode === 188) {
      e.preventDefault();
      
      // Récupérer le texte avant la virgule
      const tag = currentValue.replace(',', '').trim();
      
      // Ajouter le tag s'il n'est pas vide et pas un doublon
      if (tag && !tags.includes(tag)) {
        tags.push(tag);
        updateTagsDisplay();
        input.val('');
      }
    }
  });
  
  // Fonction pour afficher les tags
  function updateTagsDisplay() {
    const tagsList = $('#kbTagsList');
    tagsList.empty();
    
    tags.forEach((tag, index) => {
      const tagBadge = $(`
        <span class="badge bg-danger me-2 mb-2">
          ${tag}
          <button type="button" class="btn-close btn-close-white ms-2" data-index="${index}" style="font-size: 0.75rem;"></button>
        </span>
      `);
      tagsList.append(tagBadge);
    });
    
    // Mettre à jour le champ caché avec tous les tags
    $('#kbTags').data('tags', tags);
  }
  
  // Supprimer un tag au clic sur le bouton close
  $(document).on('click', '#kbTagsList .btn-close', function() {
    const index = $(this).data('index');
    tags.splice(index, 1);
    updateTagsDisplay();
  });
  //-------------------------------------------------------------------
  // My knowledge base
  async function loadKbEntries(): Promise<void> {
    const tbody = $('#kbTableBody');
    tbody.empty();

    try {
      const entries = await KB.GetAllKBEntries();

      if (!entries.length) {
        tbody.append('<tr><td colspan="9" class="text-center text-secondary">Aucune entrée KB</td></tr>');
        return;
      }

      entries.sort((a, b) => b.Id - a.Id);

      entries.forEach((entry) => {
        const dateValue = entry.Date.toISOString().split('T')[0];
        tbody.append(`
          <tr>
            <td><input type="checkbox" class="form-check-input entry-checkbox" data-id="${entry.Id}"></td>
            <td>${entry.Id}</td>
            <td>${dateValue}</td>
            <td style="max-width: 800px;"><div class="text-break">${entry.Entry || ''}</div></td>
            <td><div class="text-break">${entry.Comment || ''}</div></td>
            <td>${entry.Tags || ''}</td>
            <td>${entry.Currency || ''}</td>
            <td>${entry.Analyst || ''}</td>
            <td style="text-align:center;">${entry.WebSiteUrl ? `<button onclick="window.open('${entry.WebSiteUrl}', '_blank')" class="btn btn-link text-white p-0" title="Ouvrir le lien"><i class="bi bi-box-arrow-up-right"></i></button>` : ''}</td>
          </tr>
        `);
      });
    } catch (error) {
      tbody.append('<tr><td colspan="9" class="text-center text-danger">Impossible de charger les entrées KB</td></tr>');
      console.error(error);
    }

    if (rowIsChecked(document.getElementById('tblKb'))) $('#divOptionsKb').removeClass('d-none');
    else $('#divOptionsKb').addClass('d-none');
  }

  function showKbCalendarModal(tabId: 'myKb' | 'economicCalendar'): void {
    const modalElement = document.getElementById('modalKbCalendar');
    if (!modalElement) return;

    const modal = new Modal(modalElement);
    modal.show();

    const tabSelector = tabId === 'economicCalendar' ? '#tabEconomicCalendar-tab' : '#tabMyKb-tab';
    const tabButton = document.querySelector<HTMLButtonElement>(tabSelector);
    if (tabButton) {
      const tab = new Tab(tabButton);
      tab.show();
    }
  }
  
  // Toggle select all
  $('#selectAllCheckbox').on('change', function() {
    const isChecked = $(this).is(':checked');
    $('.entry-checkbox').prop('checked', isChecked);

    if (rowIsChecked(document.getElementById('tblKb'))) $('#divOptionsKb').removeClass('d-none');
    else $('#divOptionsKb').addClass('d-none');
  });
  $(document).on('change', '.entry-checkbox', function() {
    if (rowIsChecked(document.getElementById('tblKb'))) $('#divOptionsKb').removeClass('d-none');
    else $('#divOptionsKb').addClass('d-none');
  });
  $('#btnDeselectAll').on('click', function() {
    $('#selectAllCheckbox').prop('checked', false);
    $('#selectAllCheckbox').trigger('change');
  });
  function rowIsChecked(table:HTMLElement | null):boolean {
    if (!table) return false;

    var class_name = '.entry-checkbox';
    if (table.id === 'economicCalendarTable') class_name = '.entry-checkbox-economic-event';
    
    const checked_rows = table.querySelectorAll('tr:has('+class_name+':checked)');
    
    if (checked_rows.length > 0) return true;
    else return false;
  }

  // Regenerate embedding button
  $('#regenerateEmbedding').on('click', function() {
    const checkedIds = $('.entry-checkbox:checked').map(function() {
      return $(this).data('id');
    }).get();

    if (checkedIds.length === 0) {
      alert('Veuillez sélectionner au moins une entrée');
      return;
    }

    console.log('Regénerer embedding pour les IDs:', checkedIds);
    alert(`Action: Regénerer embedding pour ${checkedIds.length} entrée(s)`);
  });

  // Delete entries button
  $('#deleteEntries').on('click', function() {
    const checkedIds = $('#tblKb .entry-checkbox:checked').map(function() {
      return $(this).data('id');
    }).get();

    if (checkedIds.length === 0) {
      alert('Veuillez sélectionner au moins une entrée');
      return;
    }

    if (confirm(`Êtes-vous sûr de vouloir supprimer ${checkedIds.length} entrée(s) ?`)) {
      
      const promises:Promise<void>[] = [];
      checkedIds.forEach((id) => {
          var p = new Promise<void>((resolve, reject) => {
              var res = KB.DeleteKbEntry(id);
              res.then(() => resolve())
              .catch((err) => reject(err));
          });
          promises.push(p);
      });

      Promise.all(promises).then(() => {
        loadKbEntries();
        showToast('Élément(s) supprimé(s)', 'Élément(s) supprimé(s) avec succès', 'success');
      })
      .catch((error) => { 
        alert('Erreur lors de la suppression, veuillez réessayer');
        loadKbEntries();
        console.log(JSON.stringify(error));
       });
    }
  }); 

  $('#btnManageKb').on('click', async function() {
    await loadKbEntries();
    await loadEconomicEventCalendar(new Date());
    await loadCentralBanks();
    showKbCalendarModal('myKb');
  });

  //Economic Calendar
  $('#btnEconomicCalendar').on('click', async function() {
    await loadKbEntries();
    await loadEconomicEventCalendar(new Date());
    await loadCentralBanks();
    showKbCalendarModal('economicCalendar');
  });
  $('#btnSemainePrecedente').on('click', function() {
    const current_date_str = $('#lblSemaine').attr('data-date');
    if (!current_date_str) return;

    const parts = current_date_str.split('-');
    const current_date = new Date(parseInt(parts[0]), parseInt(parts[1])-1, parseInt(parts[2]));
    
    current_date.setDate(current_date.getDate()-1);
    
    const prev_sunday = GetStartOfWeek(current_date);
    $('#lblSemaine').html('Semaine du ' + prev_sunday.toLocaleDateString('fr-CA', {day:'2-digit', month:'long', year:'numeric'}))
    .attr('data-date', prev_sunday.toLocaleDateString('en-CA'));

    loadEconomicEventCalendar(prev_sunday);
  });
  $('#btnSemaineSuivante').on('click', function() {
    const current_date_str = $('#lblSemaine').attr('data-date');
    if (!current_date_str) return;

    const parts = current_date_str.split('-');
    const current_date = new Date(parseInt(parts[0]), parseInt(parts[1])-1, parseInt(parts[2]));
    
    current_date.setDate(current_date.getDate()+7);
    $('#lblSemaine').html('Semaine du ' + current_date.toLocaleDateString('fr-CA', {day:'2-digit', month:'long', year:'numeric'}))
    .attr('data-date', current_date.toLocaleDateString('en-CA'));

    loadEconomicEventCalendar(current_date);
  });

  async function loadEconomicEventCalendar(from:Date) {
    const sunday = GetStartOfWeek(from);
    const lastDay = new Date(sunday);
    lastDay.setDate(lastDay.getDate()+6);
    
    $('#economicCalendarTableBody').html('');
    
    const str_sunday = sunday.toISOString().split('T')[0];
    const str_lastDay = lastDay.toISOString().split('T')[0]

    const pEvents = EconomicEvent.GetAllEvents(str_sunday, str_lastDay);
    pEvents.then((events) => {

        var ligne = '';

        const daysOfWeek = [];
        while (sunday <= lastDay) {
          daysOfWeek.push(new Date(sunday));
          sunday.setDate(sunday.getDate()+1);
        }

        var intLigne = 0;
        daysOfWeek.forEach((day) => {

          var str_day = day.toISOString().split('T')[0];          
          const eventsOfDay = events.filter(ev => ev.Date == str_day);
          const rowSpan = eventsOfDay.length + 2;

          var bgCell = (intLigne % 2 == 0 ? 'bg-dark' : 'forex-alt-row');

          ligne += '<tr class="bg-secondary">';
          ligne += '<td rowspan="'+rowSpan+'" class="'+bgCell+'">' + day.toLocaleDateString('fr-CA', {day:'2-digit', year:'numeric', month:'long'}) + '</td>';
          ligne += '</tr>';
          
          eventsOfDay.forEach((event) => {
            ligne += '<tr>' +
            '<td class="'+bgCell+'"><input type="checkbox" class="form-check-input entry-checkbox-economic-event" data-id="'+event.id+'" style="margin-left:10px;"></td>'+
            '<td class="'+bgCell+'">' + event.Currency + '</td>' +
            '<td class="'+bgCell+'">' + event.Impact + '</td>' +
            '<td class="'+bgCell+'">' + event.Name + '</td>' +
            (event.Actual && event.Actual !== '' ? '<td class="'+bgCell+'">' + event.Actual + '</td>' : '<td class="'+bgCell+'"><button class="btn btn-link edit-economic-event" data-id="'+event.id+'">Update</button></td>') +
            '<td class="'+bgCell+'">' + event.Forecast + '</td>' +
            '<td class="'+bgCell+'">' + event.Previous + '</td>' +
            '</tr>';
          });

          ligne += GenererLigneAjouterEvenement(day, intLigne);

          intLigne++;
        });

        $('#economicCalendarTableBody').html(ligne);
    })
    .catch((err) => { console.log(err); });    
  }
  function GenererLigneAjouterEvenement(date:Date, intLigne:number):string {
    var bgCell = (intLigne % 2 == 0 ? 'bg-dark' : 'forex-alt-row');

    var ligne = '<tr data-compteur="0"><td class="'+bgCell+'" style="vertical-align:baseline;"><button class="btn ai-action-btn add-event" type="button" title="Ajouter un évènement" aria-label="Ajouter un évènement">' +
                    '<i class="bi bi-plus fs-4 text-danger"></i>' +
                  '</button></td>'+
                  '<td class="'+bgCell+'" style="vertical-align:baseline;"><select data-currency class="d-none form-select form-select-sm bg-dark text-white">'+
    '<option value="AUD">AUD</option>'+
    '<option value="CAD">CAD</option>'+
    '<option value="CHF">CHF</option>'+
    '<option value="EUR">EUR</option>'+
    '<option value="GPB">GPB</option>'+
    '<option value="JPY">JPY</option>'+
    '<option value="NZD">NZD</option>'+
    '<option value="USD">USD</option>'+
    '</select>'+
    '</td>';
    ligne += '<td class="'+bgCell+'" style="vertical-align:baseline;"><select data-impact class="d-none form-select form-select-sm bg-dark text-white">'+
    '<option value="HIGH">High</option>'+
    '<option value="MEDIUM">Medium</option>'+
    '<option value="LOW">Low</option>'+
    '</select>'+
    '</td>';
    ligne += '<td class="'+bgCell+'" style="vertical-align:baseline;"><input data-name type="text" class="d-none form-control form-control-sm bg-dark border-secondary text-white input-placeholder" placeholder="Name"></td>';
    ligne += '<td class="'+bgCell+'"style="vertical-align:baseline;width:120px;"><input data-actual type="text" class="d-none form-control form-control-sm bg-dark border-secondary text-white input-placeholder" placeholder="Actual"></td>';
    ligne += '<td class="'+bgCell+'" style="vertical-align:baseline;width:120px;"><input data-forecast type="text" class="d-none form-control form-control-sm bg-dark border-secondary text-white input-placeholder" placeholder="Forecast"></td>';
    ligne += '<td class="'+bgCell+'" style="vertical-align:baseline;width:120px;text-align:end;"><input data-previous type="text" class="d-none form-control form-control-sm bg-dark border-secondary text-white input-placeholder" placeholder="Previous">' +
    '<button class="btn ai-action-btn cancel-event d-none" type="button" title="Annuler" aria-label="Annuler">' +
                    '<i class="bi bi-backspace fs-4"></i>' +
                  '</button>'+
    '<button class="btn ai-action-btn save-event d-none" type="button" data-date="' + date.toISOString().split('T')[0] + '" title="Enregistrer un évènement" aria-label="Enregistrer un évènement">' +
                    '<i class="bi bi-check fs-4 text-danger"></i>' +
                  '</button>'+
    '<button class="btn ai-action-btn save-and-next d-none" type="button" data-date="' + date.toISOString().split('T')[0] + '" title="Enregistrer et suivant" aria-label="Enregistrer et suivant">' +
      '<i class="bi bi-check-circle fs-4 text-danger"></i>' +
    '</button>'+
    '</td>'+
    '</tr>';

    return ligne;
  }
  function InsertEvenement(btn:JQuery<HTMLElement>):Promise<EconomicEvent> {
    
    return new Promise<EconomicEvent>((resolve, reject) => {
      const $row = $(btn).closest('tr');
      const evenement = new EconomicEvent(0);
      
      const name = $row.find('[data-name]').val() as string;
      if (!name || name.trim() === '') {
        showToast('Erreur', 'Le nom est un champ obligatoire', 'danger');
        return;
      }

      const date = $(btn).data('date') as string;
      const currency = $row.find('[data-currency]').val() as string;
      const impact = $row.find('[data-impact]').val() as string;
      const actual = $row.find('[data-actual]').val() as string;
      const forecast = $row.find('[data-forecast]').val() as string;
      const previous = $row.find('[data-previous]').val() as string;

      if (date) evenement.Date = date;
      if (currency) evenement.Currency = currency;
      if (impact) evenement.Impact = impact;
      if (name) evenement.Name = name;
      if (actual) evenement.Actual = actual;
      if (forecast) evenement.Forecast = forecast;
      if (previous) evenement.Previous = previous;

      evenement.Insert().then(() => {
        showToast('Évènement enregistré', 'Évènement enregistré avec succès', 'success');
        resolve(evenement);
      })
      .catch(() => {
        showToast('Erreur', 'Échec lors de l\'enregistrement de l\'évènement', 'danger');
        reject('Échec lors de l\'enregistrement de l\'évènement');
      });
    });
  }
  $(document).on('click', '.add-event', function(this:HTMLElement) {
    const $row = $(this).closest('tr');
    
    $row.find('[data-currency]').removeClass('d-none');
    $row.find('[data-impact]').removeClass('d-none');
    $row.find('[data-name]').removeClass('d-none');
    $row.find('[data-actual]').removeClass('d-none');
    $row.find('[data-forecast]').removeClass('d-none');
    $row.find('[data-previous]').removeClass('d-none');
    $row.find('.save-event').removeClass('d-none');
    $row.find('.cancel-event').removeClass('d-none');
    $row.find('.save-and-next').removeClass('d-none');

    $(this).addClass('d-none');
  });
  $(document).on('click', '.cancel-event', function(this:HTMLElement) {
    const $row = $(this).closest('tr');
    
    $row.find('[data-currency]').addClass('d-none').val('AUD');
    $row.find('[data-impact]').addClass('d-none').val('HIGH');
    $row.find('[data-name]').addClass('d-none').val('');
    $row.find('[data-actual]').addClass('d-none').val('');
    $row.find('[data-forecast]').addClass('d-none').val('');
    $row.find('[data-previous]').addClass('d-none').val('');
    $row.find('.save-event').addClass('d-none').val('');
    $row.find('.cancel-event').addClass('d-none').val('');
    $row.find('.save-and-next').addClass('d-none').val('');

    $row.find('.add-event').removeClass('d-none');
  });
  $(document).on('click', '.save-event', function(this:HTMLElement) {      
    InsertEvenement($(this)).then(() => {
      loadEconomicEventCalendar(new Date($(this).data('date') as string));
      $('.cancel-event').trigger('click');
    });
  });
  $(document).on('click', '.save-and-next', function(this:HTMLElement) {
      InsertEvenement($(this)).then((evt) => {
      
      var bgCell = 'bg-dark';

      const $row = $(this).closest('tr');     
      const td = $(this).closest('td');
      if (td && td.hasClass('forex-alt-row')) bgCell = 'forex-alt-row';

      var compteur = parseInt($row.data('compteur'));

      var ligne = '<tr>';
      if (compteur > 0) ligne += '<td class="'+bgCell+'"></td>';
            ligne += '<td class="'+bgCell+'"><input type="checkbox" class="form-check-input entry-checkbox" data-id="'+evt.id+'" style="margin-left:10px;"></td>'+
            '<td class="'+bgCell+'">' + evt.Currency + '</td>' +
            '<td class="'+bgCell+'">' + evt.Impact + '</td>' +
            '<td class="'+bgCell+'">' + evt.Name + '</td>' +
            (evt.Actual && evt.Actual !== '' ? '<td class="'+bgCell+'">' + evt.Actual + '</td>' : '<td class="'+bgCell+'"><button class="btn btn-link">Edit</button></td>') +
            '<td class="'+bgCell+'">' + evt.Forecast + '</td>' +
            '<td class="'+bgCell+'">' + evt.Previous + '</td>' +
            '</tr>';

      $row.before(ligne);
       
      $row.find('[data-name]').val('');
      $row.find('[data-actual]').val('');
      $row.find('[data-forecast]').val('');
      $row.find('[data-previous]').val('');    
      
      if (compteur === 0) $row.prepend('<td class="'+bgCell+'"></td>');

      compteur++;
      $row.data('compteur', compteur);
    });    
  });
  $('#chkSelectAllEconomicEvent').on('change', function() {
    const isChecked = $(this).is(':checked');
    $('.entry-checkbox-economic-event').prop('checked', isChecked);

    if (rowIsChecked(document.getElementById('economicCalendarTable'))) $('#divOptionsEconomicCalendar').removeClass('d-none');
    else $('#divOptionsEconomicCalendar').addClass('d-none');
  });
  $(document).on('change', '.entry-checkbox-economic-event', function() {
    if (rowIsChecked(document.getElementById('economicCalendarTable'))) $('#divOptionsEconomicCalendar').removeClass('d-none');
    else $('#divOptionsEconomicCalendar').addClass('d-none');
  });
  $('#btnDeselectAllEconomicCalendar').on('click', function() {
    $('#chkSelectAllEconomicEvent').prop('checked', false);
    $('#chkSelectAllEconomicEvent').trigger('change');
  });
  $('#deleteEconomicEvent').on('click', function() {
    const checkedIds = $('#economicCalendarTable .entry-checkbox-economic-event:checked').map(function() {
      return $(this).data('id');
    }).get();

    if (checkedIds.length === 0) {
      alert('Veuillez sélectionner au moins une entrée');
      return;
    }

    if (confirm(`Êtes-vous sûr de vouloir supprimer ${checkedIds.length} évènement(s) ?`)) {
      
      const current_date_str = $('#lblSemaine').attr('data-date');
      const parts = current_date_str!.split('-');
      
      const promises:Promise<void>[] = [];
      checkedIds.forEach((id) => {
          var p = new Promise<void>((resolve, reject) => {
            console.log(id);
              var res = EconomicEvent.DeleteEvent(id);
              res.then(() => resolve())
              .catch((err) => reject(err));
          });
          promises.push(p);
      });

      Promise.all(promises).then(() => {
        loadEconomicEventCalendar(new Date(parseInt(parts[0]), parseInt(parts[1])-1, parseInt(parts[2])));
        showToast('Élément(s) supprimé(s)', 'Élément(s) supprimé(s) avec succès', 'success');
      })
      .catch((error) => { 
        alert('Erreur lors de la suppression, veuillez réessayer');
        loadEconomicEventCalendar(new Date(parseInt(parts[0]), parseInt(parts[1])-1, parseInt(parts[2])));
        console.log(JSON.stringify(error));
       });
    }
  });
  $(document).on('click', '.edit-economic-event', function() {
    const eventId = parseInt($(this).data('id'));
    const td = $(this).closest('td');

    const content = '<div class="d-flex flex-gap-2"><input type="text" class="form-control form-control-sm bg-dark border-secondary text-white input-placeholder" placeholder="Actual">'+
    '<button class="btn ai-action-btn update-actual-event" data-id="'+eventId+'" type="button" title="Accepter" aria-label="Accepter">' +
                    '<i class="bi bi-check fs-4 text-danger"></i>' +
                  '</button></div>';

    td.html(content);
  });
  $(document).on('click', '.update-actual-event', function() {
    const td = $(this).closest('td');
    const eventId = parseInt($(this).data('id'));
    
    EconomicEvent.GetEvent(eventId).then((evt) => {
      evt.Actual = $(td).find('input').val() ?? '';
      
      EconomicEvent.Update(evt).then(() => {
        showToast('Évènement à jour', 'Évènement enregistré avec succès', 'success');
        const content = (evt.Actual && evt.Actual !== '' ? evt.Actual : '<button class="btn btn-link edit-economic-event" data-id="'+evt.id+'">Update</button>');
        $(td).html(content);
      })
      .catch(() => {
        showToast('Erreur', 'Échec lors de l\'enregistrement de l\'évènement', 'danger');
      });
    });
  });

  //Central Banks
  async function loadCentralBanks() {

    const rates = await CentralBank.GetAll();
    rates.sort((a, b) => b.Rate.localeCompare(a.Rate));

    $('#tbodyCentralBanks').html('');

    var ligne = '';
    rates.forEach((rate) => {

      const jRate = JSON.stringify(rate).replace(/"/g, '\'');
      ligne += `<tr><td style="width:100px;">${rate.Currency}</td><td style="width:100px;">${rate.Rate}</td>`+
      '<td><div class="d-flex gap-3"><input type="text" class="form-control form-control-sm bg-dark border-secondary text-white input-placeholder" placeholder="Nouveau taux">'+
      '<button class="btn ai-action-btn update-central-bank-rate" data-content='+jRate+' type="button" title="Modifier" aria-label="Modifier">' +
                    '<i class="bi bi-check fs-4 text-danger"></i>' +
                  '</button></div>'+
      '</td>'+
      '</tr>';
    });

    $('#tbodyCentralBanks').html(ligne);
  }
  $(document).on('click', '.update-central-bank-rate', function() {
      const $td = $(this).closest('td');
      const rawContent = $(this).data('content') as string;
      const rate = JSON.parse(rawContent.replace(/\'/g, '"')) as CentralBank;

      rate.Rate = $td.find('input').val() ?? '';

      CentralBank.Update(rate).then(() => {
        showToast('Taux à jour', 'Taux enregistré avec succès', 'success');
        loadCentralBanks();
      })
      .catch(() => {
        showToast('Erreur', 'Échec lors de l\'enregistrement du taux', 'danger');
      })
  });
  //-------------------------------------------------------------------------------------
  //AI Prompt
  $('#btnClearChatHistory').on('click', function() {
    alert('Action front-end : Supprimer l\'historique de conversation');
  });

  const chatInput = document.getElementById('chatInput') as HTMLTextAreaElement | null;
  if (chatInput) {
    const resizeTextarea = () => {
      chatInput.style.height = 'auto';
      chatInput.style.height = Math.min(chatInput.scrollHeight, 180) + 'px';
    };

    chatInput.addEventListener('input', resizeTextarea);
    resizeTextarea();
  } 

  //Instructions
  async function InsertInstructions(instructions:string) {
    const param = new SettingAI(1);
    param.Instructions = instructions;
    await SettingAI.Update(param);
  }
  const DebounceInstructions = debounce((valeur: string) => {
    InsertInstructions(valeur).then(() => {
        showToast('Instructions enregistrées', 'Instructions enregistrées avec succès', 'success');
      })
      .catch(() => {
        showToast('Erreur', 'Échec lors de l\'enregistrement des instructions', 'danger');
      });
  }, 3000);
  $('#chatInstructions').on('input', function(this: HTMLElement) {
    const texte = $(this).val() as string;
    DebounceInstructions(texte);
  });
  
  //Trades section----------------------------------------------------------------
  $("#DragDiv").on("dragenter dragover", function(e){ e.preventDefault(); e.stopPropagation(); $(this).addClass("active"); });
  $("#DragDiv").on("dragleave drop", function(e){ e.preventDefault(); e.stopPropagation(); $(this).removeClass("active"); });
  $("#DragDiv").on("drop", function(e)  
  {
    $('#menuTabBreakdown').html('');

      const trades: Trade[] = [];
      const promises: Promise<Trade[]>[] = [];

      const dt = e.originalEvent?.dataTransfer;
      if (dt && dt.files) 
      {
          const files = dt.files;
          for (let i=0; i<files.length; i++) 
            {
              if (files[i].type !== "text/csv") {
                  alert('Mauvais format. Format accepté : text/csv');
                  return;
              }

              const promise = new Promise<Trade[]>((resolve, reject) => 
                {
                const reader = new FileReader();
                reader.onload = function (e) {
                  const htmlContent = e.target?.result;
                  if (htmlContent) 
                  {
                    if (!htmlContent.toString().includes("276da36c-8921-478d-b4b7-1e2ddb89c9b8")) {
                      alert('Le fichier déposé ne semble pas être un rapport valide.');
                      return;
                    }

                    //const parser = new DOMParser();
                    //const doc = parser.parseFromString(htmlContent as string, "text/html");

                    resolve(LireRapport(htmlContent as string));             
                  }
                };
                reader.onerror = (event) => reject(event.target?.error);
                reader.readAsText(files[i]);
              });

              promises.push(promise);
        }
      }
      
      Promise.all(promises).then(results => {
          results.forEach(tradeArray => {
              trades.push(...tradeArray);
          });

          const groupedBy = new Map<number, Trade[]>();
          trades.forEach(trade => {

              if (!groupedBy.has(trade.Id)) groupedBy.set(trade.Id, []);
              groupedBy.get(trade.Id)?.push(trade);
          });

          trades.sort((a,b) => {
              const nameA = a.OpenTime.toISOString().toUpperCase(); // ignore upper and lowercase
              const nameB = b.OpenTime.toISOString().toUpperCase(); // ignore upper and lowercase

              if (nameA < nameB) {
                return 1;
              }
              if (nameA > nameB) {
                return -1;
              }
              // names must be equal
              return 0;
            });

          var content = '<ul style="border:none; !important" class="nav nav-tabs" id="dynamicAccounts" role="tablist">';

          var compteur = 0; var firstAccount = 0;
          groupedBy.forEach((pair, key) => {

            content += '<li class="nav-item">';
            if (compteur === 0) {
              content += `<a class='nav-link active nav-link-custom' href='#' data-active data-key='${key}' data-row='${JSON.stringify(pair)}'>${pair[0].Devise} ${key}</a></li>`;
              firstAccount = key;
              RemplirSidePanel(pair);
            }
            else content += `<a class='nav-link nav-link-custom' href='#' data-key='${key}' data-row='${JSON.stringify(pair)}'>${pair[0].Devise} ${key}</a></li>`;
            
            compteur++;
          }); 

          content += `<li class='nav-item'><a class='nav-link nav-link-custom' href='#' data-key='tous' data-row='${JSON.stringify(trades)}'>TOUS</a></li><li class='nav-item ms-auto'><a class='nav-link nav-link-custom-secondary' href='#' data-key='weekly' data-row='${JSON.stringify(groupedBy.get(firstAccount)) }'>Weekly</a></li></ul>`;
                    
          $('#menuTabBreakdown').html(content);

          const weekly_label = $('#dynamicAccounts .nav-link-custom-secondary');
          const weekly = weekly_label.data('active');

          RemplirTblBreakdown(groupedBy.get(firstAccount) || [], weekly !== undefined);

          //On délègue l'écouteur sur le parent (qui est maintenant dans le DOM)
          $('#dynamicAccounts').on('click', '.nav-link', function(this: HTMLElement, event) {
              event.preventDefault();
             
              // On récupère les trades stockée dans l'attribut data
              const key = $(this).data('key') as string;
              const trades = $(this).data('row') as Trade[];

              const weekly_label = $('#dynamicAccounts .nav-link-custom-secondary');
              const weekly = weekly_label.data('active');
              
              if (key === 'weekly') 
              {
                if (weekly) 
                {
                  weekly_label.removeClass('active');
                  weekly_label.removeData('active');
                }
                else 
                  {
                  weekly_label.addClass('active');
                  weekly_label.data('active', true);
                }

                RemplirTblBreakdown(trades, !weekly);
              }
              else 
              {
                $('#dynamicAccounts .nav-link-custom').removeClass('active');
                $('#dynamicAccounts .nav-link-custom-secondary').data('row', trades);

                $(this).addClass('active');

                RemplirSidePanel(trades);
                RemplirTblBreakdown(trades, weekly);
              }      
              
          });
          
        });
  });
  //-------------------------------------------------------------------------------

  //Database management
  $('#btnExportDB').on('click', function() {
    Database.ExportDB().then((data) => {

      // 3. Convertir en JSON et déclencher le téléchargement du fichier
      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = 'forex-app-backup.json';
      document.body.appendChild(a);
      a.click();

      // Nettoyage de la mémoire
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showToast('Database export', 'Database export exécuté avec succès', 'success');
    })
    .catch(() => {
      showToast('Erreur', 'Échec lors de l\'export de la database', 'danger');
    });
  });
  //------------------------------------------------------------------------------
  // #endregion
})

// #region Functions
function LireRapport(report:string) 
{
    const trades: Trade[] = [];

    // Split en lignes
    const lines = report.split(/\r?\n/);

    var data = lines.map(line => line.split(';'));
    for (let i=2; i<data.length; i++) 
    {
        const ticket = parseInt(data[i][1]);
        if (isNaN(ticket)) continue;

        const orderType = parseInt(data[i][3]);
        if (orderType > 5) continue;

        const trade: Trade = new Trade(parseInt(data[i][0]), ticket);
        trade.OpenTime = new Date(data[i][2]);
        trade.OrderType = orderType as OrderType;
        trade.Lots = parseFloat(data[i][4]);
        trade.Symbol = data[i][5];
        trade.OpenPrice = parseFloat(data[i][6]);
        trade.SL = parseFloat(data[i][7]);
        trade.TP = parseFloat(data[i][8]);
        trade.CloseTime = new Date(data[i][9]);
        trade.ClosePrice = parseFloat(data[i][10]);
        trade.Commission = parseFloat(data[i][11]);
        trade.Swap = parseFloat(data[i][12]);
        trade.Profit = parseFloat(data[i][13]);
        trade.Devise = data[i][14];
          
        trades.push(trade);
    }

    return trades;
}
async function RemplirSidePanel(trades:Trade[]) 
{
  $('#tradesTableBody').html('');

  //Tableau des trades en ordre de date desc
  var rows_trades = '';
  trades.forEach(trade => 
  {
    const openTimeDate = typeof trade.OpenTime === 'string' 
          ? new Date(trade.OpenTime) 
          : trade.OpenTime;

      rows_trades += '<tr>';
      rows_trades += '<td>' + openTimeDate.toISOString() + '</td>';
      rows_trades += '<td>' + trade.Symbol + '</td>';
      rows_trades += '<td style="text-align:right;">' + trade.Profit + '</td>';
      rows_trades += '</tr>';
  });

  $('#tradesTableBody').html(rows_trades);
}
async function RemplirTblBreakdown(trades:Trade[], weekly:boolean)
{
  $('#breakdownTableBody').html('');

  const db = await Database.OpenDB();

  const tx = db.transaction(Database.DB_STORE_NAME_SETTING, 'readonly');
  const req_setting = await tx.objectStore(Database.DB_STORE_NAME_SETTING).get(1);

  var capital = await new Promise<number>((resolve,reject) => {
    req_setting.onsuccess = () => { resolve(req_setting.result.capital); }
    req_setting.onerror = () => { reject(0) }
  })

  //Group par mois
  var groupedBy_month = new Map<string, Trade[]>();
  trades.forEach(trade => 
  {
    const openTimeDate = typeof trade.OpenTime === 'string' 
          ? new Date(trade.OpenTime) 
          : trade.OpenTime;

      var key = openTimeDate.getFullYear().toString() + openTimeDate.getMonth().toString();
      if (!groupedBy_month.has(key)) groupedBy_month.set(key, []);

      groupedBy_month.get(key)?.push(trade);
  });


  //Breakdown par mois
  var total_win = 0;
  var total_loss = 0;
  var total_profit = 0;
  var total_pips = 0;
  var total_pips_profit = 0;

  var rows_breakdown = '';
  groupedBy_month.forEach((trades) => 
    {
      var win = 0;
      var loss = 0;
      var profit = 0;
      var pips = 0;
      var pips_grouped = 0;

      const openTimeDate = typeof trades[0].OpenTime === 'string' 
          ? new Date(trades[0].OpenTime) 
          : trades[0].OpenTime;

      if (weekly) 
      {
        rows_breakdown += '<tr>';
        rows_breakdown += '<td style="text-align:left !important;">' + openTimeDate.getFullYear() + '</td>';
        rows_breakdown += '<td style="text-align:left !important;" colspan="9">' + openTimeDate.toLocaleDateString("en-CA", {month: 'long'}); + '</td>';
        rows_breakdown += '</tr>';
      }

      if (!weekly) 
      {
        trades.forEach(trade => 
        {
            if (trade.Profit > 0) win++;
            else loss++;

            profit += trade.Profit;
            pips += CalculatePips(trade.OpenPrice, trade.ClosePrice, trade.Symbol, trade.OrderType);

            const pip_per_price = trade.Lots * 10;
            var pips_profit = trade.Profit / pip_per_price;

            if (trade.Id === COMPTE_SELECT) pips_profit *= 0.1;
            
            pips_grouped += pips_profit;
            total_pips_profit += pips_profit;
        });

        total_win += win;
        total_loss += loss;
        total_profit += profit;
        total_pips += pips;
        //total_pips_profit += pips_profit;  

        rows_breakdown = PrintRowBreakdown(rows_breakdown, openTimeDate, win, loss, pips, profit, pips_grouped, capital, 0, weekly);
      }
      else 
      {
        var groupedBy_semaine = new Map<number, Trade[]>();
        trades.forEach(trade => {
            const semaine = ObtenirSemaineDuMois(trade.OpenTime);

            if (!groupedBy_semaine.has(semaine)) groupedBy_semaine.set(semaine, []);
            groupedBy_semaine.get(semaine)?.push(trade);
        });

        groupedBy_semaine.forEach((trades_semaine, key_semaine) => 
        {
            win = 0;
            loss = 0;
            profit = 0;
            pips = 0;
            pips_grouped = 0;

            trades_semaine.forEach(trade => 
            {
                if (trade.Profit > 0) win++;
                else loss++;

                profit += trade.Profit;
                pips += CalculatePips(trade.OpenPrice, trade.ClosePrice, trade.Symbol, trade.OrderType);

                const pip_per_price = trade.Lots * 10;
                var pips_profit = trade.Profit / pip_per_price;

                if (trade.Id === COMPTE_SELECT) pips_profit *= 0.1;
                
                pips_grouped += pips_profit;
                total_pips_profit += pips_profit;                 
            });  

            total_win += win;
            total_loss += loss;
            total_profit += profit;
            total_pips += pips;
            //total_pips_profit += pips_profit; 

            rows_breakdown = PrintRowBreakdown(rows_breakdown, openTimeDate, win, loss, pips, profit, pips_grouped, capital, key_semaine, weekly);
        });
      }          
  });

  //TOTAL
  rows_breakdown += '<tr>';
  rows_breakdown += '<td></td>';
  rows_breakdown += '<td></td>';
  rows_breakdown += '<td><b>' + total_win + '</b></td>';
  rows_breakdown += '<td><b>' + total_loss + '</b></td>';
  rows_breakdown += '<td><b>' + (total_win + total_loss) + '</b></td>';
  rows_breakdown += '<td><b>' + (total_win / (total_win+total_loss)).toLocaleString(undefined, {style:'percent'}) + '</b></td>';
  rows_breakdown += '<td><b>' + total_pips.toLocaleString(undefined, {style:'decimal'}) + '</b></td>';
  rows_breakdown += '<td><b>' + total_profit.toLocaleString(undefined, {style:'currency',currency:'CAD'}) + '</b></td>';
  rows_breakdown += '<td><b>' + total_pips_profit.toLocaleString(undefined, {style:'decimal'}) + '</b></td>';
  rows_breakdown += '<td><b>' + (total_profit / capital).toLocaleString(undefined, {style:'percent',minimumFractionDigits:2}) + '</b></td>';
  rows_breakdown += '</tr>';
  
  $('#breakdownTableBody').html(rows_breakdown);
}

function GetPipSize(symbol: string): number {
  return symbol.includes("JPY") ? 0.01 : 0.0001;
}
function CalculatePips(openPrice: number,closePrice: number,symbol: string,orderType: OrderType
): number 
{
  const pipSize = GetPipSize(symbol);

  const diff = closePrice - openPrice;
  const pips = diff / pipSize;

  return (orderType === OrderType.buy || orderType === OrderType.buylimit || orderType === OrderType.buystop) ? pips : -pips;
}
function PrintRowBreakdown(rows_breakdown:string, openTimeDate:Date, win:number, loss:number, pips:number, profit:number, pips_month:number, capital:number, semaine:number, weekly:boolean):string 
{
      rows_breakdown += '<tr>';

      if (!weekly ) {
      rows_breakdown += '<td style="text-align:left !important;">' + openTimeDate.getFullYear() + '</td>';
      rows_breakdown += '<td style="text-align:left !important;">' + openTimeDate.toLocaleDateString("en-CA", {month: 'long'}); + '</td>';
      }
      else {
        rows_breakdown += '<td colspan="2" style="text-align:left !important;padding-left:15px;">Semaine ' + semaine.toString().padStart(2, '0') + '</td>';
      }
      rows_breakdown += '<td>' + win + '</td>';
      rows_breakdown += '<td>' + loss + '</td>';
      rows_breakdown += '<td>' + (win + loss) + '</td>';
      rows_breakdown += '<td>' + (win / (win+loss)).toLocaleString(undefined, {style:'percent'}) + '</td>';
      rows_breakdown += '<td>' + pips.toLocaleString(undefined, {style:'decimal'}) + '</td>';
      rows_breakdown += '<td>' + profit.toLocaleString(undefined, {style:'currency',currency:'CAD'}) + '</td>';
      rows_breakdown += '<td>' + pips_month.toLocaleString(undefined, {style:'decimal'}) + '</td>';
      rows_breakdown += '<td>' + (profit / capital).toLocaleString(undefined, {style:'percent',minimumFractionDigits:2}) + '</td>';
      rows_breakdown += '</tr>';

      return rows_breakdown;
}
function ObtenirSemaineDuMois(date: Date): number {
    const jour = (typeof date === 'string' 
          ? new Date(date) 
          : date).getDate();
    const numeroSemaine = Math.ceil(jour / 7);
    return numeroSemaine;
}

function RemoveClass(elements: HTMLElement[], className: string): void {
  elements.forEach((element) => {
    $(element).removeClass(className);
  });
}
function AddClass(elements: HTMLElement[], className: string): void {
  elements.forEach((element) => {
    $(element).addClass(className);
  });
}

function GetStartOfWeek(date:Date) {
    // 1. On crée une copie pour ne pas modifier la date originale par référence
    const resultDate = new Date(date);
    
    // 2. Récupère le jour de la semaine (0 = Dimanche, 1 = Lundi, etc.)
    const dayOfWeek = resultDate.getDay(); 
    
    // 3. Recule du nombre de jours nécessaires pour atteindre le dimanche
    resultDate.setDate(resultDate.getDate() - dayOfWeek);
    
    // 4. Optionnel : On remet l'heure à minuit pile (00:00:00) 
    // pour avoir un début de journée propre pour tes indexations
    resultDate.setHours(0, 0, 0, 0);
    
    return resultDate;
}
function debounce<T extends (...args: any[]) => void>(callback: T, delay: number): (...args: Parameters<T>) => void {
    let timer: ReturnType<typeof setTimeout> | undefined;

    return function(this: any, ...args: Parameters<T>): void {
      if (timer) {
        clearTimeout(timer);
      }

      timer = setTimeout(() => {
        callback.apply(this, args);
      }, delay);
    };
  }

// Fonction pour afficher un toast dynamique
function showToast(titre: string, message: string, type: 'success' | 'danger' = 'success'): void {
  const bgColor = type === 'success' ? 'bg-success' : 'bg-danger';
  
  // Mettre à jour le header
  const toastHeader = $('#toastHeader');
  toastHeader.removeClass('bg-success bg-danger').addClass(bgColor).addClass('text-white');
  
  // Mettre à jour le titre et le message
  $('#toastTitle').text(titre);
  $('#toastMessage').text(message);
  
  // Afficher le toast
  const toastElement = document.getElementById('settingSavedToast');
  if (toastElement) {
    const toast = new Toast(toastElement);
    toast.show();
  }
}
// #endregion

