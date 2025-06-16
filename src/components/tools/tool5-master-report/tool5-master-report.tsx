
"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { InfoIcon, AlertCircle, Download, BarChart3, SearchCode, ClipboardList, BarChart2, Presentation } from 'lucide-react';
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
import { ResponsiveContainer, BarChart as ReBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend as ReLegend } from 'recharts';


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
  const [isLoading, setIsLoading] = useState(true);
  const [average7CScores, setAverage7CScores] = useState<AngleAnalysisScores | null>(null);

  useEffect(() => {
    setIsLoading(true);
    if (tool3Data && tool3Data.adsWithAnalysis) {
        const analyzedAds = tool3Data.adsWithAnalysis.filter(ad => ad.angleAnalysis && !ad.angleAnalysis.error);
        if (analyzedAds.length > 0) {
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


  const handleDownloadConsolidatedTextReport = () => {
    let reportContent = "REPORT CONSOLIDATO ANALISI S.W.A.T.\n";
    reportContent += "========================================\n\n";
    reportContent += "Data del Report: " + new Date().toLocaleDateString("it-IT", { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) + "\n\n";

    // Tool 1 Text Summary
    reportContent += "ANALIZZATORE COMPARATIVO KEYWORD (TOOL 1)\n";
    reportContent += "--------------------------------------------------\n";
    if (tool1Data && tool1Data.rawResults && tool1Data.rawResults.length > 0) {
        reportContent += `Keyword Comuni: ${tool1Data.comparisonResultsCount.common}\n`;
        reportContent += `Punti di Forza (Solo Mio Sito): ${tool1Data.comparisonResultsCount.mySiteOnly}\n`;
        reportContent += `Opportunità (Solo Competitor): ${tool1Data.comparisonResultsCount.competitorOnly}\n`;
        reportContent += `Totale Keyword Uniche Analizzate: ${tool1Data.comparisonResultsCount.totalUnique}\n\n`;
        reportContent += "Vedi tabelle e grafici dettagliati nell'output HTML/PDF.\n";
    } else {
        reportContent += "Nessun dato disponibile dal Tool 1 o analisi non eseguita.\n";
    }
    reportContent += "\n\n";

    // Tool 2 Text Summary (Placeholder, as Tool 2 results are managed internally by its component)
    reportContent += "ANALIZZATORE PERTINENZA & PRIORITÀ KW (TOOL 2)\n";
    reportContent += "--------------------------------------------------\n";
    reportContent += "I risultati del Tool 2 sono disponibili e scaricabili come CSV direttamente all'interno del tool stesso.\n\n\n";

    // Tool 3 Text Summary
    reportContent += "FB ADS LIBRARY SCRAPER & ANALISI ANGLE (TOOL 3)\n";
    reportContent += "--------------------------------------------------\n";
    if (tool3Data && (tool3Data.scrapedAds?.length > 0 || tool3Data.adsWithAnalysis?.length > 0)) {
        reportContent += `Annunci Totali Recuperati dallo Scraper: ${tool3Data.scrapedAds?.length || 0}\n`;
        const analyzedCount = tool3Data.adsWithAnalysis?.filter(ad => ad.angleAnalysis && !ad.analysisError).length || 0;
        reportContent += `Annunci con Analisi Angle (7C) Completata: ${analyzedCount}\n`;
        if (average7CScores && analyzedCount > 0) {
            reportContent += "Punteggi Medi 7C (su annunci analizzati):\n";
            Object.entries(average7CScores).forEach(([key, value]) => {
                 reportContent += `  - ${key.replace('C1', 'C1 Chiarezza').replace('C2', 'C2 Coinvolgimento').replace('C3', 'C3 Concretezza').replace('C4', 'C4 Coerenza').replace('C5', 'C5 Credibilità').replace('C6', 'C6 CTA').replace('C7', 'C7 Contesto')}: ${value.toFixed(2)}\n`;
            });
        }
        reportContent += "\nVedi tabelle dettagliate nell'output HTML/PDF.\n";
    } else {
        reportContent += "Nessun dato disponibile dal Tool 3 o analisi non eseguita.\n";
    }
    reportContent += "\n\n";
    
    // Tool 4 Text Summary
    reportContent += "ANALIZZATORE DATI GSC (TOOL 4)\n";
    reportContent += "--------------------------------------------------\n";
    if (tool4Data && tool4Data.gscFiltersDisplay) {
        const cleanedFilters = tool4Data.gscFiltersDisplay.replace(/<h[1-6][^>]*>/gi, '').replace(/<\/?h[1-6][^>]*>/gi, '').replace(/<[^>]*>/g, (match) => {
            if (match.startsWith('<ul')) return '\n'; if (match.startsWith('<li>')) return '  - '; if (match.startsWith('</li')) return '\n'; if (match.startsWith('<p')) return '\n  '; if (match.startsWith('</p')) return '\n'; return '';
        }).replace(/\n\s*\n/g, '\n').trim();
        reportContent += "Filtri GSC Applicati all'Export:\n" + cleanedFilters + "\n\n";
    }
    if (tool4Data && tool4Data.analyzedGscData) {
        const reportTypes: GscReportType[] = ['queries', 'pages', 'countries', 'devices', 'searchAppearance'];
        reportTypes.forEach(type => {
            const analysis = tool4Data.analyzedGscData![type];
            if (analysis && analysis.detailedDataWithDiffs && analysis.detailedDataWithDiffs.length > 0) {
                reportContent += `Report GSC: ${type.charAt(0).toUpperCase() + type.slice(1)}\n`;
                reportContent += `  Sintesi: ${analysis.summaryText.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()}\n`;
            } else {
                reportContent += `Report GSC: ${type.charAt(0).toUpperCase() + type.slice(1)} - Nessun dato analizzato o foglio non trovato.\n`;
            }
        });
        reportContent += "\nVedi tabelle e grafici dettagliati nell'output HTML/PDF.\n";
    } else {
        reportContent += "Nessun dato disponibile dal Tool 4 o analisi non eseguita.\n";
    }
    reportContent += "\n\nFINE DEL REPORT CONSOLIDATO\n";

    const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", "report_consolidato_analisi_swat_testuale.txt");
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  const getGSCReportItemDisplayName = (type: GscReportType): string => {
      const map: Record<GscReportType, string> = {
          queries: 'Query', pages: 'Pagine', countries: 'Paesi', devices: 'Dispositivi',
          searchAppearance: 'Aspetto nella Ricerca', filters: 'Filtri'
      };
      return map[type] || type;
  };

  if (isLoading && !tool1Data && !tool3Data && !tool4Data) { // Mostra solo al caricamento iniziale se nessun dato è ancora arrivato
    return <div className="flex justify-center items-center min-h-[300px]"><p>Caricamento dati per il report consolidato...</p></div>;
  }

  const chartColors = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];
  let average7CChartData: any[] = [];
  if (average7CScores) {
      average7CChartData = Object.entries(average7CScores).map(([key, value]) => ({
          name: key.replace('C1', 'Chiarezza').replace('C2', 'Coinvlg.').replace('C3', 'Concret.').replace('C4', 'Coerenza').replace('C5', 'Credib.').replace('C6', 'CTA').replace('C7', 'Contesto'),
          value: value,
      }));
  }

  return (
    <div className="space-y-12 p-4 md:p-6 text-foreground">
      <header className="text-center py-6">
        <h1 className="text-3xl md:text-4xl font-bold text-sky-700 flex items-center justify-center">
            <Presentation className="mr-3 h-8 w-8 md:h-10 md:w-10" /> Report Consolidato Dettagliato
        </h1>
        <p className="text-muted-foreground mt-3 max-w-3xl mx-auto text-sm md:text-base">
          Questa pagina contiene i risultati dettagliati di tutte le analisi eseguite. Per esportare, utilizza la funzione <strong>"Stampa"</strong> del tuo browser (Ctrl+P o Cmd+P) e scegli <strong>"Salva come PDF"</strong>.
          Il PDF generato includerà tutto il contenuto di questa pagina, suddiviso su più pagine se necessario.
        </p>
         <Button onClick={handleDownloadConsolidatedTextReport} variant="outline" className="mt-6">
            <Download className="mr-2 h-4 w-4" /> Scarica Sintesi Testuale Globale (.txt)
        </Button>
      </header>

      {/* Tool 1 Section */}
      <section>
        <h1 className="text-2xl font-bold text-sky-600 mb-4 pb-2 border-b-2 border-sky-600 flex items-center">
            <BarChart3 className="mr-3 h-7 w-7" />Analizzatore Comparativo Keyword (Tool 1)
        </h1>
        {(!tool1Data || !tool1Data.rawResults || tool1Data.rawResults.length === 0) ? (
            <Alert variant="default"><InfoIcon className="h-4 w-4" /><AlertTitle>Dati Mancanti</AlertTitle><AlertDescription>Nessun dato disponibile dal Tool 1 o analisi non eseguita. Esegui prima l'analisi nel Tool 1.</AlertDescription></Alert>
        ) : (
            <div className="space-y-6">
                <Card>
                    <CardHeader><CardTitle><h3>Conteggio Generale Keyword</h3></CardTitle></CardHeader>
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
                    <CardHeader><CardTitle><h3>Analisi Keyword Comuni: Posizionamento Top 10</h3></CardTitle><CardDescription>Confronto del numero di keyword comuni per cui "Il Mio Sito" e ciascun competitor si posizionano in Top 10.</CardDescription></CardHeader>
                    <CardContent><div className="h-[350px] w-full"><CommonKeywordsTop10Chart results={tool1Data.rawResults} activeCompetitorNames={tool1Data.activeCompetitorNames} /></div></CardContent>
                </Card>
                 <Card>
                    <CardHeader><CardTitle><h3>Top 10 Opportunità per Volume (Keyword Gap)</h3></CardTitle><CardDescription>Le keyword con il più alto volume di ricerca per cui i competitor si posizionano, ma "Il Mio Sito" no.</CardDescription></CardHeader>
                    <CardContent><div className="h-[400px] w-full"><TopOpportunitiesChart results={tool1Data.rawResults} /></div></CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle><h3>Dettaglio Keyword Comuni</h3></CardTitle></CardHeader>
                    <CardContent><ComparisonResultsTable results={tool1Data.rawResults.filter(r => r.status === 'common')} type="common" activeCompetitorNames={tool1Data.activeCompetitorNames} isDetailPage={true} /></CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle><h3>Dettaglio Punti di Forza (Solo Mio Sito)</h3></CardTitle></CardHeader>
                    <CardContent><ComparisonResultsTable results={tool1Data.rawResults.filter(r => r.status === 'mySiteOnly')} type="mySiteOnly" activeCompetitorNames={tool1Data.activeCompetitorNames} isDetailPage={true} /></CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle><h3>Dettaglio Opportunità (Solo Competitor)</h3></CardTitle></CardHeader>
                    <CardContent><ComparisonResultsTable results={tool1Data.rawResults.filter(r => r.status === 'competitorOnly')} type="competitorOnly" activeCompetitorNames={tool1Data.activeCompetitorNames} isDetailPage={true} /></CardContent>
                </Card>
            </div>
        )}
      </section>

      {/* Tool 2 Section Placeholder */}
      <section>
        <h1 className="text-2xl font-bold text-sky-600 mb-4 pb-2 border-b-2 border-sky-600 flex items-center">
            <ClipboardList className="mr-3 h-7 w-7" />Analizzatore Pertinenza & Priorità KW (Tool 2)
        </h1>
        <Alert variant="default">
            <InfoIcon className="h-4 w-4" />
            <AlertTitle>Info Tool 2</AlertTitle>
            <AlertDescription>
              I risultati dettagliati del Tool 2 (Analizzatore Pertinenza & Priorità KW) sono visualizzati e scaricabili direttamente all'interno del tool stesso.
              Considera di fare uno screenshot della tabella dei risultati o di scaricare il CSV da lì per includerlo nel tuo report finale.
            </AlertDescription>
        </Alert>
      </section>

      {/* Tool 3 Section */}
      <section>
        <h1 className="text-2xl font-bold text-sky-600 mb-4 pb-2 border-b-2 border-sky-600 flex items-center">
            <SearchCode className="mr-3 h-7 w-7" />FB Ads Library Scraper & Analisi Angle (Tool 3)
        </h1>
        {(!tool3Data || (!tool3Data.scrapedAds?.length && !tool3Data.adsWithAnalysis?.length)) ? (
             <Alert variant="default"><InfoIcon className="h-4 w-4" /><AlertTitle>Dati Mancanti</AlertTitle><AlertDescription>Nessun dato disponibile dal Tool 3 o analisi non eseguita. Esegui prima scraping e analisi nel Tool 3.</AlertDescription></Alert>
        ) : (
            <div className="space-y-6">
                <Card>
                    <CardHeader><CardTitle><h3>Riepilogo Scraping e Analisi</h3></CardTitle></CardHeader>
                    <CardContent>
                        <p className="text-sm">Annunci Totali Recuperati dallo Scraper: <span className="font-semibold">{tool3Data.scrapedAds?.length || 0}</span></p>
                        <p className="text-sm">Annunci con Analisi Angle (7C) Completata: <span className="font-semibold">{tool3Data.adsWithAnalysis?.filter(ad => ad.angleAnalysis && !ad.analysisError).length || 0}</span></p>
                    </CardContent>
                </Card>
                {average7CScores && (
                    <Card>
                        <CardHeader><CardTitle><h3>Punteggi Medi 7C (Annunci Analizzati)</h3></CardTitle></CardHeader>
                        <CardContent>
                           <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <ReBarChart data={average7CChartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis domain={[0, 2]} allowDecimals={false}/>
                                        <Tooltip />
                                        <ReLegend />
                                        <Bar dataKey="value" name="Punteggio Medio" fill="hsl(var(--chart-2))" />
                                    </ReBarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                )}
                 <Card>
                    <CardHeader><CardTitle><h3>Dettaglio Analisi Angle Inserzioni (Metodo 7C)</h3></CardTitle></CardHeader>
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
            <BarChart2 className="mr-3 h-7 w-7" />Analizzatore Dati GSC (Tool 4)
        </h1>
        {(!tool4Data || !tool4Data.analyzedGscData) ? (
            <Alert variant="default"><InfoIcon className="h-4 w-4" /><AlertTitle>Dati Mancanti</AlertTitle><AlertDescription>Nessun dato disponibile dal Tool 4 o analisi non eseguita. Carica ed analizza un file GSC nel Tool 4.</AlertDescription></Alert>
        ) : (
            <div className="space-y-8">
                {tool4Data.gscFiltersDisplay && (
                    <Card>
                        <CardHeader><CardTitle><h3>Filtri GSC Applicati all'Export</h3></CardTitle></CardHeader>
                        <CardContent>
                            <div className="prose prose-sm max-w-none text-muted-foreground" dangerouslySetInnerHTML={{ __html: tool4Data.gscFiltersDisplay.replace(/<h1[^>]*>/i, '<strong>').replace(/<\/h1>/i, '</strong><br/>').replace(/<h[2-6][^>]*>/gi, '<strong>').replace(/<\/h[2-6]>/gi, '</strong><br/>').replace(/<ul>/gi, '<ul class="list-disc pl-5">').replace(/<li>/gi, '<li class="my-0.5">') }} />
                        </CardContent>
                    </Card>
                )}

                {(['queries', 'pages', 'countries', 'devices', 'searchAppearance'] as GscReportType[]).map((reportType) => {
                    const analysis = tool4Data.analyzedGscData![reportType];
                    const itemDisplayName = getGSCReportItemDisplayName(reportType);
                    const chartTypeToUse: 'bar' | 'pie' = reportType === 'devices' ? 'pie' : 'bar';
                    const hasValidAnalysis = analysis && analysis.detailedDataWithDiffs && analysis.detailedDataWithDiffs.length > 0;
                    
                    const chartDataForRender = (hasValidAnalysis && analysis.topItemsByClicksChartData) 
                        ? analysis.topItemsByClicksChartData 
                        : { labels: [], datasets: [{ label: `Clic (Corrente) - ${itemDisplayName}`, data: [], backgroundColor: [] }] };
                    const pieDataForRender = (hasValidAnalysis && analysis.pieChartData) ? analysis.pieChartData : [];
                    const shouldRenderChart = chartTypeToUse === 'bar' ? (hasValidAnalysis && chartDataForRender.labels.length > 0) : (hasValidAnalysis && pieDataForRender && pieDataForRender.length > 0);

                    return (
                        <Card key={reportType}>
                            <CardHeader><CardTitle><h3>Analisi {itemDisplayName}</h3></CardTitle></CardHeader>
                            <CardContent>
                                {hasValidAnalysis ? (
                                    <>
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
                                    </>
                                ) : (
                                    <p>Nessun dato analizzato o foglio non trovato per {itemDisplayName}.</p>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        )}
      </section>

      <footer className="mt-12 py-6 border-t border-border">
        <div className="p-4 bg-sky-50 border border-sky-200 rounded-md text-center">
            <h2 className="text-sky-700 font-semibold text-lg md:text-xl mb-2">Esportazione Report Completo</h2>
            <p className="text-sky-700 text-sm md:text-base">
                Per esportare questo report consolidato (incluse tabelle e grafici come visualizzati), utilizza la funzione <strong>"Stampa"</strong> del tuo browser (Ctrl+P o Cmd+P) e scegli <strong>"Salva come PDF"</strong>.
                <br/>Assicurati che le impostazioni di stampa siano per "Tutte le pagine" e "Layout Verticale". Il PDF generato conterrà tutto il contenuto di questa pagina, suddiviso su più pagine se necessario.
            </p>
        </div>
      </footer>
    </div>
  );
}

    