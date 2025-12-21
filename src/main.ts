import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap/dist/js/bootstrap.bundle.js'
import 'bootstrap-icons/font/bootstrap-icons.css'
import '../css/main.css'
import $ from "jquery";
import { Trade, OrderType } from './trade.ts';

// TypeScript entry point for Forex App
$(function() {
  
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
          
          RemplirTblTrade(trades);
        });
  });

    function LireRapport(report:string) 
    {
        const trades: Trade[] = [];

        // Split en lignes
        const lines = report.split(/\r?\n/);

        var data = lines.map(line => line.split(';'));
        for (let i=2; i<data.length; i++) 
        {
            const id = parseInt(data[i][0]);
            if (isNaN(id)) continue;

            const orderType = parseInt(data[i][2]);
            if (orderType > 5) continue;

            const trade: Trade = new Trade(id);
            trade.OpenTime = new Date(data[i][1]);
            trade.OrderType = orderType as OrderType;
            trade.Lots = parseFloat(data[i][3]);
            trade.Symbol = data[i][4];
            trade.OpenPrice = parseFloat(data[i][5]);
            trade.SL = parseFloat(data[i][6]);
            trade.TP = parseFloat(data[i][7]);
            trade.CloseTime = new Date(data[i][8]);
            trade.ClosePrice = parseFloat(data[i][9]);
            trade.Commission = parseFloat(data[i][10]);
            trade.Swap = parseFloat(data[i][11]);
            trade.Profit = parseFloat(data[i][12]);

            trades.push(trade);
        }

        return trades;
    }
    function RemplirTblTrade(trades:Trade[]) 
    {
      $('#tradesTableBody').html('');

      //var groupedBy = new Map<string, Trade[]>();

      var rows = '';
      trades.forEach(trade => 
      {
          rows += '<tr>';
          rows += '<td>' + trade.OpenTime.toISOString() + '</td>';
          rows += '<td>' + trade.Symbol + '</td>';
          rows += '<td style="text-align:right;">' + trade.Profit + '</td>';
          rows += '</tr>';
      });
      
      $('#tradesTableBody').html(rows);
    }

})
