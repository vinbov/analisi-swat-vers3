
"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { InfoIcon, AlertCircle, BarChart3, SearchCode, ClipboardList, Presentation, BarChart2, ListChecks, TrendingUp, Download, FileText, Image as ImageIcon } from 'lucide-react';
import type { 
    AdWithAngleAnalysis, AngleAnalysisScores, GscAnalyzedData, GscReportType, GscAnalyzedItem,
    ComparisonResult, ScrapedAd 
} from '@/lib/types';

interface Tool1Counts {
  common: number;
  mySiteOnly: number;
  competitorOnly: number;
  totalUnique: number;
}

interface Tool1KeywordSummary {
  keyword: string;
  position?: number | string | null;
  volume?: number | string | null;
}

interface Tool1MasterReportData {
    comparisonResultsCount: Tool1Counts;
    mySiteTop5Common?: Tool1KeywordSummary[];
    competitorsTopCommon?: Record<string, Tool1KeywordSummary[]>; 
    top5Opportunities?: Tool1KeywordSummary[];
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

interface Tool3Summary {
  processedAdsCount: number;
  analyzedAdsCount: number;
  averageScores?: AngleAnalysisScores;
  topAds?: AdWithAngleAnalysis[];
  error?: string;
}

interface Tool4SectionSummary {
  reportType: GscReportType;
  displayName: string;
  summaryText?: string;
  topItems?: GscAnalyzedItem[];
  dataPresent: boolean;
}


const SimpleTable: React.FC<{headers: string[], data: Record<string, any>[]}> = ({headers, data}) => {
    if (!data || data.length === 0) {
        return <p className="text-sm text-muted-foreground">Nessun dato disponibile per questa tabella.</p>;
    }
    return (
        <div className="overflow-x-auto rounded-md border my-2 shadow-sm bg-card">
            <table className="min-w-full divide-y divide-border text-sm">
                <thead className="bg-muted/50">
                    <tr>
                        {headers.map(header => <th key={header} className="px-3 py-2 text-left font-medium text-muted-foreground tracking-wider">{header}</th>)}
                    </tr>
                </thead>
                <tbody className="bg-card divide-y divide-border">
                    {data.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                            {headers.map(header => <td key={`${rowIndex}-${header}`} className="px-3 py-2 whitespace-nowrap text-foreground">{String(row[header] ?? 'N/D')}</td>)}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};


export function Tool5MasterReport({ tool1Data, tool3Data, tool4Data }: Tool5MasterReportProps) {
  const [tool1SummaryForDisplay, setTool1SummaryForDisplay] = useState<Tool1MasterReportData | string | null>(null);
  const [tool3SummaryForDisplay, setTool3SummaryForDisplay] = useState<Tool3Summary | string | null>(null);
  const [tool4SummaryForDisplay, setTool4SummaryForDisplay] = useState<Tool4SectionSummary[] | string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    
    if (tool1Data && tool1Data.rawResults && tool1Data.rawResults.length > 0) {
        const commonKWsResult = tool1Data.rawResults.filter(r => r.status === 'common');
        const mySiteTop5Common = commonKWsResult
            .filter(kw => kw.mySiteInfo.pos !== 'N/P' && typeof kw.mySiteInfo.pos === 'number' && kw.mySiteInfo.pos <= 10)
            .sort((a, b) => (a.mySiteInfo.pos as number) - (b.mySiteInfo.pos as number))
            .slice(0, 5)
            .map(kw => ({ keyword: kw.keyword, position: kw.mySiteInfo.pos }));

        const competitorsTopCommon: Record<string, Tool1KeywordSummary[]> = {};
        if (tool1Data.activeCompetitorNames) {
            tool1Data.activeCompetitorNames.slice(0, 2).forEach(compName => { 
                competitorsTopCommon[compName] = commonKWsResult
                    .filter(kw => {
                        const compInfo = kw.competitorInfo.find(c => c.name === compName);
                        return compInfo && compInfo.pos !== 'N/P' && typeof compInfo.pos === 'number' && compInfo.pos <= 10;
                    })
                    .sort((a, b) => {
                        const posA = a.competitorInfo.find(c => c.name === compName)?.pos as number;
                        const posB = b.competitorInfo.find(c => c.name === compName)?.pos as number;
                        return posA - posB;
                    })
                    .slice(0, 5)
                    .map(kw => ({ keyword: kw.keyword, position: kw.competitorInfo.find(c => c.name === compName)?.pos || 'N/P' }));
            });
        }

        const top5Opportunities = tool1Data.rawResults
            .filter(r => r.status === 'competitorOnly' && typeof r.volume === 'number' && r.volume > 0)
            .sort((a, b) => (b.volume as number) - (a.volume as number))
            .slice(0, 5)
            .map(kw => ({ keyword: kw.keyword, volume: kw.volume }));
        
        setTool1SummaryForDisplay({
            ...tool1Data,
            mySiteTop5Common,
            competitorsTopCommon,
            top5Opportunities,
        });
    } else if (tool1Data && tool1Data.rawResults && tool1Data.rawResults.length === 0) {
        setTool1SummaryForDisplay("Dati del Tool 1 (Comparatore Keyword) presenti ma vuoti. Esegui prima l'analisi nel Tool 1.");
    } else {
        setTool1SummaryForDisplay("Dati del Tool 1 (Comparatore Keyword) non trovati. Esegui prima l'analisi nel Tool 1.");
    }

    if (tool3Data && tool3Data.adsWithAnalysis) {
        const processedAdsCount = tool3Data.scrapedAds?.length || 0;
        const analyzedAds = tool3Data.adsWithAnalysis.filter(ad => ad.angleAnalysis && !ad.angleAnalysis.error);
        const analyzedAdsCount = analyzedAds.length;
        let summary: Tool3Summary = { processedAdsCount, analyzedAdsCount };

        if (analyzedAdsCount > 0) {
            const avgScores: AngleAnalysisScores = { C1: 0, C2: 0, C3: 0, C4: 0, C5: 0, C6: 0, C7: 0 };
            analyzedAds.forEach(ad => {
                if (ad.angleAnalysis?.scores) {
                    Object.keys(avgScores).forEach(keyStr => {
                        const key = keyStr as keyof AngleAnalysisScores;
                        avgScores[key] += ad.angleAnalysis!.scores[key] || 0;
                    });
                }
            });
            Object.keys(avgScores).forEach(keyStr => {
                const key = keyStr as keyof AngleAnalysisScores;
                avgScores[key] = parseFloat((avgScores[key] / analyzedAdsCount).toFixed(2));
            });
            summary.averageScores = avgScores;
            summary.topAds = analyzedAds.sort((a, b) => (b.angleAnalysis?.totalScore || 0) - (a.angleAnalysis?.totalScore || 0)).slice(0, 3);
        }
        setTool3SummaryForDisplay(summary);
    } else {
        setTool3SummaryForDisplay("Dati del Tool 3 (FB Ads Scraper) non trovati. Esegui prima lo scraping e l'analisi angle.");
    }

    if (tool4Data && tool4Data.analyzedGscData) {
        const reportTypes: GscReportType[] = ['queries', 'pages', 'countries', 'devices', 'searchAppearance'];
        const getDisplayName = (type: GscReportType): string => {
            const map: Record<GscReportType, string> = {
                queries: 'Query', pages: 'Pagine', countries: 'Paesi', devices: 'Dispositivi',
                searchAppearance: 'Aspetto nella Ricerca', filters: 'Filtri'
            };
            return map[type] || type;
        };
        const summaries: Tool4SectionSummary[] = reportTypes.map(type => {
            const analysis = tool4Data.analyzedGscData![type];
            const dataPresent = !!(analysis && analysis.detailedDataWithDiffs && analysis.detailedDataWithDiffs.length > 0);
            return {
                reportType: type,
                displayName: getDisplayName(type),
                dataPresent,
                summaryText: analysis?.summaryText,
                topItems: dataPresent ? analysis.detailedDataWithDiffs.slice(0, 5) : []
            };
        });
        setTool4SummaryForDisplay(summaries);
    } else {
        setTool4SummaryForDisplay("Dati del Tool 4 (Analizzatore GSC) non trovati. Esegui prima l'analisi nel Tool 4.");
    }
    setIsLoading(false);
  }, [tool1Data, tool3Data, tool4Data]);


  const handleDownloadConsolidatedReport = () => {
    let reportContent = "REPORT CONSOLIDATO ANALISI S.W.A.T.\n";
    reportContent += "========================================\n\n";
    reportContent += "Data del Report: " + new Date().toLocaleDateString("it-IT", { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) + "\n\n";

    reportContent += "# SINTESI: ANALIZZATORE COMPARATIVO KEYWORD (TOOL 1)\n";
    if (typeof tool1SummaryForDisplay === 'string') {
      reportContent += tool1SummaryForDisplay + "\n\n";
    } else if (tool1SummaryForDisplay) {
      reportContent += "## Conteggio Keyword\n";
      reportContent += `  - Keyword Comuni: ${tool1SummaryForDisplay.comparisonResultsCount.common}\n`;
      reportContent += `  - Punti di Forza (Solo Mio Sito): ${tool1SummaryForDisplay.comparisonResultsCount.mySiteOnly}\n`;
      reportContent += `  - Opportunità (Solo Competitor): ${tool1SummaryForDisplay.comparisonResultsCount.competitorOnly}\n`;
      reportContent += `  - Totale Keyword Uniche Analizzate: ${tool1SummaryForDisplay.comparisonResultsCount.totalUnique}\n\n`;
      
      reportContent += "## Mio Sito - Top 5 Keyword Comuni in Top 10\n";
      if (tool1SummaryForDisplay.mySiteTop5Common && tool1SummaryForDisplay.mySiteTop5Common.length > 0) {
        tool1SummaryForDisplay.mySiteTop5Common.forEach(kw => {
          reportContent += `  - "${kw.keyword}" (Posizione: ${kw.position})\n`;
        });
      } else {
        reportContent += "  - Nessuna keyword comune in Top 10 per Mio Sito.\n";
      }
      reportContent += "\n";

      if (tool1SummaryForDisplay.competitorsTopCommon) {
        Object.entries(tool1SummaryForDisplay.competitorsTopCommon).forEach(([compName, kws]) => {
          reportContent += `## ${compName} - Top 5 Keyword Comuni in Top 10\n`;
          if (kws.length > 0) {
            kws.forEach(kw => {
              reportContent += `  - "${kw.keyword}" (Posizione: ${kw.position})\n`;
            });
          } else {
            reportContent += `  - Nessuna keyword comune in Top 10 per ${compName}.\n`;
          }
          reportContent += "\n";
        });
      }

      reportContent += "## Top 5 Opportunità (Keyword Gap per Volume)\n";
      if (tool1SummaryForDisplay.top5Opportunities && tool1SummaryForDisplay.top5Opportunities.length > 0) {
        tool1SummaryForDisplay.top5Opportunities.forEach(kw => {
          reportContent += `  - "${kw.keyword}" (Volume: ${kw.volume})\n`;
        });
      } else {
        reportContent += "  - Nessuna opportunità significativa trovata.\n";
      }
      reportContent += "\n[[NOTA: Per i grafici (Keyword Comuni Top 10, Top Opportunità Volume), fare screenshot dal Tool 1 e inserirli manualmente nel documento finale.]]\n\n";
    } else {
      reportContent += "Nessun dato disponibile dal Tool 1.\n\n";
    }
    reportContent += "--------------------------------------------------\n\n";

    reportContent += "# SINTESI: ANALIZZATORE PERTINENZA & PRIORITÀ KW (TOOL 2)\n";
    reportContent += "I risultati del Tool 2 sono disponibili e scaricabili come CSV direttamente all'interno del tool stesso.\n";
    reportContent += "[[NOTA: Considerare di includere screenshot delle tabelle dei risultati più significativi dal Tool 2 nel documento finale.]]\n\n";
    reportContent += "-------------------------------------------------------------\n\n";

    reportContent += "# SINTESI: FB ADS LIBRARY SCRAPER & ANALISI ANGLE (TOOL 3)\n";
    if (typeof tool3SummaryForDisplay === 'string') {
      reportContent += tool3SummaryForDisplay + "\n\n";
    } else if (tool3SummaryForDisplay) {
      reportContent += `Annunci Totali Processati: ${tool3SummaryForDisplay.processedAdsCount}\n`;
      reportContent += `Annunci con Analisi Angle (7C) Completata: ${tool3SummaryForDisplay.analyzedAdsCount}\n\n`;
      if (tool3SummaryForDisplay.averageScores && tool3SummaryForDisplay.analyzedAdsCount > 0) {
        reportContent += "## Punteggi Medi 7C (su annunci analizzati)\n";
        Object.entries(tool3SummaryForDisplay.averageScores).forEach(([key, value]) => {
          const readableKey = key.replace('C1', 'C1 Chiarezza')
                               .replace('C2', 'C2 Coinvolgimento')
                               .replace('C3', 'C3 Concretezza')
                               .replace('C4', 'C4 Coerenza')
                               .replace('C5', 'C5 Credibilità')
                               .replace('C6', 'C6 Call To Action')
                               .replace('C7', 'C7 Contesto');
          reportContent += `  - ${readableKey}: ${value.toFixed(2)}\n`;
        });
         reportContent += "\n[[NOTA: Per il grafico dei punteggi medi 7C, fare uno screenshot dal Tool 3 (Pagina Dettaglio Analisi Angle) e inserirlo manualmente nel documento finale.]]\n";
      } else if (tool3SummaryForDisplay.analyzedAdsCount === 0 && tool3SummaryForDisplay.processedAdsCount > 0) {
        reportContent += "Nessuna analisi dell'angle è stata completata con successo.\n";
      }
      if (tool3SummaryForDisplay.error) {
        reportContent += `\nErrore durante l'analisi del Tool 3: ${tool3SummaryForDisplay.error}\n`;
      }
       reportContent += "\n[[NOTA: Per visualizzare gli annunci specifici e le analisi dettagliate, fare riferimento al Tool 3 e al suo report CSV, oppure fare screenshot della tabella dei Top annunci.]]\n\n";
    } else {
      reportContent += "Nessun dato disponibile dal Tool 3.\n\n";
    }
    reportContent += "------------------------------------------------------------------\n\n";

    reportContent += "# SINTESI: ANALIZZATORE DATI GSC (TOOL 4)\n";
    if (tool4Data && tool4Data.gscFiltersDisplay) {
        const cleanedFilters = tool4Data.gscFiltersDisplay.replace(/<h1[^>]*>Filtri GSC Applicati all'Export:<\/h1>/i, '## Filtri GSC Applicati all\'Export:\n').replace(/<h[1-6][^>]*>/gi, '\n### ').replace(/<\/?h[1-6][^>]*>/gi, '').replace(/<[^>]*>/g, (match) => {
            if (match.startsWith('<ul')) return '\n';
            if (match.startsWith('<li>')) return '  - ';
            if (match.startsWith('</li')) return '\n';
            if (match.startsWith('<p')) return '\n  ';
            if (match.startsWith('</p')) return '\n';
            return ''; // Rimuovi altri tag
        }).replace(/\n\s*\n/g, '\n').trim();
        reportContent += cleanedFilters + "\n\n";
    }
    if (typeof tool4SummaryForDisplay === 'string') {
      reportContent += tool4SummaryForDisplay + "\n\n";
    } else if (Array.isArray(tool4SummaryForDisplay) && tool4SummaryForDisplay.length > 0) {
      tool4SummaryForDisplay.forEach(section => {
        reportContent += `## Report GSC: ${section.displayName}\n`;
        if (section.dataPresent && section.summaryText) {
          const cleanedSummary = section.summaryText.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
          reportContent += `  Sintesi: ${cleanedSummary}\n`;
        } else if (section.dataPresent) {
           reportContent += "  Dati presenti, ma sintesi testuale non generata/disponibile per questo report.\n";
        }
        else {
          reportContent += "  Nessun dato analizzato o foglio non trovato.\n";
        }
        if (section.dataPresent && section.topItems && section.topItems.length > 0) {
            reportContent += `\n  ### Top 5 Elementi per ${section.displayName}:\n`;
            section.topItems.forEach(item => {
                 reportContent += `    - ${item.item}: Clic Attuali: ${item.clicks_current}, Diff. Clic: ${item.diff_clicks}, % Clic: ${isFinite(item.perc_change_clicks) ? (item.perc_change_clicks * 100).toFixed(1) + '%' : (item.perc_change_clicks === Infinity ? '+Inf%' : 'N/A')}\n`;
            });
        }
        reportContent += "\n";
      });
      reportContent += "[[NOTA: Per i grafici dettagliati (Top Items, ecc.) per ogni sezione GSC, fare uno screenshot dal Tool 4 e inserirli manualmente nel documento finale.]]\n\n";
    } else {
      reportContent += "Nessun dato disponibile dal Tool 4.\n\n";
    }
    reportContent += "--------------------------------------------------\n\n";
    
    reportContent += "FINE DEL REPORT CONSOLIDATO\n";

    const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", "report_consolidato_analisi_swat.txt");
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };


  if (isLoading) {
    return <div className="flex justify-center items-center min-h-[300px]"><p>Caricamento report consolidato...</p></div>;
  }

  return (
    <div className="space-y-8 p-4 md:p-6 text-foreground"> {/* Rimossa classe bg-background per stampa */}
      <header className="text-center py-6">
        <h1 className="text-3xl md:text-4xl font-bold text-sky-700 flex items-center justify-center">
            <Presentation className="mr-3 h-8 w-8 md:h-10 md:w-10" /> Report Consolidato Dati Analisi
        </h1>
        <p className="text-muted-foreground mt-3 max-w-3xl mx-auto text-sm md:text-base">
          Questa pagina presenta una sintesi dei dati elaborati dai vari tool. Per un report completo, utilizza la funzione "Stampa" del tuo browser (Ctrl+P o Cmd+P) e scegli "Salva come PDF".
          Il PDF generato dovrebbe includere tutto il contenuto qui visualizzato, distribuito su più pagine se necessario.
        </p>
         <Button onClick={handleDownloadConsolidatedReport} variant="outline" className="mt-6">
            <Download className="mr-2 h-4 w-4" /> Scarica Sintesi Testuale (.txt)
        </Button>
      </header>

      {/* Tool 1 Section */}
      <section className="py-6">
        <h1 className="text-2xl font-bold text-sky-600 mb-4 pb-2 border-b-2 border-sky-600 flex items-center">
            <BarChart3 className="mr-3 h-7 w-7" />Sintesi: Analizzatore Comparativo Keyword (Tool 1)
        </h1>
        {typeof tool1SummaryForDisplay === 'string' ? (
            <Alert variant={tool1SummaryForDisplay.startsWith("Dati del Tool 1 non trovati") || tool1SummaryForDisplay.startsWith("Errore") ? "destructive" : "default"} className="bg-card p-4 rounded-md shadow">
              {tool1SummaryForDisplay.startsWith("Dati del Tool 1 non trovati") || tool1SummaryForDisplay.startsWith("Errore") ? <AlertCircle className="h-4 w-4" /> : <InfoIcon className="h-4 w-4" />}
              <AlertTitle>{tool1SummaryForDisplay.startsWith("Dati del Tool 1 non trovati") || tool1SummaryForDisplay.startsWith("Errore") ? "Errore o Dati Mancanti" : "Info"}</AlertTitle>
              <AlertDescription>{tool1SummaryForDisplay}</AlertDescription>
            </Alert>
        ) : tool1SummaryForDisplay ? (
            <div className="space-y-6 bg-card p-4 md:p-6 rounded-md shadow">
                <div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">Conteggio Keyword</h3>
                    <ul className="list-disc pl-6 space-y-1 text-muted-foreground text-sm">
                      <li>Keyword Comuni: <span className="font-medium text-foreground">{tool1SummaryForDisplay.comparisonResultsCount.common}</span></li>
                      <li>Punti di Forza (Solo Mio Sito): <span className="font-medium text-foreground">{tool1SummaryForDisplay.comparisonResultsCount.mySiteOnly}</span></li>
                      <li>Opportunità (Solo Competitor): <span className="font-medium text-foreground">{tool1SummaryForDisplay.comparisonResultsCount.competitorOnly}</span></li>
                      <li>Totale Keyword Uniche Analizzate: <span className="font-medium text-foreground">{tool1SummaryForDisplay.comparisonResultsCount.totalUnique}</span></li>
                    </ul>
                </div>
                 <div>
                    <h3 className="text-xl font-semibold text-foreground mb-2 mt-4 flex items-center"><ListChecks className="mr-2 h-5 w-5 text-green-600" />Mio Sito - Top 5 Keyword Comuni in Top 10</h3>
                    {tool1SummaryForDisplay.mySiteTop5Common && tool1SummaryForDisplay.mySiteTop5Common.length > 0 ? (
                       <SimpleTable headers={["Keyword", "Posizione"]} data={tool1SummaryForDisplay.mySiteTop5Common.map(kw => ({Keyword: kw.keyword, Posizione: kw.position}))}/>
                    ) : <p className="text-sm text-muted-foreground ml-2">Nessuna keyword comune in Top 10 per "Mio Sito".</p>}
                </div>
                {tool1SummaryForDisplay.competitorsTopCommon && Object.entries(tool1SummaryForDisplay.competitorsTopCommon).map(([compName, kws]) => (
                     <div key={compName}>
                        <h3 className="text-xl font-semibold text-foreground mb-2 mt-4 flex items-center"><ListChecks className="mr-2 h-5 w-5 text-blue-600" />{compName} - Top 5 Keyword Comuni in Top 10</h3>
                        {kws.length > 0 ? (
                            <SimpleTable headers={["Keyword", "Posizione"]} data={kws.map(kw => ({Keyword: kw.keyword, Posizione: kw.position}))}/>
                        ) : <p className="text-sm text-muted-foreground ml-2">Nessuna keyword comune in Top 10 per {compName}.</p>}
                    </div>
                ))}
                 <div>
                    <h3 className="text-xl font-semibold text-foreground mb-2 mt-4 flex items-center"><TrendingUp className="mr-2 h-5 w-5 text-orange-500" />Top 5 Opportunità (Keyword Gap per Volume)</h3>
                    {tool1SummaryForDisplay.top5Opportunities && tool1SummaryForDisplay.top5Opportunities.length > 0 ? (
                       <SimpleTable headers={["Keyword", "Volume"]} data={tool1SummaryForDisplay.top5Opportunities.map(kw => ({Keyword: kw.keyword, Volume: kw.volume}))}/>
                    ) : <p className="text-sm text-muted-foreground ml-2">Nessuna opportunità significativa trovata.</p>}
                </div>
                <Alert variant="default" className="mt-6 bg-sky-50 border-sky-200">
                    <ImageIcon className="h-5 w-5 text-sky-600" />
                    <AlertTitle className="text-sky-700 font-semibold">[[INSERIRE GRAFICI DAL TOOL 1]]</AlertTitle>
                    <AlertDescription className="text-sky-600">
                        Per visualizzare i grafici completi (es. "Keyword Comuni in Top 10 per Sito" e "Top 10 Opportunità per Volume"), visita il <strong>Tool 1</strong>. 
                        Fai uno screenshot di questi grafici per includerli manualmente nel tuo report finale.
                    </AlertDescription>
                </Alert>
            </div>
        ) : (
             <p className="text-muted-foreground p-4">Caricamento sintesi Tool 1...</p>
        )}
      </section>

      {/* Tool 2 Section */}
      <section className="py-6">
        <h1 className="text-2xl font-bold text-sky-600 mb-4 pb-2 border-b-2 border-sky-600 flex items-center">
            <ClipboardList className="mr-3 h-7 w-7" />Sintesi: Analizzatore Pertinenza & Priorità KW (Tool 2)
        </h1>
        <Alert className="bg-card p-4 rounded-md shadow">
            <InfoIcon className="h-4 w-4" />
            <AlertTitle>Info Tool 2</AlertTitle>
            <AlertDescription>
              I risultati dell'Analizzatore di Pertinenza & Priorità Keyword (Tool 2) vengono elaborati e visualizzati direttamente all'interno del tool.
              Per consultare questi dati, esegui l'analisi nel Tool 2. Il report scaricabile in CSV è disponibile lì. 
              <br/><strong>[[NOTA: Considerare di includere screenshot della tabella dei risultati più significativi dal Tool 2 nel documento finale.]]</strong>
            </AlertDescription>
        </Alert>
      </section>

      {/* Tool 3 Section */}
      <section className="py-6">
        <h1 className="text-2xl font-bold text-sky-600 mb-4 pb-2 border-b-2 border-sky-600 flex items-center">
            <SearchCode className="mr-3 h-7 w-7" />Sintesi: FB Ads Library Scraper & Analisi Angle (Tool 3)
        </h1>
        {typeof tool3SummaryForDisplay === 'string' ? (
             <Alert variant={tool3SummaryForDisplay.startsWith("Dati del Tool 3 non trovati") || tool3SummaryForDisplay.startsWith("Errore") ? "destructive" : "default"} className="bg-card p-4 rounded-md shadow">
              {tool3SummaryForDisplay.startsWith("Dati del Tool 3 non trovati") || tool3SummaryForDisplay.startsWith("Errore") ? <AlertCircle className="h-4 w-4" /> : <InfoIcon className="h-4 w-4" />}
              <AlertTitle>{tool3SummaryForDisplay.startsWith("Dati del Tool 3 non trovati") || tool3SummaryForDisplay.startsWith("Errore") ? "Errore o Dati Mancanti" : "Info"}</AlertTitle>
              <AlertDescription>{tool3SummaryForDisplay}</AlertDescription>
            </Alert>
        ) : tool3SummaryForDisplay ? (
            <div className="space-y-4 bg-card p-4 md:p-6 rounded-md shadow">
                <p className="text-sm">Annunci Totali Processati dal Scraper: <span className="font-medium text-foreground">{tool3SummaryForDisplay.processedAdsCount}</span></p>
                <p className="text-sm">Annunci con Analisi Angle (7C) Completata: <span className="font-medium text-foreground">{tool3SummaryForDisplay.analyzedAdsCount}</span></p>
                {tool3SummaryForDisplay.averageScores && tool3SummaryForDisplay.analyzedAdsCount > 0 && (
                    <div>
                        <h3 className="text-xl font-semibold text-foreground mt-3 mb-2">Punteggi Medi 7C:</h3>
                        <ul className="list-disc pl-6 text-sm text-muted-foreground">
                            {Object.entries(tool3SummaryForDisplay.averageScores).map(([key, value]) => (
                                <li key={key}>{key.replace('C1', 'C1 Chiarezza').replace('C2', 'C2 Coinvolgimento').replace('C3', 'C3 Concretezza').replace('C4', 'C4 Coerenza').replace('C5', 'C5 Credibilità').replace('C6', 'C6 CTA').replace('C7', 'C7 Contesto')}: <span className="font-medium text-foreground">{value.toFixed(2)}</span></li>
                            ))}
                        </ul>
                    </div>
                )}
                {tool3SummaryForDisplay.topAds && tool3SummaryForDisplay.topAds.length > 0 && (
                    <div>
                        <h3 className="text-xl font-semibold text-foreground mt-4 mb-2">Top 3 Annunci per Punteggio 7C:</h3>
                        <SimpleTable 
                            headers={["Ad (Titolo/Testo)", "Punteggio Totale", "Valutazione"]} 
                            data={tool3SummaryForDisplay.topAds.map(ad => ({
                                "Ad (Titolo/Testo)": (ad.titolo || ad.testo || 'N/D').substring(0,50) + ((ad.titolo || ad.testo || '').length > 50 ? '...' : ''),
                                "Punteggio Totale": ad.angleAnalysis?.totalScore ?? 'N/D',
                                "Valutazione": ad.angleAnalysis?.evaluation ?? 'N/D'
                            }))}
                        />
                    </div>
                )}
                {tool3SummaryForDisplay.error && <p className="text-destructive text-sm mt-2">Nota: {tool3SummaryForDisplay.error}</p>}
                 <Alert variant="default" className="mt-6 bg-sky-50 border-sky-200">
                    <ImageIcon className="h-5 w-5 text-sky-600" />
                    <AlertTitle className="text-sky-700 font-semibold">[[INSERIRE GRAFICO PUNTEGGI MEDI 7C DAL TOOL 3]]</AlertTitle>
                    <AlertDescription className="text-sky-600">
                        Per visualizzare il grafico dei punteggi medi 7C e le tabelle dettagliate degli annunci, visita il <strong>Tool 3 (Pagina Dettaglio Analisi Angle)</strong>. 
                        Fai uno screenshot per includerlo manualmente nel tuo report.
                    </AlertDescription>
                </Alert>
            </div>
        ) : (
            <p className="text-muted-foreground p-4">Caricamento sintesi Tool 3...</p>
        )}
      </section>

      {/* Tool 4 Section */}
      <section className="py-6">
        <h1 className="text-2xl font-bold text-sky-600 mb-4 pb-2 border-b-2 border-sky-600 flex items-center">
            <BarChart2 className="mr-3 h-7 w-7" />Sintesi: Analizzatore Dati GSC (Tool 4)
        </h1>
        <div className="bg-card p-4 md:p-6 rounded-md shadow">
            {tool4Data && tool4Data.gscFiltersDisplay && (
                <div className="mb-6">
                    <h3 className="text-xl font-semibold text-foreground mb-2">Filtri GSC Applicati all'Export:</h3>
                    <div className="prose prose-sm max-w-none text-muted-foreground" dangerouslySetInnerHTML={{ __html: tool4Data.gscFiltersDisplay.replace(/<h1[^>]*>/i, '<strong>').replace(/<\/h1>/i, '</strong><br/>').replace(/<h[2-6][^>]*>/gi, '<strong>').replace(/<\/h[2-6]>/gi, '</strong><br/>').replace(/<ul>/gi, '<ul class="list-disc pl-5">').replace(/<li>/gi, '<li class="my-0.5">') }} />
                </div>
            )}
            {typeof tool4SummaryForDisplay === 'string' ? (
                <Alert variant={tool4SummaryForDisplay.startsWith("Dati del Tool 4 non trovati") || tool4SummaryForDisplay.startsWith("Errore") ? "destructive" : "default"}>
                    {tool4SummaryForDisplay.startsWith("Dati del Tool 4 non trovati") || tool4SummaryForDisplay.startsWith("Errore") ? <AlertCircle className="h-4 w-4" /> : <InfoIcon className="h-4 w-4" />}
                    <AlertTitle>{tool4SummaryForDisplay.startsWith("Dati del Tool 4 non trovati") || tool4SummaryForDisplay.startsWith("Errore") ? "Errore o Dati Mancanti" : "Info"}</AlertTitle>
                    <AlertDescription>{tool4SummaryForDisplay}</AlertDescription>
                </Alert>
            ) : Array.isArray(tool4SummaryForDisplay) && tool4SummaryForDisplay.length > 0 ? (
                <div className="space-y-8">
                {tool4SummaryForDisplay.map((section) => (
                    <div key={section.reportType}>
                    <h3 className="text-xl font-semibold text-foreground mb-2">{section.displayName}</h3>
                    {section.dataPresent ? (
                        <>
                            {section.summaryText && <p className="text-sm text-muted-foreground prose prose-sm max-w-none mb-3" dangerouslySetInnerHTML={{ __html: section.summaryText.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() }} />}
                            {section.topItems && section.topItems.length > 0 && (
                                <>
                                    <h4 className="text-md font-medium text-foreground mt-1 mb-1">Top 5 Elementi:</h4>
                                    <SimpleTable 
                                        headers={[section.displayName, "Clic Attuali", "Diff. Clic", "% Clic", "Impr. Attuali", "Diff. Impr.", "% Impr."]} 
                                        data={section.topItems.map(item => ({
                                            [section.displayName]: String(item.item).substring(0,40) + (String(item.item).length > 40 ? '...' : ''),
                                            "Clic Attuali": item.clicks_current.toLocaleString(),
                                            "Diff. Clic": item.diff_clicks.toLocaleString(),
                                            "% Clic": isFinite(item.perc_change_clicks) ? (item.perc_change_clicks * 100).toFixed(1) + '%' : (item.perc_change_clicks === Infinity ? '+Inf%' : 'N/A'),
                                            "Impr. Attuali": item.impressions_current.toLocaleString(),
                                            "Diff. Impr.": item.diff_impressions.toLocaleString(),
                                            "% Impr.": isFinite(item.perc_change_impressions) ? (item.perc_change_impressions * 100).toFixed(1) + '%' : (item.perc_change_impressions === Infinity ? '+Inf%' : 'N/A'),
                                        }))}
                                    />
                                </>
                            )}
                        </>
                    ) : (
                        <p className="text-sm text-muted-foreground ml-2">Nessun dato analizzato o foglio non trovato per {section.displayName}.</p>
                    )}
                    </div>
                ))}
                <Alert variant="default" className="mt-6 bg-sky-50 border-sky-200">
                    <ImageIcon className="h-5 w-5 text-sky-600" />
                    <AlertTitle className="text-sky-700 font-semibold">[[INSERIRE GRAFICI DAL TOOL 4]]</AlertTitle>
                    <AlertDescription className="text-sky-600">
                        Per i grafici dettagliati (Top Items, Distribuzione Dispositivi, ecc.) per ogni sezione GSC, visita il <strong>Tool 4</strong>.
                        Fai uno screenshot di questi grafici per includerli manualmente nel tuo report finale.
                    </AlertDescription>
                </Alert>
                </div>
            ) : (
                <p className="text-muted-foreground p-4">Caricamento sintesi Tool 4...</p>
            )}
        </div>
      </section>

      <footer className="mt-12 py-6 border-t border-border">
        <div className="p-4 bg-sky-50 border border-sky-200 rounded-md text-center">
            <h2 className="text-sky-700 font-semibold text-lg md:text-xl mb-2">Come Esportare Questo Report</h2>
            <p className="text-sky-700 text-sm md:text-base">
                Per un report formattato di questa pagina (testo e tabelle), utilizza la funzione <strong>"Stampa"</strong> del tuo browser (Ctrl+P o Cmd+P) e scegli <strong>"Salva come PDF"</strong>.
                <br/>Assicurati che le impostazioni di stampa siano per "Tutte le pagine" e "Layout Verticale".
                <br/>Per i grafici, visita i tool specifici, fai uno screenshot e inseriscili manualmente nel tuo documento PDF/Word finale.
            </p>
        </div>
      </footer>
    </div>
  );
}

    
