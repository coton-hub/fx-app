import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap/dist/js/bootstrap.bundle.js'
import 'bootstrap-icons/font/bootstrap-icons.css'
import {Toast} from 'bootstrap';
import '../css/main.css'
import $ from "jquery";
import { Trade, OrderType } from './trade.ts';

const COMPTE_SELECT = 4735924;
const DB_NAME = "Mac-Fx";
const DB_VERSION = 2;
const DB_STORE_NAME_SETTING = 'setting'

// TypeScript entry point for Forex App
$(function() {

  //Autorisation
  if (navigator.storage && navigator.storage.persist) {
    const promise = navigator.storage.persist();
    promise.then((granted) => {console.log(granted ? "Storage persistant" : "Storage non garanti");});  
  }

  //Load
  const req_db = OpenDB();
  req_db.then((db) => {
    
    const tx = db.transaction(DB_STORE_NAME_SETTING, 'readonly');
    var req_capital = tx.objectStore(DB_STORE_NAME_SETTING).get(1);
    req_capital.onsuccess = () => {
      $('#iCapital').val(req_capital.result.capital);
    }
  });
  
  //Events
  $('#btnTrades').on('click', function() {
    $("#divTrades").removeClass('d-none');
    $("#divSettings").addClass('d-none');
    $("#btnTrades").addClass('active');
    $("#btnSettings").removeClass('active');
  });
  $('#btnSettings').on('click', function() {
    $("#divTrades").addClass('d-none');
    $("#divSettings").removeClass('d-none');
    $("#btnTrades").removeClass('active');
    $("#btnSettings").addClass('active');
  });
  $('#btnGeneral').on('click', function() {
    $("#divGeneral").removeClass('d-none');
    $("#divBreakdown").addClass('d-none');
    $("#btnGeneral").addClass('active');
    $("#btnBreakdown").removeClass('active');
  });
  $('#btnBreakdown').on('click', function() {
    $("#divBreakdown").removeClass('d-none');
    $("#divGeneral").addClass('d-none');
    $("#btnBreakdown").addClass('active');
    $("#btnGeneral").removeClass('active');
  });
  $('#btnSaveSettings').on('click', function() {

    const icapital = $('#iCapital').val()?.toString();

    var capital = 0;
    if (icapital) capital = parseFloat(icapital);
    
    const req_db = OpenDB();

    req_db.then((db) => 
    {
      const tx = db.transaction(DB_STORE_NAME_SETTING, 'readwrite');
      tx.objectStore(DB_STORE_NAME_SETTING).put({id:1, capital:capital});

      $('#btnTrades').trigger('click');

      const toast = new Toast($('#settingSavedToast'));
      toast.show();
    });
  });

  $("#DragDiv").on("dragenter dragover", function(e){ e.preventDefault(); e.stopPropagation(); $(this).addClass("active"); });
  $("#DragDiv").on("dragleave drop", function(e){ e.preventDefault(); e.stopPropagation(); $(this).removeClass("active"); });
  $("#DragDiv").on("drop", function(e)  
  {
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

          RemplirTblTrade(trades);
        });
  });

})

//Functions
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
async function RemplirTblTrade(trades:Trade[])
{
  $('#tradesTableBody').html('');
  $('#breakdownTableBody').html('');

  const db = await OpenDB();

  const tx = db.transaction(DB_STORE_NAME_SETTING, 'readonly');
  const req_setting = await tx.objectStore(DB_STORE_NAME_SETTING).get(1);

  var capital = await new Promise<number>((resolve,reject) => {
    req_setting.onsuccess = () => { resolve(req_setting.result.capital); }
    req_setting.onerror = () => { reject(0) }
  })

  var groupedBy = new Map<string, Trade[]>();

  //Tableau des trades en ordre de date desc
  var rows_trades = '';
  trades.forEach(trade => 
  {
      var key = trade.OpenTime.getFullYear().toString() + trade.OpenTime.getMonth().toString();
      if (!groupedBy.has(key)) groupedBy.set(key, []);

      groupedBy.get(key)?.push(trade);

      rows_trades += '<tr>';
      rows_trades += '<td>' + trade.OpenTime.toISOString() + '</td>';
      rows_trades += '<td>' + trade.Symbol + '</td>';
      rows_trades += '<td style="text-align:right;">' + trade.Profit + '</td>';
      rows_trades += '</tr>';
  });

  //Breakdown par mois
  var total_win = 0;
  var total_loss = 0;
  var total_profit = 0;
  var total_pips = 0;
  var total_pips_profit = 0;

  var rows_breakdown = '';
  groupedBy.forEach(pair => 
    {
      var win = 0;
      var loss = 0;
      var profit = 0;
      var pips = 0;
      var pips_month = 0;

      pair.forEach(trade => 
      {
          if (trade.Profit > 0) win++;
          else loss++;

          profit += trade.Profit;
          pips += CalculatePips(trade.OpenPrice, trade.ClosePrice, trade.Symbol, trade.OrderType);

          const pip_per_price = trade.Lots * 10;
          var pips_profit = trade.Profit / pip_per_price;

          if (trade.Id === COMPTE_SELECT) pips_profit *= 0.1;
          
          pips_month += pips_profit;
          total_pips_profit += pips_profit;
      });

      total_win += win;
      total_loss += loss;
      total_profit += profit;
      total_pips += pips;
      //total_pips_profit += pips_profit;

      rows_breakdown += '<tr>';
      rows_breakdown += '<td style="text-align:left !important;">' + pair[0].OpenTime.getFullYear() + '</td>';
      rows_breakdown += '<td style="text-align:left !important;">' + pair[0].OpenTime.toLocaleDateString("en-CA", {month: 'long'}); + '</td>';
      rows_breakdown += '<td>' + win + '</td>';
      rows_breakdown += '<td>' + loss + '</td>';
      rows_breakdown += '<td>' + (win + loss) + '</td>';
      rows_breakdown += '<td>' + (win / (win+loss)).toLocaleString(undefined, {style:'percent'}) + '</td>';
      rows_breakdown += '<td>' + pips.toLocaleString(undefined, {style:'decimal'}) + '</td>';
      rows_breakdown += '<td>' + profit.toLocaleString(undefined, {style:'currency',currency:'CAD'}) + '</td>';
      rows_breakdown += '<td>' + pips_month.toLocaleString(undefined, {style:'decimal'}) + '</td>';
      rows_breakdown += '<td>' + (profit / capital).toLocaleString(undefined, {style:'percent',minimumFractionDigits:2}) + '</td>';
      rows_breakdown += '</tr>';
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
  
  $('#tradesTableBody').html(rows_trades);
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

//DB Functions
function OpenDB(): Promise<IDBDatabase> 
{
  return new Promise((resolve, reject) => {

      const req = indexedDB.open(DB_NAME, DB_VERSION);

      req.onupgradeneeded = (event) => {
        const db = req.result;
        const old_version = event.oldVersion;

        const migrations = [
          () => MigrateV1(db),
          () => MigrateV2(req)
        ]

        for (let i = old_version;i<migrations.length;i++){
          migrations[i]();
        }
      }

      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
  });
}

//DB Scripts
function MigrateV1(db:IDBDatabase):void {
  const table_setting = db.createObjectStore(DB_STORE_NAME_SETTING, {
              keyPath:"id",
              autoIncrement:true
            });

  table_setting.createIndex("capital", "capital");
  console.log('Migrated V1');
}
function MigrateV2(request:IDBOpenDBRequest):void {
  request.transaction!.objectStore(DB_STORE_NAME_SETTING).add({capital:0});
  console.log('Migrated V2');
}
