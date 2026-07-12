import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap/dist/js/bootstrap.bundle.js';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '../css/main.css';
import {Toast, Modal} from 'bootstrap';
//import { create, insertMultiple, search, Orama } from '@orama/orama';
import $ from "jquery";
import { Trade, OrderType } from './poco/trade.ts';
import { Database } from './poco/database.ts';
import { KB } from './poco/kb.ts';
import { AI } from './poco/ai.ts';

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
    var req_capital = tx.objectStore(Database.DB_STORE_NAME_SETTING).get(1);
    req_capital.onsuccess = () => {
      $('#iCapital').val(req_capital.result.capital);
    }
  });

  //Orama
  // oramaDb = await create({
  //     schema: {
  //         entry: 'string', //texte brute
  //         embedding: 'vector[768]',
  //     },
  // });

  // const kbs = await Database.GetAllKBEntries();
  // console.log(kbs);
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

  // Insert KB Entry
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
  
  $('#btnManageKb').on('click', function() {
    alert('Action front-end : My KB');
  });
  $('#btnEconomicCalendar').on('click', function() {
    alert('Action front-end : Calendrier économique');
  });
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

