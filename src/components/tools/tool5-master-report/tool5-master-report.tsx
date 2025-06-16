
"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { InfoIcon, BarChart3, SearchCode, ClipboardList, BarChart2, Presentation, Download, FileCode } from 'lucide-react';
import type {
    AdWithAngleAnalysis, AngleAnalysisScores, GscAnalyzedData, GscReportType, GscSectionAnalysis,
    ComparisonResult, ScrapedAd
} from '@/lib/types';

// Importa i componenti di tabella e grafico necessari
import { ComparisonResultsTable } from '@/components/tools/tool1-comparator/table-comparison-results';
import { TableAngleAnalysis } from '@/components/tools/tool3-scraper/table-angle-analysis';
import { TableGSC } from '@/components/tools/tool4-gsc-analyzer/table-gsc';
import { ChartGSC } from '@/components/tools/tool4-gsc-analyzer/charts-gsc';
import { CommonKeywordsTop10Chart } from '@/components/tools/tool1-comparator/chart-common-keywords-top10';
import { TopOpportunitiesChart } from '@/components/tools/tool1-comparator/chart-top-opportunities';
// Non importeremo il grafico a torta della distribuzione keyword di Tool 1 per semplicità nel report HTML,
// l'utente può fare screenshot dal Tool 1.

interface Tool1MasterReportData {
    comparisonResultsCount: {
      common: number;
      mySiteOnly: number;
      competitorOnly: number;
      totalUnique: number;
    };
    rawResults: ComparisonResult[];
    activeCompetitorNames: string[];
}

interface Tool3MasterReportData {
  scrapedAds: ScrapedAd[];
  adsWithAnalysis: AdWithAngleAnalysis[];
}

interface Tool4MasterReportData {
    analyzedGscData: GscAnalyzedData | null;
    gscFiltersDisplay: string;
}

interface Tool5MasterReportProps {
    tool1Data: Tool1MasterReportData | null;
    tool3Data: Tool3MasterReportData | null;
    tool4Data: Tool4MasterReportData | null;
}

