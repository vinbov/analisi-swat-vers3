
"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { InfoIcon, AlertCircle, Download, BarChart3, SearchCode, ClipboardList, BarChart2, Presentation, Printer } from 'lucide-react';
import type { 
    AdWithAngleAnalysis, AngleAnalysisScores, GscAnalyzedData, GscReportType, GscAnalyzedItem,
    ComparisonResult, ScrapedAd 
} from '@/lib/types';

// Importa i componenti di tabella e grafico necessari
import { ComparisonResultsTable } from '@/components/tools/tool1-comparator/table-comparison-results';
import { CommonKeywordsTop10Chart } from '@/components/tools/tool1-comparator/chart-common-keywords-top10';
import { TopOpportunitiesChart } from '@/components/tools/tool1-comparator/chart-top-opportunities';
import { TableAngleAnalysis } from '@/components/tools/tool3-scraper/table-angle-analysis';
import { TableGSC } from '@/components/tools/tool4-gsc-analyzer/table-gsc';
import { ChartGSC } from '@/components/tools/tool4-gsc-analyzer/charts-gsc';
import { ResponsiveContainer, BarChart as ReBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend as ReLegend, PieChart, Pie, Cell } from 'recharts';


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

const CHART_COLORS_MASTER = [
  'hsl(var(--chart-1))', 
  'hsl(var(--chart-2))', 
  'hsl(var(--chart-3))', 
  'hsl(var(--chart-4))', 
  'hsl(var(--chart-5))',
  'hsl(210, 90%, 50%)',
  'hsl(160, 70%, 40%)',
  'hsl(340, 80%, 60%)',
  'hsl(40, 90%, 55%)',
  'hsl(280, 70%, 65%)'
];


