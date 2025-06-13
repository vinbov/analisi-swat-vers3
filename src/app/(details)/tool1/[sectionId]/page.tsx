
"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { AppHeader } from '@/components/layout/app-header';
import type { ComparisonResult, DetailPageSection, DetailPageDataTool1 } from '@/lib/types';
import { KeywordDistributionChart } from '@/components/tools/tool1-comparator/chart-keyword-distribution';
import { CommonKeywordsTop10Chart } from '@/components/tools/tool1-comparator/chart-common-keywords-top10';
import { TopOpportunitiesChart } from '@/components/tools/tool1-comparator/chart-top-opportunities';
import { ComparisonResultsTable } from '@/components/tools/tool1-comparator/table-comparison-results';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getTool1TempData, clearTool1TempData } from '@/lib/temp-data-store';

export default function Tool1DetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const sectionId = params.sectionId as DetailPageSection;
  const [pageData, setPageData] = useState<DetailPageDataTool1 | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dataLoadError, setDataLoadError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setDataLoadError(null);
    const dataId = searchParams.get('dataId');

    if (dataId && sectionId) {
      const tempData = getTool1TempData(dataId); 

      if (tempData) {
        const { comparisonResults, activeCompetitorNames } = tempData;
        let dataForPage: DetailPageDataTool1 | null = null;

        const commonKWs = comparisonResults.filter(r => r.status === 'common');
        const mySiteOnlyKWs = comparisonResults.filter(r => r.status === 'mySiteOnly');
        const competitorOnlyKWs = comparisonResults.filter(r => r.status === 'competitorOnly');
        
        const getTableHeaders = (type: 'common' | 'mySiteOnly' | 'competitorOnly') => {
          if (type === 'common') return ['Keyword', 'Mio Sito Pos.', 'Mio Sito URL', ...activeCompetitorNames.flatMap(name => [`${name} Pos.`, `${name} URL`]), 'Volume', 'Difficoltà', 'Opportunity', 'Intento'];
          if (type === 'mySiteOnly') return ['Keyword', 'Mio Sito Pos.', 'Mio Sito URL', 'Volume', 'Difficoltà', 'Opportunity', 'Intento'];
          return ['Keyword', ...activeCompetitorNames.flatMap(name => [`${name} Pos.`, `${name} URL`]), 'Volume', 'Difficoltà', 'Opportunity', 'Intento'];
        };

        switch (sectionId) {
          case 'distribution':
            dataForPage = {
              pageTitle: "Panoramica Distribuzione Keyword",
              description: "Questo grafico illustra come le keyword uniche analizzate si distribuiscono tra le categorie.",
              chartComponent: <KeywordDistributionChart results={comparisonResults} />,
              additionalContent: `<h5 class="mt-4 font-semibold">Conteggi Esatti:</h5>
                                  <ul>
                                    <li>Totale Keyword Comuni: ${commonKWs.length}</li>
                                    <li>Totale Punti di Forza (Solo Mio Sito): ${mySiteOnlyKWs.length}</li>
                                    <li>Totale Opportunità (Solo Competitor): ${competitorOnlyKWs.length}</li>
                                  </ul>`,
            };
            break;
          case 'commonTop10':
            const mySiteTop10KWs = commonKWs.filter(kw => kw.mySiteInfo.pos !== 'N/P' && typeof kw.mySiteInfo.pos === 'number' && kw.mySiteInfo.pos <= 10)
                                      .sort((a, b) => (a.mySiteInfo.pos as number) - (b.mySiteInfo.pos as number));
            const competitorTop10UniqueKWs = new Set<string>();
            commonKWs.forEach(kw => {
                kw.competitorInfo.forEach(comp => {
                    if (activeCompetitorNames.includes(comp.name) && comp.pos !== 'N/P' && typeof comp.pos === 'number' && comp.pos <= 10) {
                        competitorTop10UniqueKWs.add(kw.keyword);
                    }
                });
            });
            dataForPage = {
              pageTitle: "Analisi Keyword Comuni: Posizionamento Top 10",
              description: "Confronto del numero di keyword comuni per cui \"Il Mio Sito\" si posiziona in Top 10 rispetto ai competitor.",
              chartComponent: <CommonKeywordsTop10Chart results={comparisonResults} activeCompetitorNames={activeCompetitorNames} />,
              additionalContent: `<h5 class="mt-4 font-semibold">Mio Sito - Top ${Math.min(10, mySiteTop10KWs.length)} KW Comuni in Top 10:</h5>
                                  <ul>${mySiteTop10KWs.slice(0,10).map(item => `<li>${item.keyword} (Pos: ${item.mySiteInfo.pos})</li>`).join('') || '<li>Nessuna</li>'}</ul>
                                  <h5 class="mt-4 font-semibold">Competitors - Prime ${Math.min(10, competitorTop10UniqueKWs.size)} KW Comuni in Top 10 (da almeno un competitor):</h5>
                                  <ul>${Array.from(competitorTop10UniqueKWs).slice(0,10).map(kw_ => `<li>${kw_}</li>`).join('') || '<li>Nessuna</li>'}</ul>`,
            };
            break;
          case 'topOpportunities':
             const topOpportunities = comparisonResults.filter(r => r.status === 'competitorOnly' && typeof r.volume === 'number' && r.volume > 0)
                .sort((a, b) => (b.volume as number) - (a.volume as number))
                .slice(0, 10);
            dataForPage = {
              pageTitle: "Top 10 Opportunità per Volume (Keyword Gap)",
              description: "Le keyword con il più alto volume di ricerca per cui i competitor si posizionano, ma \"Il Mio Sito\" no.",
              chartComponent: <TopOpportunitiesChart results={comparisonResults} />,
              additionalContent: `<h5 class="mt-4 font-semibold">Top ${topOpportunities.length} Opportunità per Volume:</h5>
                                   <ul>${topOpportunities.map(item => `<li>${item.keyword} (Volume: ${item.volume})</li>`).join('') || '<li>Nessuna</li>'}</ul>`,
            };
            break;
          case 'commonKeywordsSectionTool1':
            dataForPage = {
              pageTitle: "Dettaglio Tabella: Keyword Comuni",
              description: "Elenco completo delle keyword per cui \"Il Mio Sito\" e almeno un competitor si posizionano.",
              tableData: commonKWs,
              tableHeaders: getTableHeaders('common'),
              tableType: 'common',
              activeCompetitorNames: activeCompetitorNames,
            };
            break;
          case 'mySiteOnlyKeywordsSectionTool1':
            dataForPage = {
              pageTitle: "Dettaglio Tabella: Punti di Forza",
              description: "Keyword per cui \"Il Mio Sito\" si posiziona, ma nessuno dei competitor analizzati.",
              tableData: mySiteOnlyKWs,
              tableHeaders: getTableHeaders('mySiteOnly'),
              tableType: 'mySiteOnly',
              activeCompetitorNames: activeCompetitorNames,
            };
            break;
          case 'competitorOnlyKeywordsSectionTool1':
            dataForPage = {
              pageTitle: "Dettaglio Tabella: Opportunità",
              description: "Keyword per cui i competitor si posizionano e \"Il Mio Sito\" no.",
              tableData: competitorOnlyKWs,
              tableHeaders: getTableHeaders('competitorOnly'),
              tableType: 'competitorOnly',
              activeCompetitorNames: activeCompetitorNames,
            };
            break;
        }
        setPageData(dataForPage as DetailPageDataTool1);
      } else {
        setDataLoadError("I dati per questa sessione di dettaglio non sono più disponibili. Questo può accadere se hai ricaricato la pagina o chiuso la scheda del tool principale. Torna al tool principale e riesegui l'analisi per visualizzare nuovamente i dettagli.");
        setPageData(null);
      }
    } else {
      setDataLoadError("Impossibile caricare i dettagli. ID dati o sezione mancante. Torna al tool principale e riprova.");
      setPageData(null);
    }
    setIsLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionId, searchParams]);

  // Non è più necessario clearTool1TempData all'unmount qui,
  // dato che lo store è temporaneo e per sessione/navigazione singola.
  // Potrebbe essere utile se si vuole essere aggressivi con la memoria, ma
  // per ora lo store in memoria vivrà finché la scheda principale è aperta.

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen"><p>Caricamento dettagli...</p></div>;
  }

  if (dataLoadError || !pageData) {
    return (
      <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
        <div className="container mx-auto max-w-3xl bg-card p-6 rounded-lg shadow-xl text-center">
          <AppHeader />
          <Button onClick={() => window.close()} variant="outline" className="mb-4 mt-6">
            <ArrowLeft className="mr-2 h-4 w-4" /> Chiudi Scheda
          </Button>
          <h1 className="text-2xl font-bold mb-4 mt-4">Dati non Trovati o Sessione Scaduta</h1>
          <p className="text-destructive">{dataLoadError || "Impossibile caricare i dettagli per questa sezione. Torna al tool principale e riesegui l'analisi."}</p>
        </div>
      </div>
    );
  }
  
  interface DetailPageDataTool1Extended extends DetailPageDataTool1 {
    chartComponent?: React.ReactNode;
  }
  const extendedPageData = pageData as DetailPageDataTool1Extended;


  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
      <div className="container mx-auto max-w-6xl bg-card p-6 rounded-lg shadow-xl">
        <AppHeader />
        <Button onClick={() => window.close()} variant="outline" className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" /> Chiudi Scheda
        </Button>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">{extendedPageData.pageTitle}</CardTitle>
            <CardDescription className="mt-1 text-base">{extendedPageData.description}</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {extendedPageData.chartComponent && (
              <div className="my-6 min-h-[350px] md:min-h-[450px] flex justify-center items-center">
                {extendedPageData.chartComponent}
              </div>
            )}
            {extendedPageData.additionalContent && (
              <div className="mt-6 p-4 bg-muted/50 rounded-md prose prose-sm max-w-none text-muted-foreground" dangerouslySetInnerHTML={{ __html: extendedPageData.additionalContent }} />
            )}
            {extendedPageData.tableData && extendedPageData.tableHeaders && extendedPageData.tableType && (
              <div className="mt-6">
                <ComparisonResultsTable 
                  results={extendedPageData.tableData} 
                  type={extendedPageData.tableType} 
                  activeCompetitorNames={extendedPageData.activeCompetitorNames || []}
                  isDetailPage={true}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

    