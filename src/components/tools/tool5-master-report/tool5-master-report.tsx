
"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { InfoIcon, AlertCircle, BarChart3, SearchCode, ClipboardList, Presentation, BarChart2, ListChecks, TrendingUp } from 'lucide-react';
import type { AdWithAngleAnalysis, AngleAnalysisScores, GscAnalyzedData, GscReportType } from '@/lib/types';

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
    mySiteTop5Common: Tool1KeywordSummary[];
    competitorsTopCommon: Record<string, Tool1KeywordSummary[]>; // Key is competitor name
    top5Opportunities: Tool1KeywordSummary[];
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


export function Tool5MasterReport() {
  const [tool1DataSummary, setTool1DataSummary] = useState<Tool1MasterReportData | string | null>(null);
  const [tool3DataSummary, setTool3DataSummary] = useState<Tool3Summary | string | null>(null);
  const [tool4DataSummary, setTool4DataSummary] = useState<Tool4SectionSummary[] | string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    
    try {
      const tool1DataString = localStorage.getItem('tool1ResultsForMasterReport');
      if (tool1DataString) {
        const tool1Data: Tool1MasterReportData = JSON.parse(tool1DataString);
         // Basic validation
        if (tool1Data.comparisonResultsCount && tool1Data.mySiteTop5Common && tool1Data.competitorsTopCommon && tool1Data.top5Opportunities) {
            setTool1DataSummary(tool1Data);
        } else {
            setTool1DataSummary("Dati del Tool 1 (Comparatore Keyword) non validi o corrotti in localStorage.");
        }
      } else {
        setTool1DataSummary("Dati del Tool 1 (Comparatore Keyword) non trovati. Esegui prima l'analisi nel Tool 1.");
      }
    } catch (e) {
      console.error("Errore nel caricare/processare i dati del Tool 1:", e);
      setTool1DataSummary("Errore nel caricare i dati del Tool 1.");
    }

    try {
      const tool3DataString = localStorage.getItem('tool3AngleAnalysisData');
      if (tool3DataString) {
        const tool3Data: AdWithAngleAnalysis[] = JSON.parse(tool3DataString);
        if (Array.isArray(tool3Data)) {
            const processedAdsCount = tool3Data.length;
            const analyzedAds = tool3Data.filter(ad => ad.angleAnalysis && !ad.angleAnalysis.error);
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
            setTool3DataSummary(summary);
        } else {
             setTool3DataSummary("Dati del Tool 3 (FB Ads Scraper) non validi o corrotti.");
        }
      } else {
        setTool3DataSummary("Dati del Tool 3 (FB Ads Scraper) non trovati. Esegui prima lo scraping e l'analisi angle.");
      }
    } catch (e) {
      console.error("Errore nel caricare/processare i dati del Tool 3:", e);
      setTool3DataSummary("Errore nel caricare i dati del Tool 3.");
    }

    try {
        const tool4ConsolidatedDataString = localStorage.getItem('tool4ConsolidatedGscData');
        const reportTypes: GscReportType[] = ['queries', 'pages', 'countries', 'devices', 'searchAppearance'];
        const getDisplayName = (type: GscReportType): string => {
            const map: Record<GscReportType, string> = {
                queries: 'Query', pages: 'Pagine', countries: 'Paesi', devices: 'Dispositivi',
                searchAppearance: 'Aspetto nella Ricerca', filters: 'Filtri'
            };
            return map[type] || type;
        };

        if (tool4ConsolidatedDataString) {
            const allTool4Data: GscAnalyzedData = JSON.parse(tool4ConsolidatedDataString);
            const summaries: Tool4SectionSummary[] = reportTypes.map(type => {
                const analysis = allTool4Data[type];
                return {
                    reportType: type,
                    displayName: getDisplayName(type),
                    dataPresent: !!(analysis && analysis.detailedDataWithDiffs && analysis.detailedDataWithDiffs.length > 0),
                    summaryText: analysis?.summaryText
                };
            });
            setTool4DataSummary(summaries);
        } else {
            setTool4DataSummary("Dati del Tool 4 (Analizzatore GSC) non trovati. Esegui prima l'analisi nel Tool 4.");
        }
    } catch (e) {
        console.error("Errore nel caricare/processare i dati del Tool 4:", e);
        setTool4DataSummary("Errore nel caricare i dati del Tool 4.");
    }
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-[300px]"><p>Caricamento report consolidato...</p></div>;
  }

  return (
    <div className="space-y-8">
      <header className="text-center">
        <h2 className="text-3xl font-bold text-sky-700 flex items-center justify-center">
            <Presentation className="mr-3 h-8 w-8" /> Report Consolidato Dati Analisi
        </h2>
        <p className="text-muted-foreground mt-2">
          Una sintesi dei dati elaborati dai vari tool di analisi. Assicurati di aver eseguito le analisi nei tool specifici per visualizzare i dati qui.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><BarChart3 className="mr-2 h-6 w-6 text-sky-600" />Sintesi: Analizzatore Comparativo Keyword (Tool 1)</CardTitle>
        </CardHeader>
        <CardContent>
          {typeof tool1DataSummary === 'string' ? (
            <Alert variant={tool1DataSummary.startsWith("Errore") ? "destructive" : "default"}>
              {tool1DataSummary.startsWith("Errore") ? <AlertCircle className="h-4 w-4" /> : <InfoIcon className="h-4 w-4" />}
              <AlertTitle>{tool1DataSummary.startsWith("Errore") ? "Errore Dati Tool 1" : "Info Dati Tool 1"}</AlertTitle>
              <AlertDescription>{tool1DataSummary}</AlertDescription>
            </Alert>
          ) : tool1DataSummary ? (
            <div className="space-y-4">
                <div>
                    <h4 className="font-semibold text-lg text-foreground mb-1">Conteggio Keyword</h4>
                    <ul className="list-disc pl-5 space-y-1 text-muted-foreground text-sm">
                      <li>Keyword Comuni: <span className="font-semibold text-foreground">{tool1DataSummary.comparisonResultsCount.common}</span></li>
                      <li>Punti di Forza (Solo Mio Sito): <span className="font-semibold text-foreground">{tool1DataSummary.comparisonResultsCount.mySiteOnly}</span></li>
                      <li>Opportunità (Solo Competitor): <span className="font-semibold text-foreground">{tool1DataSummary.comparisonResultsCount.competitorOnly}</span></li>
                      <li>Totale Keyword Uniche Analizzate: <span className="font-semibold text-foreground">{tool1DataSummary.comparisonResultsCount.totalUnique}</span></li>
                    </ul>
                </div>
                 <div>
                    <h4 className="font-semibold text-lg text-foreground mb-1 mt-3 flex items-center"><ListChecks className="mr-2 h-5 w-5 text-green-600" />Top Keyword Comuni (Mio Sito - Top 5)</h4>
                    {tool1DataSummary.mySiteTop5Common.length > 0 ? (
                        <ul className="list-decimal pl-5 space-y-0.5 text-muted-foreground text-sm">
                            {tool1DataSummary.mySiteTop5Common.map(kw => (
                                <li key={`mysite-${kw.keyword}`}>{kw.keyword} (Pos: <span className="font-semibold text-foreground">{kw.position}</span>)</li>
                            ))}
                        </ul>
                    ) : <p className="text-sm text-muted-foreground">Nessuna keyword comune in Top 10 per "Mio Sito".</p>}
                </div>
                {Object.entries(tool1DataSummary.competitorsTopCommon).map(([compName, kws]) => (
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
                    {tool1DataSummary.top5Opportunities.length > 0 ? (
                        <ul className="list-decimal pl-5 space-y-0.5 text-muted-foreground text-sm">
                            {tool1DataSummary.top5Opportunities.map(kw => (
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
              Per consultare questi dati, esegui l'analisi nel Tool 2.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><SearchCode className="mr-2 h-6 w-6 text-sky-600" />Sintesi: FB Ads Library Scraper & Analisi Angle (Tool 3)</CardTitle>
        </CardHeader>
        <CardContent>
          {typeof tool3DataSummary === 'string' ? (
             <Alert variant={tool3DataSummary.startsWith("Errore") ? "destructive" : "default"}>
              {tool3DataSummary.startsWith("Errore") ? <AlertCircle className="h-4 w-4" /> : <InfoIcon className="h-4 w-4" />}
              <AlertTitle>{tool3DataSummary.startsWith("Errore") ? "Errore Dati Tool 3" : "Info Dati Tool 3"}</AlertTitle>
              <AlertDescription>{tool3DataSummary}</AlertDescription>
            </Alert>
          ) : tool3DataSummary ? (
            <div className="space-y-2">
                <p>Annunci Totali Processati dal Scraper: <span className="font-semibold text-foreground">{tool3DataSummary.processedAdsCount}</span></p>
                <p>Annunci con Analisi Angle (7C) Completata: <span className="font-semibold text-foreground">{tool3DataSummary.analyzedAdsCount}</span></p>
                {tool3DataSummary.averageScores && tool3DataSummary.analyzedAdsCount > 0 && (
                    <div>
                        <h4 className="font-medium text-foreground mt-2">Punteggi Medi 7C:</h4>
                        <ul className="list-disc pl-5 text-sm text-muted-foreground">
                            {Object.entries(tool3DataSummary.averageScores).map(([key, value]) => (
                                <li key={key}>{key}: <span className="font-semibold text-foreground">{value}</span></li>
                            ))}
                        </ul>
                    </div>
                )}
                {tool3DataSummary.error && <p className="text-destructive text-sm">Nota: {tool3DataSummary.error}</p>}
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
          {typeof tool4DataSummary === 'string' ? (
            <Alert variant={tool4DataSummary.startsWith("Errore") ? "destructive" : "default"}>
                {tool4DataSummary.startsWith("Errore") ? <AlertCircle className="h-4 w-4" /> : <InfoIcon className="h-4 w-4" />}
                <AlertTitle>{tool4DataSummary.startsWith("Errore") ? "Errore Dati Tool 4" : "Info Dati Tool 4"}</AlertTitle>
                <AlertDescription>{tool4DataSummary}</AlertDescription>
            </Alert>
          ) : Array.isArray(tool4DataSummary) && tool4DataSummary.length > 0 ? (
            <div className="space-y-3">
              {tool4DataSummary.map((section) => (
                <div key={section.reportType}>
                  <h4 className="font-medium text-foreground">Report GSC: {section.displayName}</h4>
                  {section.dataPresent ? (
                    <p className="text-sm text-muted-foreground prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: section.summaryText ? section.summaryText : "Dati presenti, sintesi non disponibile." }} />
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