export function Tool5MasterReport({ tool1Data, tool3Data, tool4Data }: Tool5MasterReportProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [average7CScores, setAverage7CScores] = useState<AngleAnalysisScores | null>(null);

  useEffect(() => {
    setIsLoading(true); // Start loading when props change or component mounts
    if (tool3Data && tool3Data.adsWithAnalysis) {
        const analyzedAds = tool3Data.adsWithAnalysis.filter(ad => ad.angleAnalysis && !ad.angleAnalysis.error);
        if (analyzedAds.length > 0) {
            const avgScores: AngleAnalysisScores = { C1: 0, C2: 0, C3: 0, C4: 0, C5: 0, C6: 0, C7: 0 };
            analyzedAds.forEach(ad => {
                if (ad.angleAnalysis?.scores) { // scores is nested, check if exists
                    Object.keys(avgScores).forEach(keyStr => {
                        const key = keyStr as keyof AngleAnalysisScores;
                        avgScores[key] += ad.angleAnalysis!.scores[key] || 0;
                    });
                } else if (ad.angleAnalysis) { // Fallback to individual c1Clarity etc. if scores object is not there
                    avgScores.C1 += ad.angleAnalysis.c1Clarity || 0;
                    avgScores.C2 += ad.angleAnalysis.c2Engagement || 0;
                    avgScores.C3 += ad.angleAnalysis.c3Concreteness || 0;
                    avgScores.C4 += ad.angleAnalysis.c4Coherence || 0;
                    avgScores.C5 += ad.angleAnalysis.c5Credibility || 0;
                    avgScores.C6 += ad.angleAnalysis.c6CallToAction || 0;
                    avgScores.C7 += ad.angleAnalysis.c7Context || 0;
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
    setIsLoading(false);
  }, [tool3Data]);


  const getGSCReportItemDisplayName = (type: GscReportType): string => {
      const map: Record<GscReportType, string> = {
          queries: 'Query', pages: 'Pagine', countries: 'Paesi', devices: 'Dispositivi',
          searchAppearance: 'Aspetto nella Ricerca', filters: 'Filtri'
      };
      return map[type] || type;
  };

  if (isLoading) { 
    return <div className="flex justify-center items-center min-h-[300px]"><p>Caricamento dati per il report consolidato...</p></div>;
  }

  let average7CChartData: any[] = [];
  if (average7CScores) {
      average7CChartData = Object.entries(average7CScores).map(([key, value], index) => ({
          name: key.replace('C1', 'Chiarezza').replace('C2', 'Coinvlg.').replace('C3', 'Concret.').replace('C4', 'Coerenza').replace('C5', 'Credib.').replace('C6', 'CTA').replace('C7', 'Contesto'),
          value: value,
          fill: CHART_COLORS_MASTER[index % CHART_COLORS_MASTER.length]
      }));
  }

  return (
    <div className="space-y-8 p-4 md:p-6 text-foreground">
      <header className="text-center py-6">
        <h1 className="text-3xl md:text-4xl font-bold text-sky-700 flex items-center justify-center">
            <Presentation className="mr-3 h-8 w-8 md:h-10 md:w-10" /> Report Consolidato Dettagliato
        </h1>
         <Card className="mt-6 bg-primary/10 border-primary/30">
            <CardHeader>
                <CardTitle className="text-primary text-xl flex items-center"><Printer className="mr-2 h-6 w-6"/>Esportazione Report Completo (PDF)</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-primary-foreground text-base">
                    Per esportare questo report consolidato, che include tutti i dati, le tabelle e i grafici visualizzati di seguito, utilizza la funzione <strong>"Stampa"</strong> del tuo browser (scorciatoia: Ctrl+P o Cmd+P) e seleziona <strong>"Salva come PDF"</strong> come destinazione.
                </p>
                <p className="text-primary-foreground text-sm mt-2">
                    Assicurati che nelle impostazioni di stampa del browser siano selezionate opzioni come "Stampa tutte le pagine" e "Layout Verticale". Il file PDF generato conterrà l'intero contenuto di questa pagina, suddiviso su più pagine se necessario.
                </p>
            </CardContent>
        </Card>
      </header>

      {/* Tool 1 Section */}
      <section>
        <h1 className="text-2xl font-bold text-sky-600 mb-4 pb-2 border-b-2 border-sky-600 flex items-center">
            <BarChart3 className="mr-3 h-7 w-7" />Sintesi: Analizzatore Comparativo Keyword (Tool 1)
        </h1>
        {(!tool1Data || !tool1Data.rawResults || tool1Data.rawResults.length === 0) ? (
            <Alert variant="default"><InfoIcon className="h-4 w-4" /><AlertTitle>Dati Mancanti</AlertTitle><AlertDescription>Nessun dato disponibile dal Tool 1 o analisi non eseguita. Esegui prima l'analisi nel Tool 1.</AlertDescription></Alert>
        ) : (
            <div className="space-y-6">
                <Card>
                    <CardHeader><h3 className="text-xl font-semibold">Conteggio Generale Keyword</h3></CardHeader>
                    <CardContent>
                        <ul className="list-disc pl-6 space-y-1 text-sm">
                          <li>Keyword Comuni: <span className="font-semibold">{tool1Data.comparisonResultsCount.common}</span></li>
                          <li>Punti di Forza (Solo Mio Sito): <span className="font-semibold">{tool1Data.comparisonResultsCount.mySiteOnly}</span></li>
                          <li>Opportunità (Solo Competitor): <span className="font-semibold">{tool1Data.comparisonResultsCount.competitorOnly}</span></li>
                          <li>Totale Keyword Uniche Analizzate: <span className="font-semibold">{tool1Data.comparisonResultsCount.totalUnique}</span></li>
                        </ul>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><h3 className="text-xl font-semibold">Analisi Keyword Comuni: Posizionamento Top 10</h3><CardDescription>Confronto del numero di keyword comuni per cui "Il Mio Sito" e ciascun competitor si posizionano in Top 10.</CardDescription></CardHeader>
                    <CardContent><div className="h-[350px] w-full"><CommonKeywordsTop10Chart results={tool1Data.rawResults} activeCompetitorNames={tool1Data.activeCompetitorNames} /></div></CardContent>
                </Card>
                 <Card>
                    <CardHeader><h3 className="text-xl font-semibold">Top 10 Opportunità per Volume (Keyword Gap)</h3><CardDescription>Le keyword con il più alto volume di ricerca per cui i competitor si posizionano, ma "Il Mio Sito" no.</CardDescription></CardHeader>
                    <CardContent><div className="h-[400px] w-full"><TopOpportunitiesChart results={tool1Data.rawResults} /></div></CardContent>
                </Card>
                <Card>
                    <CardHeader><h3 className="text-xl font-semibold">Dettaglio Tabella: Keyword Comuni</h3></CardHeader>
                    <CardContent><ComparisonResultsTable results={tool1Data.rawResults.filter(r => r.status === 'common')} type="common" activeCompetitorNames={tool1Data.activeCompetitorNames} isDetailPage={true} /></CardContent>
                </Card>
                <Card>
                    <CardHeader><h3 className="text-xl font-semibold">Dettaglio Tabella: Punti di Forza (Solo Mio Sito)</h3></CardHeader>
                    <CardContent><ComparisonResultsTable results={tool1Data.rawResults.filter(r => r.status === 'mySiteOnly')} type="mySiteOnly" activeCompetitorNames={tool1Data.activeCompetitorNames} isDetailPage={true} /></CardContent>
                </Card>
                <Card>
                    <CardHeader><h3 className="text-xl font-semibold">Dettaglio Tabella: Opportunità (Solo Competitor)</h3></CardHeader>
                    <CardContent><ComparisonResultsTable results={tool1Data.rawResults.filter(r => r.status === 'competitorOnly')} type="competitorOnly" activeCompetitorNames={tool1Data.activeCompetitorNames} isDetailPage={true} /></CardContent>
                </Card>
            </div>
        )}
      </section>

      {/* Tool 2 Section Placeholder */}
      <section>
        <h1 className="text-2xl font-bold text-sky-600 mb-4 pb-2 border-b-2 border-sky-600 flex items-center">
            <ClipboardList className="mr-3 h-7 w-7" />Sintesi: Analizzatore Pertinenza & Priorità KW (Tool 2)
        </h1>
        <Alert variant="default">
            <InfoIcon className="h-4 w-4" />
            <AlertTitle>Info Tool 2</AlertTitle>
            <AlertDescription>
              I risultati dettagliati del Tool 2 (Analizzatore Pertinenza & Priorità KW) sono visualizzati e scaricabili come CSV direttamente all'interno della pagina del tool stesso.
            </AlertDescription>
        </Alert>
      </section>

      {/* Tool 3 Section */}
      <section>
        <h1 className="text-2xl font-bold text-sky-600 mb-4 pb-2 border-b-2 border-sky-600 flex items-center">
            <SearchCode className="mr-3 h-7 w-7" />Sintesi: FB Ads Library Scraper & Analisi Angle (Tool 3)
        </h1>
        {(!tool3Data || (!tool3Data.scrapedAds?.length && !tool3Data.adsWithAnalysis?.length)) ? (
             <Alert variant="default"><InfoIcon className="h-4 w-4" /><AlertTitle>Dati Mancanti</AlertTitle><AlertDescription>Nessun dato disponibile dal Tool 3 o analisi non eseguita. Esegui prima scraping e analisi nel Tool 3.</AlertDescription></Alert>
        ) : (
            <div className="space-y-6">
                <Card>
                    <CardHeader><h3 className="text-xl font-semibold">Riepilogo Scraping e Analisi</h3></CardHeader>
                    <CardContent>
                        <p className="text-sm">Annunci Totali Recuperati dallo Scraper: <span className="font-semibold">{tool3Data.scrapedAds?.length || 0}</span></p>
                        <p className="text-sm">Annunci con Analisi Angle (7C) Completata: <span className="font-semibold">{tool3Data.adsWithAnalysis?.filter(ad => ad.angleAnalysis && !ad.analysisError).length || 0}</span></p>
                    </CardContent>
                </Card>
                {average7CScores && average7CChartData.length > 0 && (
                    <Card>
                        <CardHeader><h3 className="text-xl font-semibold">Grafico Punteggi Medi 7C (Annunci Analizzati)</h3></CardHeader>
                        <CardContent>
                           <div className="h-[300px] md:h-[350px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <ReBarChart data={average7CChartData} margin={{ top: 5, right: 20, left: 0, bottom: 25 }}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" angle={-15} textAnchor="end" interval={0} height={50} style={{fontSize: '0.8rem'}}/>
                                        <YAxis domain={[0, 2]} allowDecimals={false}/>
                                        <Tooltip />
                                        <ReLegend wrapperStyle={{paddingTop: '10px'}}/>
                                        <Bar dataKey="value" name="Punteggio Medio">
                                          {average7CChartData.map((entry, index) => (
                                            <Cell key={`cell-avg7c-${index}`} fill={entry.fill} />
                                          ))}
                                        </Bar>
                                    </ReBarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                )}
                 <Card>
                    <CardHeader><h3 className="text-xl font-semibold">Dettaglio Tabella: Analisi Angle Inserzioni (Metodo 7C)</h3></CardHeader>
                    <CardContent>
                        {tool3Data.adsWithAnalysis && tool3Data.adsWithAnalysis.length > 0 ? (
                            <TableAngleAnalysis adsWithAnalysis={tool3Data.adsWithAnalysis} isDetailPage={true} />
                        ) : (
                            <p>Nessuna analisi angle disponibile.</p>
                        )}
                    </CardContent>
                </Card>
            </div>
        )}
      </section>

      {/* Tool 4 Section */}
      <section>
        <h1 className="text-2xl font-bold text-sky-600 mb-4 pb-2 border-b-2 border-sky-600 flex items-center">
            <BarChart2 className="mr-3 h-7 w-7" />Sintesi: Analizzatore Dati GSC (Tool 4)
        </h1>
        {(!tool4Data || !tool4Data.analyzedGscData) ? (
            <Alert variant="default"><InfoIcon className="h-4 w-4" /><AlertTitle>Dati Mancanti</AlertTitle><AlertDescription>Nessun dato disponibile dal Tool 4 o analisi non eseguita. Carica ed analizza un file GSC nel Tool 4.</AlertDescription></Alert>
        ) : (
            <div className="space-y-8">
                {tool4Data.gscFiltersDisplay && (
                    <Card>
                        <CardHeader><h3 className="text-xl font-semibold">Filtri GSC Applicati all'Export</h3></CardHeader>
                        <CardContent>
                            <div className="prose prose-sm max-w-none text-muted-foreground" dangerouslySetInnerHTML={{ __html: tool4Data.gscFiltersDisplay.replace(/<h1[^>]*>/i, '<strong>').replace(/<\/h1>/i, '</strong><br/>').replace(/<h[2-6][^>]*>/gi, '<strong>').replace(/<\/h[2-6]>/gi, '</strong><br/>').replace(/<ul>/gi, '<ul class="list-disc pl-5">').replace(/<li>/gi, '<li class="my-0.5">') }} />
                        </CardContent>
                    </Card>
                )}

                {(['queries', 'pages', 'countries', 'devices', 'searchAppearance'] as GscReportType[]).map((reportType) => {
                    if (!tool4Data.analyzedGscData) return null;
                    const analysis = tool4Data.analyzedGscData[reportType];
                    const itemDisplayName = getGSCReportItemDisplayName(reportType);
                    const chartTypeToUse: 'bar' | 'pie' = reportType === 'devices' ? 'pie' : 'bar';
                    
                    const hasValidAnalysis = analysis && analysis.detailedDataWithDiffs && analysis.detailedDataWithDiffs.length > 0;
                    
                    const chartDataForRender = (hasValidAnalysis && analysis.topItemsByClicksChartData) 
                        ? analysis.topItemsByClicksChartData 
                        : { labels: [], datasets: [{ label: `Clic (Corrente) - ${itemDisplayName}`, data: [], backgroundColor: [] }] };
                    const pieDataForRender = (hasValidAnalysis && analysis.pieChartData) ? analysis.pieChartData : []; // Usa la nuova prop pieChartData
                    const shouldRenderChart = chartTypeToUse === 'bar' ? (hasValidAnalysis && chartDataForRender.labels.length > 0) : (hasValidAnalysis && pieDataForRender && pieDataForRender.length > 0);

                    if (!hasValidAnalysis && isLoading) return null; // Non mostrare nulla se sta ancora caricando e non ci sono dati
                    if (!hasValidAnalysis && !isLoading) { // Mostra un messaggio se ha finito di caricare ma non ci sono dati
                         return (
                            <Card key={reportType}>
                                <CardHeader><h3 className="text-xl font-semibold">Analisi {itemDisplayName}</h3></CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground">Nessun dato trovato per {itemDisplayName} o foglio non presente/vuoto.</p>
                                </CardContent>
                            </Card>
                        );
                    }
                    
                    return (
                        <Card key={reportType}>
                            <CardHeader><h3 className="text-xl font-semibold">Analisi {itemDisplayName}</h3></CardHeader>
                            <CardContent>
                                {analysis.summaryText && <CardDescription className="mb-3 prose prose-sm max-w-none" dangerouslySetInnerHTML={{__html: analysis.summaryText}} /> }
                                
                                {shouldRenderChart ? (
                                    <div className="my-6 h-[350px] md:h-[400px]">
                                        <ChartGSC
                                            data={chartDataForRender}
                                            pieData={pieDataForRender} 
                                            type={chartTypeToUse}
                                            title={`Top Elementi per ${itemDisplayName}`}
                                        />
                                    </div>
                                ) : (
                                    <p className="text-muted-foreground text-center py-4">Nessun dato sufficiente per il grafico di {itemDisplayName}.</p>
                                )}
                                
                                <h4 className="text-md font-semibold text-foreground mt-4 mb-2">Tabella Dati Completa: {itemDisplayName}</h4>
                                <TableGSC data={analysis.detailedDataWithDiffs} itemDisplayName={itemDisplayName} isDetailPage={true}/>
                                <p className="text-xs text-muted-foreground mt-1"><i>[[INSERIRE QUI SCREENSHOT GRAFICO DETTAGLIATO PER {itemDisplayName.toUpperCase()} SE NECESSARIO DAL TOOL 4]]</i></p>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        )}
      </section>

      <footer className="mt-12 py-6 border-t border-border text-center">
          <Card className="bg-primary/10 border-primary/30">
            <CardHeader>
                <CardTitle className="text-primary text-xl flex items-center justify-center"><Printer className="mr-2 h-6 w-6"/>Esportazione Finale Report Completo in PDF</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-primary-foreground text-base">
                    Questa pagina contiene il report consolidato con tutti i dati, tabelle e grafici.
                    <br />Per esportare l'intero report in un unico file PDF multipagina, utilizza la funzione <strong>"Stampa"</strong> del tuo browser (Ctrl+P o Cmd+P) e seleziona <strong>"Salva come PDF"</strong> come destinazione.
                </p>
                <p className="text-primary-foreground text-sm mt-2">
                    Assicurati che nelle opzioni di stampa del browser siano selezionate impostazioni come "Tutte le pagine" e "Layout Verticale" per un risultato ottimale.
                </p>
            </CardContent>
        </Card>
      </footer>
    </div>
  );
}

    