
"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { InfoIcon, AlertCircle, BarChart3, SearchCode, ClipboardList, Presentation, BarChart2, ListChecks, TrendingUp, Download } from 'lucide-react';
import type { 
    AdWithAngleAnalysis, AngleAnalysisScores, GscAnalyzedData, GscReportType, 
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
    rawResults: ComparisonResult[]; // For detailed local processing if needed
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
  error?: string;
}

interface Tool4SectionSummary {
  reportType: GscReportType;
  displayName: string;
  summaryText?: string;
  dataPresent: boolean;
}


export function Tool5MasterReport({ tool1Data, tool3Data, tool4Data }: Tool5MasterReportProps) {
  const [tool1DataSummaryForReport, setTool1DataSummaryForReport] = useState<Tool1MasterReportData | string | null>(null);
  const [tool3DataSummaryForReport, setTool3DataSummaryForReport] = useState<Tool3Summary | string | null>(null);
  const [tool4DataSummaryForReport, setTool4DataSummaryForReport] = useState<Tool4SectionSummary[] | string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    
    // Process Tool 1 Data
    if (tool1Data && tool1Data.rawResults.length > 0) {
        const commonKWsResult = tool1Data.rawResults.filter(r => r.status === 'common');
        const mySiteTop5Common = commonKWsResult
            .filter(kw => kw.mySiteInfo.pos !== 'N/P' && typeof kw.mySiteInfo.pos === 'number' && kw.mySiteInfo.pos <= 10)
            .sort((a, b) => (a.mySiteInfo.pos as number) - (b.mySiteInfo.pos as number))
            .slice(0, 5)
            .map(kw => ({ keyword: kw.keyword, position: kw.mySiteInfo.pos }));

        const competitorsTopCommon: Record<string, Tool1KeywordSummary[]> = {};
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

        const top5Opportunities = tool1Data.rawResults
            .filter(r => r.status === 'competitorOnly' && typeof r.volume === 'number' && r.volume > 0)
            .sort((a, b) => (b.volume as number) - (a.volume as number))
            .slice(0, 5)
            .map(kw => ({ keyword: kw.keyword, volume: kw.volume }));
        
        setTool1DataSummaryForReport({
            ...tool1Data,
            mySiteTop5Common,
            competitorsTopCommon,
            top5Opportunities,
        });
    } else if (tool1Data && tool1Data.rawResults.length === 0) {
        setTool1DataSummaryForReport("Dati del Tool 1 (Comparatore Keyword) presenti ma vuoti. Esegui prima l'analisi nel Tool 1.");
    }
     else {
        setTool1DataSummaryForReport("Dati del Tool 1 (Comparatore Keyword) non trovati. Esegui prima l'analisi nel Tool 1.");
    }

    // Process Tool 3 Data
    if (tool3Data && tool3Data.adsWithAnalysis) {
        const processedAdsCount = tool3Data.scrapedAds.length;
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
        }
        setTool3DataSummaryForReport(summary);
    } else {
        setTool3DataSummaryForReport("Dati del Tool 3 (FB Ads Scraper) non trovati. Esegui prima lo scraping e l'analisi angle.");
    }

    // Process Tool 4 Data
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
            return {
                reportType: type,
                displayName: getDisplayName(type),
                dataPresent: !!(analysis && analysis.detailedDataWithDiffs && analysis.detailedDataWithDiffs.length > 0),
                summaryText: analysis?.summaryText
            };
        });
        setTool4DataSummaryForReport(summaries);
    } else {
        setTool4DataSummaryForReport("Dati del Tool 4 (Analizzatore GSC) non trovati. Esegui prima l'analisi nel Tool 4.");
    }
    setIsLoading(false);
  }, [tool1Data, tool3Data, tool4Data]);


  const handleDownloadConsolidatedReport = () => {
    let reportContent = "REPORT CONSOLIDATO ANALISI S.W.A.T.\n";
    reportContent += "========================================\n\n";
    reportContent += "Data del Report: " + new Date().toLocaleDateString("it-IT", { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) + "\n\n";

    reportContent += "--- SINTESI: ANALIZZATORE COMPARATIVO KEYWORD (TOOL 1) ---\n";
    if (typeof tool1DataSummaryForReport === 'string') {
      reportContent += tool1DataSummaryForReport + "\n";
    } else if (tool1DataSummaryForReport) {
      reportContent += "Conteggio Keyword:\n";
      reportContent += `  - Keyword Comuni: ${tool1DataSummaryForReport.comparisonResultsCount.common}\n`;
      reportContent += `  - Punti di Forza (Solo Mio Sito): ${tool1DataSummaryForReport.comparisonResultsCount.mySiteOnly}\n`;
      reportContent += `  - Opportunità (Solo Competitor): ${tool1DataSummaryForReport.comparisonResultsCount.competitorOnly}\n`;
      reportContent += `  - Totale Keyword Uniche Analizzate: ${tool1DataSummaryForReport.comparisonResultsCount.totalUnique}\n\n`;
      
      reportContent += "Mio Sito - Top 5 Keyword Comuni in Top 10:\n";
      if (tool1DataSummaryForReport.mySiteTop5Common && tool1DataSummaryForReport.mySiteTop5Common.length > 0) {
        tool1DataSummaryForReport.mySiteTop5Common.forEach(kw => {
          reportContent += `  - "${kw.keyword}" (Posizione: ${kw.position})\n`;
        });
      } else {
        reportContent += "  - Nessuna keyword comune in Top 10 per Mio Sito.\n";
      }
      reportContent += "\n";

      if (tool1DataSummaryForReport.competitorsTopCommon) {
        Object.entries(tool1DataSummaryForReport.competitorsTopCommon).forEach(([compName, kws]) => {
          reportContent += `${compName} - Top 5 Keyword Comuni in Top 10:\n`;
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

      reportContent += "Top 5 Opportunità (Keyword Gap per Volume):\n";
      if (tool1DataSummaryForReport.top5Opportunities && tool1DataSummaryForReport.top5Opportunities.length > 0) {
        tool1DataSummaryForReport.top5Opportunities.forEach(kw => {
          reportContent += `  - "${kw.keyword}" (Volume: ${kw.volume})\n`;
        });
      } else {
        reportContent += "  - Nessuna opportunità significativa trovata.\n";
      }
      reportContent += "\n*Nota: Per i grafici dettagliati (Keyword Comuni Top 10, Top Opportunità Volume), si prega di fare uno screenshot dal Tool 1 e inserirlo nella presentazione.*\n";
    } else {
      reportContent += "Nessun dato disponibile dal Tool 1.\n";
    }
    reportContent += "--------------------------------------------------\n\n";

    reportContent += "--- SINTESI: ANALIZZATORE PERTINENZA & PRIORITÀ KW (TOOL 2) ---\n";
    reportContent += "I risultati del Tool 2 (analisi di pertinenza e priorità keyword) sono disponibili e scaricabili come CSV direttamente all'interno del tool stesso.\n";
    reportContent += "Per la presentazione, considera di includere un riassunto dei principali insight o screenshot delle tabelle dei risultati più significativi direttamente dal Tool 2.\n";
    reportContent += "-------------------------------------------------------------\n\n";

    reportContent += "--- SINTESI: FB ADS LIBRARY SCRAPER & ANALISI ANGLE (TOOL 3) ---\n";
    if (typeof tool3DataSummaryForReport === 'string') {
      reportContent += tool3DataSummaryForReport + "\n";
    } else if (tool3DataSummaryForReport) {
      reportContent += `Annunci Totali Processati dal Scraper: ${tool3DataSummaryForReport.processedAdsCount}\n`;
      reportContent += `Annunci con Analisi Angle (7C) Completata: ${tool3DataSummaryForReport.analyzedAdsCount}\n\n`;
      if (tool3DataSummaryForReport.averageScores && tool3DataSummaryForReport.analyzedAdsCount > 0) {
        reportContent += "Punteggi Medi 7C (su annunci analizzati):\n";
        Object.entries(tool3DataSummaryForReport.averageScores).forEach(([key, value]) => {
          const readableKey = key.replace('C1', 'C1 Chiarezza')
                               .replace('C2', 'C2 Coinvolgimento')
                               .replace('C3', 'C3 Concretezza')
                               .replace('C4', 'C4 Coerenza')
                               .replace('C5', 'C5 Credibilità')
                               .replace('C6', 'C6 Call To Action')
                               .replace('C7', 'C7 Contesto');
          reportContent += `  - ${readableKey}: ${value.toFixed(2)}\n`;
        });
      } else if (tool3DataSummaryForReport.analyzedAdsCount === 0 && tool3DataSummaryForReport.processedAdsCount > 0) {
        reportContent += "Nessuna analisi dell'angle è stata completata con successo.\n";
      }
      if (tool3DataSummaryForReport.error) {
        reportContent += `\nErrore durante l'analisi del Tool 3: ${tool3DataSummaryForReport.error}\n`;
      }
       reportContent += "\n*Nota: Per visualizzare gli annunci specifici, le loro immagini e le analisi dettagliate (compresi i testi di valutazione), fare riferimento al Tool 3 e al suo report di dettaglio/CSV.*\n";
    } else {
      reportContent += "Nessun dato disponibile dal Tool 3.\n";
    }
    reportContent += "------------------------------------------------------------------\n\n";

    reportContent += "--- SINTESI: ANALIZZATORE DATI GSC (TOOL 4) ---\n";
    if (tool4Data && tool4Data.gscFiltersDisplay) {
        reportContent += tool4Data.gscFiltersDisplay.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() + "\n\n";
    }
    if (typeof tool4DataSummaryForReport === 'string') {
      reportContent += tool4DataSummaryForReport + "\n";
    } else if (Array.isArray(tool4DataSummaryForReport) && tool4DataSummaryForReport.length > 0) {
      tool4DataSummaryForReport.forEach(section => {
        reportContent += `Report GSC: ${section.displayName}\n`;
        if (section.dataPresent && section.summaryText) {
          const cleanedSummary = section.summaryText.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
          reportContent += `  Sintesi: ${cleanedSummary}\n`;
        } else if (section.dataPresent) {
           reportContent += "  Dati presenti, ma sintesi testuale non generata per questo report.\n";
        }
        else {
          reportContent += "  Nessun dato analizzato o foglio non trovato.\n";
        }
        reportContent += "\n";
      });
      reportContent += "*Nota: Per i grafici e le tabelle dettagliate (Top Items, ecc.) per ogni sezione GSC, si prega di fare uno screenshot dal Tool 4 e inserirlo nella presentazione.*\n";
    } else {
      reportContent += "Nessun dato disponibile dal Tool 4.\n";
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
    <div className="space-y-8">
      <header className="text-center">
        <h2 className="text-3xl font-bold text-sky-700 flex items-center justify-center">
            <Presentation className="mr-3 h-8 w-8" /> Report Consolidato Dati Analisi
        </h2>
        <p className="text-muted-foreground mt-2 max-w-3xl mx-auto">
          Una sintesi dei dati elaborati dai vari tool di analisi. Assicurati di aver eseguito le analisi nei tool specifici per visualizzare i dati qui.
          Per i grafici specifici o i report CSV dettagliati di ogni tool, visita il tool corrispondente.
        </p>
         <Button onClick={handleDownloadConsolidatedReport} variant="outline" className="mt-4">
            <Download className="mr-2 h-4 w-4" /> Scarica Report Testuale Consolidato (.txt)
        </Button>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><BarChart3 className="mr-2 h-6 w-6 text-sky-600" />Sintesi: Analizzatore Comparativo Keyword (Tool 1)</CardTitle>
        </CardHeader>
        <CardContent>
          {typeof tool1DataSummaryForReport === 'string' ? (
            <Alert variant={tool1DataSummaryForReport.startsWith("Errore") ? "destructive" : "default"}>
              {tool1DataSummaryForReport.startsWith("Errore") ? <AlertCircle className="h-4 w-4" /> : <InfoIcon className="h-4 w-4" />}
              <AlertTitle>{tool1DataSummaryForReport.startsWith("Errore") ? "Errore Dati Tool 1" : "Info Dati Tool 1"}</AlertTitle>
              <AlertDescription>{tool1DataSummaryForReport}</AlertDescription>
            </Alert>
          ) : tool1DataSummaryForReport ? (
            <div className="space-y-4">
                <div>
                    <h4 className="font-semibold text-lg text-foreground mb-1">Conteggio Keyword</h4>
                    <ul className="list-disc pl-5 space-y-1 text-muted-foreground text-sm">
                      <li>Keyword Comuni: <span className="font-semibold text-foreground">{tool1DataSummaryForReport.comparisonResultsCount.common}</span></li>
                      <li>Punti di Forza (Solo Mio Sito): <span className="font-semibold text-foreground">{tool1DataSummaryForReport.comparisonResultsCount.mySiteOnly}</span></li>
                      <li>Opportunità (Solo Competitor): <span className="font-semibold text-foreground">{tool1DataSummaryForReport.comparisonResultsCount.competitorOnly}</span></li>
                      <li>Totale Keyword Uniche Analizzate: <span className="font-semibold text-foreground">{tool1DataSummaryForReport.comparisonResultsCount.totalUnique}</span></li>
                    </ul>
                </div>
                 <div>
                    <h4 className="font-semibold text-lg text-foreground mb-1 mt-3 flex items-center"><ListChecks className="mr-2 h-5 w-5 text-green-600" />Top Keyword Comuni (Mio Sito - Top 5)</h4>
                    {tool1DataSummaryForReport.mySiteTop5Common && tool1DataSummaryForReport.mySiteTop5Common.length > 0 ? (
                        <ul className="list-decimal pl-5 space-y-0.5 text-muted-foreground text-sm">
                            {tool1DataSummaryForReport.mySiteTop5Common.map(kw => (
                                <li key={`mysite-${kw.keyword}`}>{kw.keyword} (Pos: <span className="font-semibold text-foreground">{kw.position}</span>)</li>
                            ))}
                        </ul>
                    ) : <p className="text-sm text-muted-foreground">Nessuna keyword comune in Top 10 per "Mio Sito".</p>}
                </div>
                {tool1DataSummaryForReport.competitorsTopCommon && Object.entries(tool1DataSummaryForReport.competitorsTopCommon).map(([compName, kws]) => (
                     <div key={compName}>
                        <h4 className="font-semibold text-lg text-foreground mb-1 mt-3 flex items-center"><ListChecks className="mr-2 h-5 w-5 text-blue-600" />Top Keyword Comuni ({compName} - Top 5)</h4>
                        {kws.length > 0 ? (
                            <ul className="list-decimal pl-5 space-y-0.5 text-muted-foreground text-sm">
                                {kws.map(kw => (
                                     <li key={`${compName}-${kw.keyword}`}>{kw.keyword} (Pos: <span className="font-semibold text-foreground">{kw.position}</span>)</li>
                                ))}
                            </ul>
                        ) : <p className="text-sm text-muted-foreground">Nessuna keyword comune in Top 10 per {compName}.</p>}
                    </div>
                ))}
                 <div>
                    <h4 className="font-semibold text-lg text-foreground mb-1 mt-3 flex items-center"><TrendingUp className="mr-2 h-5 w-5 text-orange-600" />Top Opportunità (Keyword Gap - Top 5)</h4>
                    {tool1DataSummaryForReport.top5Opportunities && tool1DataSummaryForReport.top5Opportunities.length > 0 ? (
                        <ul className="list-decimal pl-5 space-y-0.5 text-muted-foreground text-sm">
                            {tool1DataSummaryForReport.top5Opportunities.map(kw => (
                                <li key={`opp-${kw.keyword}`}>{kw.keyword} (Volume: <span className="font-semibold text-foreground">{kw.volume}</span>)</li>
                            ))}
                        </ul>
                    ) : <p className="text-sm text-muted-foreground">Nessuna opportunità significativa trovata.</p>}
                </div>
            </div>
          ) : (
             <p className="text-muted-foreground">Caricamento sintesi Tool 1...</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><ClipboardList className="mr-2 h-6 w-6 text-sky-600" />Sintesi: Analizzatore Pertinenza & Priorità KW (Tool 2)</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <InfoIcon className="h-4 w-4" />
            <AlertTitle>Info Tool 2</AlertTitle>
            <AlertDescription>
              I risultati dell'Analizzatore di Pertinenza & Priorità Keyword (Tool 2) vengono elaborati e visualizzati direttamente all'interno del tool stesso.
              Per consultare questi dati, esegui l'analisi nel Tool 2. Il report scaricabile in CSV è disponibile lì. I risultati non sono attualmente inclusi in questo report consolidato.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><SearchCode className="mr-2 h-6 w-6 text-sky-600" />Sintesi: FB Ads Library Scraper & Analisi Angle (Tool 3)</CardTitle>
        </CardHeader>
        <CardContent>
          {typeof tool3DataSummaryForReport === 'string' ? (
             <Alert variant={tool3DataSummaryForReport.startsWith("Errore") ? "destructive" : "default"}>
              {tool3DataSummaryForReport.startsWith("Errore") ? <AlertCircle className="h-4 w-4" /> : <InfoIcon className="h-4 w-4" />}
              <AlertTitle>{tool3DataSummaryForReport.startsWith("Errore") ? "Errore Dati Tool 3" : "Info Dati Tool 3"}</AlertTitle>
              <AlertDescription>{tool3DataSummaryForReport}</AlertDescription>
            </Alert>
          ) : tool3DataSummaryForReport ? (
            <div className="space-y-2">
                <p>Annunci Totali Processati dal Scraper: <span className="font-semibold text-foreground">{tool3DataSummaryForReport.processedAdsCount}</span></p>
                <p>Annunci con Analisi Angle (7C) Completata: <span className="font-semibold text-foreground">{tool3DataSummaryForReport.analyzedAdsCount}</span></p>
                {tool3DataSummaryForReport.averageScores && tool3DataSummaryForReport.analyzedAdsCount > 0 && (
                    <div>
                        <h4 className="font-medium text-foreground mt-2">Punteggi Medi 7C:</h4>
                        <ul className="list-disc pl-5 text-sm text-muted-foreground">
                            {Object.entries(tool3DataSummaryForReport.averageScores).map(([key, value]) => (
                                <li key={key}>{key.replace('C1', 'C1 Chiarezza').replace('C2', 'C2 Coinvolgimento').replace('C3', 'C3 Concretezza').replace('C4', 'C4 Coerenza').replace('C5', 'C5 Credibilità').replace('C6', 'C6 CTA').replace('C7', 'C7 Contesto')}: <span className="font-semibold text-foreground">{value.toFixed(2)}</span></li>
                            ))}
                        </ul>
                    </div>
                )}
                {tool3DataSummaryForReport.error && <p className="text-destructive text-sm">Nota: {tool3DataSummaryForReport.error}</p>}
            </div>
          ) : (
            <p className="text-muted-foreground">Caricamento sintesi Tool 3...</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><BarChart2 className="mr-2 h-6 w-6 text-sky-600" />Sintesi: Analizzatore Dati GSC (Tool 4)</CardTitle>
        </CardHeader>
        <CardContent>
          {tool4Data && tool4Data.gscFiltersDisplay && (
             <div className="mb-4 prose prose-sm max-w-none text-muted-foreground" dangerouslySetInnerHTML={{ __html: tool4Data.gscFiltersDisplay }} />
          )}
          {typeof tool4DataSummaryForReport === 'string' ? (
            <Alert variant={tool4DataSummaryForReport.startsWith("Errore") ? "destructive" : "default"}>
                {tool4DataSummaryForReport.startsWith("Errore") ? <AlertCircle className="h-4 w-4" /> : <InfoIcon className="h-4 w-4" />}
                <AlertTitle>{tool4DataSummaryForReport.startsWith("Errore") ? "Errore Dati Tool 4" : "Info Dati Tool 4"}</AlertTitle>
                <AlertDescription>{tool4DataSummaryForReport}</AlertDescription>
            </Alert>
          ) : Array.isArray(tool4DataSummaryForReport) && tool4DataSummaryForReport.length > 0 ? (
            <div className="space-y-3">
              {tool4DataSummaryForReport.map((section) => (
                <div key={section.reportType}>
                  <h4 className="font-medium text-foreground">Report GSC: {section.displayName}</h4>
                  {section.dataPresent ? (
                    <p className="text-sm text-muted-foreground prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: section.summaryText ? section.summaryText.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() : "Dati presenti, sintesi non disponibile." }} />
                  ) : (
                    <p className="text-sm text-muted-foreground">Nessun dato analizzato o foglio non trovato per {section.displayName}.</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">Caricamento sintesi Tool 4...</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
