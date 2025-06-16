
"use client";

import React, { useEffect, useState }
from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { InfoIcon, BarChart3, SearchCode, ClipboardList, BarChart2, Presentation, Printer, Download } from 'lucide-react';
import type {
    AdWithAngleAnalysis, AngleAnalysisScores, GscAnalyzedData, GscReportType, GscSectionAnalysis,
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
import { exportToCSV } from '@/lib/csv';


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
    setIsLoading(true);
    if (tool3Data && tool3Data.adsWithAnalysis) {
        const analyzedAds = tool3Data.adsWithAnalysis.filter(ad => ad.angleAnalysis && !ad.angleAnalysis.error);
        if (analyzedAds.length > 0) {
            const avgScores: AngleAnalysisScores = { C1: 0, C2: 0, C3: 0, C4: 0, C5: 0, C6: 0, C7: 0 };
            analyzedAds.forEach(ad => {
                const scores = ad.angleAnalysis?.scores ?? ad.angleAnalysis; // Handle old and new structure
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
    setIsLoading(false);
  }, [tool3Data]);


  const getGSCReportItemDisplayName = (type: GscReportType): string => {
      const map: Record<GscReportType, string> = {
          queries: 'Query', pages: 'Pagine', countries: 'Paesi', devices: 'Dispositivi',
          searchAppearance: 'Aspetto nella Ricerca', filters: 'Filtri'
      };
      return map[type] || type;
  };

  const generateTextReport = () => {
    let report = "REPORT CONSOLIDATO S.W.A.T.\n\n";
    report += "========================================\n";
    report += "Sintesi: Analizzatore Comparativo Keyword (Tool 1)\n";
    report += "========================================\n";
    if (tool1Data && tool1Data.rawResults && tool1Data.rawResults.length > 0) {
        report += `Conteggio Generale Keyword:\n`;
        report += `- Keyword Comuni: ${tool1Data.comparisonResultsCount.common}\n`;
        report += `- Punti di Forza (Solo Mio Sito): ${tool1Data.comparisonResultsCount.mySiteOnly}\n`;
        report += `- Opportunità (Solo Competitor): ${tool1Data.comparisonResultsCount.competitorOnly}\n`;
        report += `- Totale Keyword Uniche Analizzate: ${tool1Data.comparisonResultsCount.totalUnique}\n\n`;

        const mySiteTop10Common = tool1Data.rawResults
            .filter(r => r.status === 'common' && r.mySiteInfo.pos !== 'N/P' && typeof r.mySiteInfo.pos === 'number' && r.mySiteInfo.pos <= 10)
            .sort((a, b) => (a.mySiteInfo.pos as number) - (b.mySiteInfo.pos as number))
            .slice(0, 5);
        report += "Mio Sito - Top 5 Keyword Comuni in Top 10:\n";
        if (mySiteTop10Common.length > 0) {
            mySiteTop10Common.forEach(kw => report += `- ${kw.keyword} (Pos: ${kw.mySiteInfo.pos})\n`);
        } else {
            report += "- Nessuna\n";
        }
        report += "\n";

        tool1Data.activeCompetitorNames.slice(0, 2).forEach(compName => {
            report += `${compName} - Top 5 Keyword Comuni in Top 10:\n`;
            const competitorKWs = tool1Data.rawResults
                .filter(r => r.status === 'common' && r.competitorInfo.find(c => c.name === compName && c.pos !== 'N/P' && typeof c.pos === 'number' && c.pos <= 10))
                .sort((a,b) => {
                    const posA = a.competitorInfo.find(c => c.name === compName)?.pos as number;
                    const posB = b.competitorInfo.find(c => c.name === compName)?.pos as number;
                    return posA - posB;
                })
                .slice(0, 5);
            if (competitorKWs.length > 0) {
                competitorKWs.forEach(kw => report += `- ${kw.keyword} (Pos: ${kw.competitorInfo.find(c => c.name === compName)?.pos})\n`);
            } else {
                report += "- Nessuna\n";
            }
            report += "\n";
        });

        const top10Opportunities = tool1Data.rawResults
            .filter(r => r.status === 'competitorOnly' && typeof r.volume === 'number' && r.volume > 0)
            .sort((a, b) => (b.volume as number) - (a.volume as number))
            .slice(0, 5);
        report += "Top 5 Opportunità per Volume (Keyword Gap):\n";
        if (top10Opportunities.length > 0) {
            top10Opportunities.forEach(kw => report += `- ${kw.keyword} (Volume: ${kw.volume})\n`);
        } else {
            report += "- Nessuna\n";
        }
    } else {
        report += "Nessun dato disponibile dal Tool 1 o analisi non eseguita.\n";
    }
    report += "\n\n";

    report += "========================================\n";
    report += "Sintesi: Analizzatore Pertinenza & Priorità KW (Tool 2)\n";
    report += "========================================\n";
    report += "I risultati dettagliati del Tool 2 sono scaricabili come CSV direttamente dal tool.\n";
    report += "\n\n";

    report += "========================================\n";
    report += "Sintesi: FB Ads Library Scraper & Analisi Angle (Tool 3)\n";
    report += "========================================\n";
    if (tool3Data) {
        report += `Annunci Totali Recuperati dallo Scraper: ${tool3Data.scrapedAds?.length || 0}\n`;
        const analyzedCount = tool3Data.adsWithAnalysis?.filter(ad => ad.angleAnalysis && !ad.analysisError).length || 0;
        report += `Annunci con Analisi Angle (7C) Completata: ${analyzedCount}\n`;
        if (average7CScores && analyzedCount > 0) {
            report += "Punteggi Medi 7C (su annunci analizzati):\n";
            Object.entries(average7CScores).forEach(([key, value]) => {
                report += `- ${key}: ${value.toFixed(2)}\n`;
            });
        }
        report += "\n[[FARE RIFERIMENTO ALLA TABELLA DETTAGLIATA PER L'ANALISI 7C DI CIASCUN ANNUNCIO]]\n";
    } else {
        report += "Nessun dato disponibile dal Tool 3 o analisi non eseguita.\n";
    }
    report += "\n\n";

    report += "========================================\n";
    report += "Sintesi: Analizzatore Dati GSC (Tool 4)\n";
    report += "========================================\n";
    if (tool4Data && tool4Data.analyzedGscData) {
        if (tool4Data.gscFiltersDisplay) {
            report += "Filtri GSC Applicati all'Export (come rilevati):\n";
            const filtersText = tool4Data.gscFiltersDisplay.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
            report += filtersText + "\n\n";
        }

        (['queries', 'pages', 'countries', 'devices', 'searchAppearance'] as GscReportType[]).forEach((reportType) => {
            const analysis = tool4Data.analyzedGscData![reportType];
            const itemDisplayName = getGSCReportItemDisplayName(reportType);
            report += `--- Analisi ${itemDisplayName} ---\n`;
            if (analysis && analysis.detailedDataWithDiffs && analysis.detailedDataWithDiffs.length > 0) {
                report += analysis.summaryText.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() + "\n";
                report += `Top 5 ${itemDisplayName} per Clic:\n`;
                analysis.detailedDataWithDiffs.slice(0, 5).forEach(item => {
                    report += `- ${item.item}: ${item.clicks_current} clic\n`;
                });
            } else {
                report += `Nessun dato trovato per ${itemDisplayName}.\n`;
            }
            report += "\n";
        });
    } else {
        report += "Nessun dato disponibile dal Tool 4 o analisi non eseguita.\n";
    }

    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "report_consolidato_swat.txt";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };

  const handleGeneratePdf = () => {
    window.print();
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
    <div className="tool5-master-report space-y-8 p-4 md:p-6 text-foreground">
      <header className="text-center py-6 no-print">
        <h1 className="text-3xl md:text-4xl font-bold text-sky-700 flex items-center justify-center">
            <Presentation className="mr-3 h-8 w-8 md:h-10 md:w-10" /> Report Consolidato Dettagliato
        </h1>
         <Card className="mt-6 bg-primary/10 border-primary/30">
            <CardHeader>
                <CardTitle className="text-primary text-xl flex items-center justify-center"><Printer className="mr-2 h-6 w-6"/>Esportazione Report (PDF & Testo)</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-3">
                <p className="text-primary-foreground text-base">
                    Questa pagina visualizza il report consolidato con tutti i dati, tabelle e grafici disponibili.
                </p>
                <div>
                    <Button onClick={handleGeneratePdf} variant="default" size="lg">
                        <Printer className="mr-2 h-5 w-5"/> Genera PDF Report
                    </Button>
                    <p className="text-xs text-muted-foreground mt-1">
                        Questo aprirà la finestra di dialogo di stampa del tuo browser. Seleziona "Salva come PDF" come destinazione.
                    </p>
                </div>
                <div>
                    <Button onClick={generateTextReport} variant="outline" size="lg">
                        <Download className="mr-2 h-5 w-5"/> Scarica Sintesi Testuale (.txt)
                    </Button>
                </div>
            </CardContent>
        </Card>
      </header>

      {/* Tool 1 Section */}
      <section className="report-section">
        <h1 className="report-h1 text-2xl font-bold text-sky-600 mb-4 pb-2 border-b-2 border-sky-600 flex items-center">
            <BarChart3 className="mr-3 h-7 w-7" />Sintesi: Analizzatore Comparativo Keyword (Tool 1)
        </h1>
        {(!tool1Data || !tool1Data.rawResults || tool1Data.rawResults.length === 0) ? (
            <Alert variant="default"><InfoIcon className="h-4 w-4" /><AlertTitle>Dati Mancanti</AlertTitle><AlertDescription>Nessun dato disponibile dal Tool 1 o analisi non eseguita. Esegui prima l'analisi nel Tool 1.</AlertDescription></Alert>
        ) : (
            <div className="space-y-6">
                <Card>
                    <CardHeader><h3 className="report-h3 text-xl font-semibold">Conteggio Generale Keyword</h3></CardHeader>
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
                    <CardHeader><h3 className="report-h3 text-xl font-semibold">Analisi Keyword Comuni: Posizionamento Top 10</h3><CardDescription>Confronto del numero di keyword comuni per cui "Il Mio Sito" e ciascun competitor si posizionano in Top 10.</CardDescription></CardHeader>
                    <CardContent><div className="h-[350px] w-full"><CommonKeywordsTop10Chart results={tool1Data.rawResults} activeCompetitorNames={tool1Data.activeCompetitorNames} /></div></CardContent>
                </Card>
                 <Card>
                    <CardHeader><h3 className="report-h3 text-xl font-semibold">Top 10 Opportunità per Volume (Keyword Gap)</h3><CardDescription>Le keyword con il più alto volume di ricerca per cui i competitor si posizionano, ma "Il Mio Sito" no.</CardDescription></CardHeader>
                    <CardContent><div className="h-[400px] w-full"><TopOpportunitiesChart results={tool1Data.rawResults} /></div></CardContent>
                </Card>

                <Card>
                    <CardHeader><h3 className="report-h3 text-xl font-semibold">Dettaglio Tabella: Keyword Comuni</h3></CardHeader>
                    <CardContent><ComparisonResultsTable results={tool1Data.rawResults.filter(r => r.status === 'common')} type="common" activeCompetitorNames={tool1Data.activeCompetitorNames} isDetailPage={true} /></CardContent>
                </Card>
                <Card>
                    <CardHeader><h3 className="report-h3 text-xl font-semibold">Dettaglio Tabella: Punti di Forza (Solo Mio Sito)</h3></CardHeader>
                    <CardContent><ComparisonResultsTable results={tool1Data.rawResults.filter(r => r.status === 'mySiteOnly')} type="mySiteOnly" activeCompetitorNames={tool1Data.activeCompetitorNames} isDetailPage={true} /></CardContent>
                </Card>
                <Card>
                    <CardHeader><h3 className="report-h3 text-xl font-semibold">Dettaglio Tabella: Opportunità (Solo Competitor)</h3></CardHeader>
                    <CardContent><ComparisonResultsTable results={tool1Data.rawResults.filter(r => r.status === 'competitorOnly')} type="competitorOnly" activeCompetitorNames={tool1Data.activeCompetitorNames} isDetailPage={true} /></CardContent>
                </Card>
            </div>
        )}
      </section>

      {/* Tool 2 Section Placeholder */}
      <section className="report-section">
        <h1 className="report-h1 text-2xl font-bold text-sky-600 mb-4 pb-2 border-b-2 border-sky-600 flex items-center">
            <ClipboardList className="mr-3 h-7 w-7" />Sintesi: Analizzatore Pertinenza & Priorità KW (Tool 2)
        </h1>
        <Alert variant="default">
            <InfoIcon className="h-4 w-4" />
            <AlertTitle>Info Tool 2</AlertTitle>
            <AlertDescription>
              I risultati dettagliati del Tool 2 (Analizzatore Pertinenza & Priorità KW) sono visualizzati e scaricabili come CSV direttamente all'interno della pagina del tool stesso.
              <br /> <span className="italic font-semibold">[[INSERIRE QUI EVENTUALI SINTESI O SCREENSHOT DEL TOOL 2 SE NECESSARIO PER IL REPORT FINALE]]</span>
            </AlertDescription>
        </Alert>
      </section>

      {/* Tool 3 Section */}
      <section className="report-section">
        <h1 className="report-h1 text-2xl font-bold text-sky-600 mb-4 pb-2 border-b-2 border-sky-600 flex items-center">
            <SearchCode className="mr-3 h-7 w-7" />Sintesi: FB Ads Library Scraper & Analisi Angle (Tool 3)
        </h1>
        {(!tool3Data || (!tool3Data.scrapedAds?.length && !tool3Data.adsWithAnalysis?.length)) ? (
             <Alert variant="default"><InfoIcon className="h-4 w-4" /><AlertTitle>Dati Mancanti</AlertTitle><AlertDescription>Nessun dato disponibile dal Tool 3 o analisi non eseguita. Esegui prima scraping e analisi nel Tool 3.</AlertDescription></Alert>
        ) : (
            <div className="space-y-6">
                <Card>
                    <CardHeader><h3 className="report-h3 text-xl font-semibold">Riepilogo Scraping e Analisi</h3></CardHeader>
                    <CardContent>
                        <p className="text-sm">Annunci Totali Recuperati dallo Scraper: <span className="font-semibold">{tool3Data.scrapedAds?.length || 0}</span></p>
                        <p className="text-sm">Annunci con Analisi Angle (7C) Completata: <span className="font-semibold">{tool3Data.adsWithAnalysis?.filter(ad => ad.angleAnalysis && !ad.analysisError).length || 0}</span></p>
                    </CardContent>
                </Card>
                {average7CScores && average7CChartData.length > 0 && (
                    <Card>
                        <CardHeader><h3 className="report-h3 text-xl font-semibold">Grafico Punteggi Medi 7C (Annunci Analizzati)</h3></CardHeader>
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
                    <CardHeader><h3 className="report-h3 text-xl font-semibold">Dettaglio Tabella: Analisi Angle Inserzioni (Metodo 7C)</h3></CardHeader>
                    <CardContent>
                        {tool3Data.adsWithAnalysis && tool3Data.adsWithAnalysis.length > 0 ? (
                            <TableAngleAnalysis adsWithAnalysis={tool3Data.adsWithAnalysis} isDetailPage={true} />
                        ) : (
                            <p>Nessuna analisi angle disponibile.</p>
                        )}
                    </CardContent>
                </Card>
                <p className="text-sm text-muted-foreground italic">
                    <span className="font-semibold">[[INSERIRE QUI EVENTUALI SCREENSHOT DELLE IMMAGINI DEGLI ANNUNCI PIÙ RILEVANTI DAL TOOL 3, SE NECESSARIO PER IL REPORT FINALE]]</span>
                </p>
            </div>
        )}
      </section>

      {/* Tool 4 Section */}
      <section className="report-section">
        <h1 className="report-h1 text-2xl font-bold text-sky-600 mb-4 pb-2 border-b-2 border-sky-600 flex items-center">
            <BarChart2 className="mr-3 h-7 w-7" />Sintesi: Analizzatore Dati GSC (Tool 4)
        </h1>
        {(!tool4Data || !tool4Data.analyzedGscData) ? (
            <Alert variant="default"><InfoIcon className="h-4 w-4" /><AlertTitle>Dati Mancanti</AlertTitle><AlertDescription>Nessun dato disponibile dal Tool 4 o analisi non eseguita. Carica ed analizza un file GSC nel Tool 4.</AlertDescription></Alert>
        ) : (
            <div className="space-y-8">
                {tool4Data.gscFiltersDisplay && (
                    <Card>
                        <CardHeader><h3 className="report-h3 text-xl font-semibold">Filtri GSC Applicati all'Export</h3></CardHeader>
                        <CardContent>
                            <div className="prose prose-sm max-w-none text-muted-foreground" dangerouslySetInnerHTML={{ __html: tool4Data.gscFiltersDisplay.replace(/<h1[^>]*>/i, '<strong>').replace(/<\/h1>/i, '</strong><br/>').replace(/<h[2-6][^>]*>/gi, '<strong>').replace(/<\/h[2-6]>/gi, '</strong><br/>').replace(/<ul>/gi, '<ul class="list-disc pl-5">').replace(/<li>/gi, '<li class="my-0.5">') }} />
                        </CardContent>
                    </Card>
                )}

                {(['queries', 'pages', 'countries', 'devices', 'searchAppearance'] as GscReportType[]).map((reportType) => {
                    if (!tool4Data.analyzedGscData || !tool4Data.analyzedGscData[reportType]) {
                         return (
                            <Card key={reportType}>
                                <CardHeader><h3 className="report-h3 text-xl font-semibold">Analisi {getGSCReportItemDisplayName(reportType)}</h3></CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground">Nessun dato trovato per {getGSCReportItemDisplayName(reportType)} o foglio non presente/vuoto.</p>
                                </CardContent>
                            </Card>
                        );
                    }
                    const analysis = tool4Data.analyzedGscData[reportType] as GscSectionAnalysis; // Cast sicuro dopo il check
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
                            <CardHeader><h3 className="report-h3 text-xl font-semibold">Analisi {itemDisplayName}</h3></CardHeader>
                            <CardContent>
                                {analysis.summaryText && <CardDescription className="mb-3 prose prose-sm max-w-none" dangerouslySetInnerHTML={{__html: analysis.summaryText}} /> }

                                {shouldRenderChart ? (
                                    <div className="my-6 h-[350px] md:h-[400px]">
                                        <ChartGSC
                                            data={chartDataForRender}
                                            pieData={pieDataForRender}
                                            type={chartTypeToUse}
                                            title={`Top Elementi per ${itemDisplayName} per Clic`}
                                        />
                                    </div>
                                ) : (
                                    <p className="text-muted-foreground text-center py-4 italic">
                                       <span className="font-semibold">[[GRAFICO PER ${itemDisplayName.toUpperCase()} NON DISPONIBILE O DATI INSUFFICIENTI. FARE SCREENSHOT DAL TOOL 4 SE NECESSARIO PER IL REPORT FINALE]]</span>
                                    </p>
                                )}

                                <h4 className="text-md font-semibold text-foreground mt-4 mb-2">Tabella Dati Completa: {itemDisplayName}</h4>
                                <TableGSC data={analysis.detailedDataWithDiffs} itemDisplayName={itemDisplayName} isDetailPage={true}/>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        )}
      </section>

      <footer className="mt-12 py-6 border-t border-border text-center no-print">
          <Card className="bg-primary/10 border-primary/30">
            <CardHeader>
                <CardTitle className="text-primary text-xl flex items-center justify-center"><Printer className="mr-2 h-6 w-6"/>Esportazione Finale del Report Consolidato</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                <p className="text-primary-foreground text-base font-medium">
                    Questa pagina contiene il report consolidato con tutti i dati, tabelle e grafici disponibili dalle analisi effettuate.
                </p>
                <div>
                    <Button onClick={handleGeneratePdf} variant="default" size="lg">
                        <Printer className="mr-2 h-5 w-5"/> Genera PDF Report
                    </Button>
                    <p className="text-xs text-muted-foreground mt-1">
                        Questo aprirà la finestra di dialogo di stampa del tuo browser. Seleziona "Salva come PDF" come destinazione.<br/>
                        Il PDF generato includerà tutto il contenuto di questa pagina, paginato automaticamente se necessario.
                    </p>
                </div>
                 <div>
                    <Button onClick={generateTextReport} variant="outline" size="lg">
                        <Download className="mr-2 h-5 w-5"/> Scarica Sintesi Testuale (.txt)
                    </Button>
                </div>
            </CardContent>
        </Card>
      </footer>
    </div>
  );
}