export function Tool5MasterReport({ tool1Data, tool3Data, tool4Data }: Tool5MasterReportProps) {
  const [average7CScores, setAverage7CScores] = useState<AngleAnalysisScores | null>(null);

  useEffect(() => {
    if (tool3Data && tool3Data.adsWithAnalysis) {
        const analyzedAds = tool3Data.adsWithAnalysis.filter(ad => ad.angleAnalysis && !ad.angleAnalysis.error);
        if (analyzedAds.length > 0) {
            const avgScores: AngleAnalysisScores = { C1: 0, C2: 0, C3: 0, C4: 0, C5: 0, C6: 0, C7: 0 };
            analyzedAds.forEach(ad => {
                const scores = ad.angleAnalysis?.scores ?? ad.angleAnalysis; 
                if (scores) {
                    avgScores.C1 += (scores as any).c1Clarity ?? scores.C1 ?? 0;
                    avgScores.C2 += (scores as any).c2Engagement ?? scores.C2 ?? 0;
                    avgScores.C3 += (scores as any).c3Concreteness ?? scores.C3 ?? 0;
                    avgScores.C4 += (scores as any).c4Coherence ?? scores.C4 ?? 0;
                    avgScores.C5 += (scores as any).c5Credibility ?? scores.C5 ?? 0;
                    avgScores.C6 += (scores as any).c6CallToAction ?? scores.C6 ?? 0;
                    avgScores.C7 += (scores as any).c7Context ?? scores.C7 ?? 0;
                }
            });
            Object.keys(avgScores).forEach(keyStr => {
                const key = keyStr as keyof AngleAnalysisScores;
                avgScores[key] = parseFloat((avgScores[key] / analyzedAds.length).toFixed(2));
            });
            setAverage7CScores(avgScores);
        } else {
            setAverage7CScores(null);
        }
    } else {
        setAverage7CScores(null);
    }
  }, [tool3Data]);


  const getGSCReportItemDisplayName = (type: GscReportType): string => {
      const map: Record<GscReportType, string> = {
          queries: 'Query', pages: 'Pagine', countries: 'Paesi', devices: 'Dispositivi',
          searchAppearance: 'Aspetto nella Ricerca', filters: 'Filtri'
      };
      return map[type] || type;
  };
  
  const escapeHtml = (unsafe: string | number | null | undefined): string => {
    if (unsafe === null || unsafe === undefined) return '';
    return String(unsafe)
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
  };

  const generateTableHtml = (headers: string[], data: Record<string, any>[], title?: string, tableId?: string): string => {
    if (!data || data.length === 0) return title ? `<h3>${escapeHtml(title)}</h3><p>Nessun dato disponibile.</p>` : '<p>Nessun dato disponibile per questa tabella.</p>';
    let html = title ? `<h3 id="${tableId}-title">${escapeHtml(title)}</h3>` : '';
    html += `<table ${tableId ? `id="${tableId}"` : ''} border="1" style="border-collapse: collapse; width: 100%; margin-bottom: 20px; font-size: 0.9em;">`;
    html += '<thead><tr>';
    headers.forEach(header => html += `<th style="padding: 8px; text-align: left; background-color: #f0f0f0;">${escapeHtml(header)}</th>`);
    html += '</tr></thead><tbody>';
    data.forEach(row => {
      html += '<tr>';
      headers.forEach(header => {
        const cellValue = row[header] !== undefined && row[header] !== null ? String(row[header]) : '';
        // Per 'Analisi Approfondita', permettiamo <br />
        const escapedCellValue = header === 'Analisi Approfondita' ? cellValue.replace(/&lt;br \/&gt;/g, '<br />') : escapeHtml(cellValue);
        html += `<td style="padding: 8px; border: 1px solid #ccc; white-space: normal; word-break: break-word;">${escapedCellValue}</td>`;
      });
      html += '</tr>';
    });
    html += '</tbody></table>';
    return html;
  };
  
  const generateCompleteHTMLReport = () => {
    let html = `
      <!DOCTYPE html>
      <html lang="it">
      <head>
        <meta charset="UTF-8">
        <title>Report Consolidato S.W.A.T.</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; color: #333; }
          .report-container { max-width: 1200px; margin: 0 auto; padding: 15px; background-color: #fff; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
          h1 { color: #1e3a8a; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; margin-top: 0; font-size: 28px; }
          h3 { color: #1e40af; margin-top: 30px; margin-bottom: 15px; border-bottom: 1px solid #ccc; padding-bottom: 5px; font-size: 20px;}
          table { border-collapse: collapse; width: 100%; margin-bottom: 20px; font-size: 14px; }
          th, td { border: 1px solid #ddd; padding: 10px; text-align: left; vertical-align: top; }
          th { background-color: #f2f2f2; font-weight: bold; }
          tr:nth-child(even) td { background-color: #f9f9f9; }
          ul { padding-left: 20px; margin-bottom: 15px; }
          li { margin-bottom: 5px; }
          .placeholder-grafico { background-color: #e9ecef; padding: 20px; text-align: center; margin: 20px 0; border: 1px dashed #adb5bd; color: #555; font-style: italic;}
          .filters-display { background-color: #e0f2fe; border: 1px solid #7dd3fc; padding: 15px; margin-bottom: 20px; border-radius: 5px; font-size: 0.9em; }
          .filters-display h4 { margin-top: 0; color: #0c4a6e; font-size: 1.1em; }
          .print-footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ccc; text-align: center; font-size: 0.8em; color: #777; }
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; margin: 0; padding: 0; }
            .report-container { box-shadow: none; border: none; padding:0; }
            th { background-color: #f2f2f2 !important; } /* Ensure header background prints */
            tr:nth-child(even) td { background-color: #f9f9f9 !important; } /* Ensure zebra stripes print */
            .placeholder-grafico { border: 1px solid #ccc !important; }
          }
        </style>
      </head>
      <body>
        <div class="report-container">
        <h1><span role="img" aria-label="presentation">📊</span> Report Consolidato S.W.A.T.</h1>
    `;

    // Tool 1 Section
    html += `<h1><span role="img" aria-label="barchart">📊</span> Sintesi: Analizzatore Comparativo Keyword (Tool 1)</h1>`;
    if (tool1Data && tool1Data.rawResults && tool1Data.rawResults.length > 0) {
        html += `<h3>Conteggio Generale Keyword</h3>`;
        html += `<ul>
                  <li>Keyword Comuni: <strong>${tool1Data.comparisonResultsCount.common}</strong></li>
                  <li>Punti di Forza (Solo Mio Sito): <strong>${tool1Data.comparisonResultsCount.mySiteOnly}</strong></li>
                  <li>Opportunità (Solo Competitor): <strong>${tool1Data.comparisonResultsCount.competitorOnly}</strong></li>
                  <li>Totale Keyword Uniche Analizzate: <strong>${tool1Data.comparisonResultsCount.totalUnique}</strong></li>
                </ul>`;
        html += `<div class="placeholder-grafico"><p><strong>[GRAFICO: Analisi Keyword Comuni: Posizionamento Top 10 - Visibile nel Tool 1 dell'applicazione. Fare screenshot e inserire qui.]</strong></p></div>`;
        html += `<div class="placeholder-grafico"><p><strong>[GRAFICO: Top 10 Opportunità per Volume (Keyword Gap) - Visibile nel Tool 1 dell'applicazione. Fare screenshot e inserire qui.]</strong></p></div>`;
        
        const commonDataTool1 = tool1Data.rawResults.filter(r => r.status === 'common');
        const commonHeadersTool1 = ['Keyword', 'Mio Sito Pos.', 'Mio Sito URL', ...tool1Data.activeCompetitorNames.flatMap(name => [`${name} Pos.`, `${name} URL`]), 'Volume', 'Difficoltà', 'Opportunity', 'Intento'];
        const commonTableDataTool1 = commonDataTool1.map(item => {
            const row: Record<string, any> = { Keyword: item.keyword, 'Mio Sito Pos.': item.mySiteInfo.pos, 'Mio Sito URL': item.mySiteInfo.url };
            tool1Data.activeCompetitorNames.forEach(name => {
                const compInfo = item.competitorInfo.find(c => c.name === name);
                row[`${name} Pos.`] = compInfo ? compInfo.pos : 'N/P';
                row[`${name} URL`] = compInfo ? compInfo.url : 'N/A';
            });
            row['Volume'] = item.volume ?? 'N/A'; row['Difficoltà'] = item.difficolta ?? 'N/A'; row['Opportunity'] = item.opportunity ?? 'N/A'; row['Intento'] = item.intento ?? 'N/A';
            return row;
        });
        html += generateTableHtml(commonHeadersTool1, commonTableDataTool1, "Tabella Dettaglio: Keyword Comuni", "tool1-common-table");

        const mySiteOnlyDataTool1 = tool1Data.rawResults.filter(r => r.status === 'mySiteOnly');
        const mySiteOnlyHeadersTool1 = ['Keyword', 'Mio Sito Pos.', 'Mio Sito URL', 'Volume', 'Difficoltà', 'Opportunity', 'Intento'];
        const mySiteOnlyTableDataTool1 = mySiteOnlyDataTool1.map(item => ({ Keyword: item.keyword, 'Mio Sito Pos.': item.mySiteInfo.pos, 'Mio Sito URL': item.mySiteInfo.url, Volume: item.volume ?? 'N/A', Difficoltà: item.difficolta ?? 'N/A', Opportunity: item.opportunity ?? 'N/A', Intento: item.intento ?? 'N/A' }));
        html += generateTableHtml(mySiteOnlyHeadersTool1, mySiteOnlyTableDataTool1, "Tabella Dettaglio: Punti di Forza (Solo Mio Sito)", "tool1-mysiteonly-table");
        
        const competitorOnlyDataTool1 = tool1Data.rawResults.filter(r => r.status === 'competitorOnly');
        const competitorOnlyHeadersTool1 = ['Keyword', ...tool1Data.activeCompetitorNames.flatMap(name => [`${name} Pos.`, `${name} URL`]), 'Volume', 'Difficoltà', 'Opportunity', 'Intento'];
        const competitorOnlyTableDataTool1 = competitorOnlyDataTool1.map(item => {
            const row: Record<string, any> = { Keyword: item.keyword };
            tool1Data.activeCompetitorNames.forEach(name => {
                const compInfo = item.competitorInfo.find(c => c.name === name);
                row[`${name} Pos.`] = compInfo ? compInfo.pos : 'N/P';
                row[`${name} URL`] = compInfo ? compInfo.url : 'N/A';
            });
             row['Volume'] = item.volume ?? 'N/A'; row['Difficoltà'] = item.difficolta ?? 'N/A'; row['Opportunity'] = item.opportunity ?? 'N/A'; row['Intento'] = item.intento ?? 'N/A';
            return row;
        });
        html += generateTableHtml(competitorOnlyHeadersTool1, competitorOnlyTableDataTool1, "Tabella Dettaglio: Opportunità (Solo Competitor)", "tool1-competitoronly-table");

    } else { html += "<p>Nessun dato disponibile dal Tool 1 o analisi non eseguita.</p>"; }

    // Tool 2 Section Placeholder (se necessario aggiungere dettagli futuri)
    html += `<h1><span role="img" aria-label="clipboard">📋</span> Sintesi: Analizzatore Pertinenza & Priorità KW (Tool 2)</h1>`;
    html += "<p>I risultati dettagliati del Tool 2 (analisi offline) sono visualizzati e scaricabili come CSV direttamente all'interno della pagina del tool stesso.</p>";
    html += "<p><em>[[INSERIRE QUI EVENTUALI SINTESI MANUALI O SCREENSHOT DELLE TABELLE PIU' SIGNIFICATIVE DEL TOOL 2 SE NECESSARIO PER IL REPORT FINALE]]</em></p>";

    // Tool 3 Section
    html += `<h1><span role="img" aria-label="search">🔍</span> Sintesi: FB Ads Library Scraper & Analisi Angle (Tool 3)</h1>`;
    if (tool3Data && tool3Data.adsWithAnalysis) {
        html += `<p>Annunci Totali Recuperati dallo Scraper: <strong>${tool3Data.scrapedAds?.length || 0}</strong></p>`;
        const analyzedCount = tool3Data.adsWithAnalysis?.filter(ad => ad.angleAnalysis && !ad.angleAnalysis.error).length || 0;
        html += `<p>Annunci con Analisi Angle (7C) Completata: <strong>${analyzedCount}</strong></p>`;
        if (average7CScores && analyzedCount > 0) {
            html += `<h3>Punteggi Medi 7C (su annunci analizzati)</h3><ul>`;
            Object.entries(average7CScores).forEach(([key, value]) => {
                html += `<li>${escapeHtml(key)}: <strong>${value.toFixed(2)}</strong></li>`;
            });
            html += `</ul>`;
            html += `<div class="placeholder-grafico"><p><strong>[GRAFICO: Punteggi Medi 7C - Visibile nel Tool 3 (Pagina Dettaglio Analisi Angle). Fare screenshot e inserire qui.]</strong></p></div>`;
        }
        
        const angleHeadersTool3 = ["Ad (Titolo/Testo)", "C1", "C2", "C3", "C4", "C5", "C6", "C7", "Totale", "Valutazione", "Analisi Approfondita", "Errore"];
        const angleTableDataTool3 = tool3Data.adsWithAnalysis.map(item => ({
            "Ad (Titolo/Testo)": item.titolo ? item.titolo.substring(0, 50) + (item.titolo.length > 50 ? "..." : "") : item.testo.substring(0, 50) + "...",
            "C1": item.angleAnalysis?.c1Clarity ?? 'N/A', "C2": item.angleAnalysis?.c2Engagement ?? 'N/A', "C3": item.angleAnalysis?.c3Concreteness ?? 'N/A',
            "C4": item.angleAnalysis?.c4Coherence ?? 'N/A', "C5": item.angleAnalysis?.c5Credibility ?? 'N/A', "C6": item.angleAnalysis?.c6CallToAction ?? 'N/A',
            "C7": item.angleAnalysis?.c7Context ?? 'N/A', "Totale": item.angleAnalysis?.totalScore ?? 'N/A', "Valutazione": item.angleAnalysis?.evaluation ?? 'N/A',
            "Analisi Approfondita": item.angleAnalysis?.detailedAnalysis?.replace(/\n/g, '<br />') ?? 'N/A', // Mantiene i <br /> per il rendering HTML
            "Errore": item.analysisError || item.angleAnalysis?.error || ''
        }));
        html += generateTableHtml(angleHeadersTool3, angleTableDataTool3, "Tabella Dettaglio: Analisi Angle Inserzioni (Metodo 7C)", "tool3-angle-table");
        html += "<p><em>[[INSERIRE QUI EVENTUALI SCREENSHOT DELLE IMMAGINI DEGLI ANNUNCI PIÙ RILEVANTI DAL TOOL 3, SE NECESSARIO PER IL REPORT FINALE]]</em></p>";
    } else { html += "<p>Nessun dato disponibile dal Tool 3 o analisi non eseguita.</p>"; }

    // Tool 4 Section
    html += `<h1><span role="img" aria-label="barchart2">💹</span> Sintesi: Analizzatore Dati GSC (Tool 4)</h1>`;
    if (tool4Data && tool4Data.analyzedGscData) {
        if (tool4Data.gscFiltersDisplay) { // Sanitize gscFiltersDisplay
            const cleanGscFiltersDisplay = tool4Data.gscFiltersDisplay.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
            html += `<div class="filters-display">${cleanGscFiltersDisplay}</div>`;
        }
        (['queries', 'pages', 'countries', 'devices', 'searchAppearance'] as GscReportType[]).forEach((reportType) => {
            if (!tool4Data.analyzedGscData) return;
            const analysis = tool4Data.analyzedGscData[reportType];
            const itemDisplayName = getGSCReportItemDisplayName(reportType);
            html += `<h3>Analisi ${escapeHtml(itemDisplayName)}</h3>`;
            if (analysis && analysis.detailedDataWithDiffs && analysis.detailedDataWithDiffs.length > 0) {
                const cleanSummaryText = (analysis.summaryText || "").replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
                html += `<p>${cleanSummaryText}</p>`;
                html += `<div class="placeholder-grafico"><p><strong>[GRAFICO: Top Elementi per ${escapeHtml(itemDisplayName)} per Clic - Visibile nel Tool 4 per ${escapeHtml(reportType)}. Fare screenshot e inserire qui.]</strong></p></div>`;
                
                const gscHeaders = [itemDisplayName, "Clic Attuali", "Clic Prec.", "Diff. Clic", "% Clic", "Impr. Attuali", "Impr. Prec.", "Diff. Impr.", "% Impr.", "CTR Attuale", "CTR Prec.", "Diff. CTR", "Pos. Attuale", "Pos. Prec.", "Diff. Pos."];
                const gscTableData = analysis.detailedDataWithDiffs.map(d => ({
                    [itemDisplayName]: d.item,
                    "Clic Attuali": d.clicks_current, "Clic Prec.": d.clicks_previous, "Diff. Clic": d.diff_clicks,
                    "% Clic": isFinite(d.perc_change_clicks) ? (d.perc_change_clicks * 100).toFixed(1) + '%' : (d.perc_change_clicks === Infinity ? '+Inf%' : 'N/A'),
                    "Impr. Attuali": d.impressions_current, "Impr. Prec.": d.impressions_previous, "Diff. Impr.": d.diff_impressions,
                    "% Impr.": isFinite(d.perc_change_impressions) ? (d.perc_change_impressions * 100).toFixed(1) + '%' : (d.perc_change_impressions === Infinity ? '+Inf%' : 'N/A'),
                    "CTR Attuale": (d.ctr_current * 100).toFixed(2) + '%', "CTR Prec.": (d.ctr_previous * 100).toFixed(2) + '%',
                    "Diff. CTR": (d.diff_ctr * 100).toFixed(2) + 'pp',
                    "Pos. Attuale": d.position_current?.toFixed(1) || 'N/A', "Pos. Prec.": d.position_previous?.toFixed(1) || 'N/A',
                    "Diff. Pos.": d.diff_position?.toFixed(1) || 'N/A',
                }));
                html += generateTableHtml(gscHeaders, gscTableData, `Tabella Dati Completa: ${escapeHtml(itemDisplayName)}`, `tool4-${reportType}-table`);
            } else { html += `<p>Nessun dato trovato per ${escapeHtml(itemDisplayName)}.</p>`; }
        });
    } else { html += "<p>Nessun dato disponibile dal Tool 4 o analisi non eseguita.</p>"; }

    html += `
        <div class="print-footer">
          Fine del Report Consolidato S.W.A.T. Per la versione PDF, apri questo file HTML nel browser e utilizza la funzione "File > Stampa > Salva come PDF".
        </div>
      </div></body></html>
    `;

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "report_consolidato_swat_completo.html";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };


  return (
    <div className="tool5-master-report space-y-8 p-4 md:p-6 text-foreground">
      <header className="text-center py-6 no-print">
        <h1 className="text-3xl md:text-4xl font-bold text-sky-700 flex items-center justify-center">
            <Presentation className="mr-3 h-8 w-8 md:h-10 md:w-10" /> Report Consolidato Dettagliato
        </h1>
      </header>
      
      <Card className="no-print">
        <CardHeader>
            <CardTitle className="text-primary text-xl flex items-center"><FileCode className="mr-2 h-6 w-6"/>Esportazione Report HTML Completo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
            <p className="text-primary-foreground text-base">
                Clicca il pulsante qui sotto per scaricare un file HTML contenente tutti i dati dettagliati, le tabelle e le sintesi dalle analisi effettuate.
            </p>
            <p className="text-sm text-muted-foreground">
                Una volta scaricato il file <code>report_consolidato_swat_completo.html</code>, aprilo nel tuo browser. Da lì, potrai utilizzare la funzione "Stampa" del browser (solitamente <code>Ctrl+P</code> o <code>Cmd+P</code>) e scegliere "Salva come PDF" per generare un documento PDF completo e multipagina.
            </p>
            <p className="text-sm text-muted-foreground">
                <strong>Nota sui Grafici:</strong> Il report HTML includerà placeholder testuali per i grafici. Dovrai fare uno screenshot dei grafici desiderati dai tool specifici (Tool 1, 3, 4) e inserirli manualmente nel tuo documento finale (es. Word, Google Docs, PDF) se necessario.
            </p>
            <div>
                <Button onClick={generateCompleteHTMLReport} variant="default" size="lg">
                    <Download className="mr-2 h-5 w-5"/> Scarica Report HTML Completo
                </Button>
            </div>
        </CardContent>
    </Card>

    <div className="mt-12 p-6 bg-sky-50 border border-sky-200 rounded-md shadow no-print">
        <h2 className="text-xl font-semibold text-sky-700 mb-3">Anteprima Contenuto Report HTML (da scaricare)</h2>
        <p className="text-muted-foreground mb-2">
            Il file HTML che scaricherai conterrà tutti i dettagli. Di seguito una breve panoramica del tipo di dati che saranno inclusi:
        </p>
        {(!tool1Data?.rawResults?.length && !tool3Data?.adsWithAnalysis?.length && !tool4Data?.analyzedGscData) && (
             <Alert variant="default" className="my-4">
                <InfoIcon className="h-4 w-4" />
                <AlertTitle>Nessun Dato da Visualizzare</AlertTitle>
                <AlertDescription>
                    Nessuna analisi è stata ancora eseguita nei tool precedenti, oppure i dati non sono stati passati correttamente.
                    Esegui le analisi nei Tool 1, 3 e 4 per popolare il report consolidato.
                </AlertDescription>
            </Alert>
        )}
        {tool1Data && tool1Data.rawResults && tool1Data.rawResults.length > 0 && (
            <div className="my-4">
                <h3 className="text-lg font-medium text-sky-600">Tool 1: Analizzatore Comparativo Keyword</h3>
                <ul className="list-disc list-inside text-sm text-muted-foreground">
                    <li>Keyword Comuni: {tool1Data.comparisonResultsCount.common}</li>
                    <li>Punti di Forza: {tool1Data.comparisonResultsCount.mySiteOnly}</li>
                    <li>Opportunità: {tool1Data.comparisonResultsCount.competitorOnly}</li>
                    <li>Totale Uniche: {tool1Data.comparisonResultsCount.totalUnique}</li>
                </ul>
                <p className="text-xs italic text-gray-500 mt-1">Il report HTML scaricabile conterrà le tabelle dettagliate complete e i placeholder per i grafici.</p>
            </div>
        )}
         {tool3Data && (tool3Data.scrapedAds?.length > 0 || tool3Data.adsWithAnalysis?.length > 0) && (
            <div className="my-4">
                <h3 className="text-lg font-medium text-sky-600">Tool 3: FB Ads Library Scraper</h3>
                 <ul className="list-disc list-inside text-sm text-muted-foreground">
                    <li>Annunci Recuperati: {tool3Data.scrapedAds?.length || 0}</li>
                    <li>Annunci Analizzati (7C): {tool3Data.adsWithAnalysis?.filter(ad => ad.angleAnalysis && !ad.analysisError).length || 0}</li>
                    {average7CScores && <li>Punteggio Medio 7C C1 (Chiarezza): {average7CScores.C1.toFixed(2)}</li>}
                </ul>
                 <p className="text-xs italic text-gray-500 mt-1">Il report HTML scaricabile conterrà la tabella dettagliata completa dell'analisi 7C.</p>
            </div>
        )}
        {tool4Data && tool4Data.analyzedGscData && (
             <div className="my-4">
                <h3 className="text-lg font-medium text-sky-600">Tool 4: Analizzatore Dati GSC</h3>
                {tool4Data.gscFiltersDisplay && <div className="text-xs text-muted-foreground prose prose-xs max-w-none" dangerouslySetInnerHTML={{__html: tool4Data.gscFiltersDisplay.substring(0,200) + (tool4Data.gscFiltersDisplay.length > 200 ? '...' : '')}}/>}
                <ul className="list-disc list-inside text-sm text-muted-foreground mt-1">
                    {Object.entries(tool4Data.analyzedGscData).map(([key, value]) => {
                        if (value && value.detailedDataWithDiffs && value.detailedDataWithDiffs.length > 0) {
                            return <li key={key}>{getGSCReportItemDisplayName(key as GscReportType)} Analizzati: {value.detailedDataWithDiffs.length}</li>;
                        }
                        return null;
                    })}
                </ul>
                <p className="text-xs italic text-gray-500 mt-1">Il report HTML scaricabile conterrà le tabelle dettagliate complete per ogni sezione GSC e i placeholder per i grafici.</p>
            </div>
        )}
    </div>

      <footer className="mt-12 py-6 border-t border-border text-center no-print">
          <Card className="bg-primary/10 border-primary/30">
            <CardHeader>
                <CardTitle className="text-primary text-xl flex items-center justify-center"><FileCode className="mr-2 h-6 w-6"/>Esportazione Finale del Report Consolidato</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                <p className="text-primary-foreground text-base font-medium">
                   Clicca il pulsante "Scarica Report HTML Completo" qui sopra per generare il file.
                </p>
                <p className="text-sm text-muted-foreground">
                   Aprilo nel tuo browser e utilizza "File &gt; Stampa &gt; Salva come PDF" per generare un PDF multipagina, oppure copia il contenuto in un editor di testo se preferisci.
                </p>
            </CardContent>
        </Card>
      </footer>
    </div>
  );
}
