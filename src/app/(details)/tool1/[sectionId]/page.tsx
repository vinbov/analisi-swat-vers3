
"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { AppHeader } from '@/components/layout/app-header';
import type { ComparisonResult, DetailPageSection, DetailPageDataTool1 } from '@/lib/types';
// import { KeywordDistributionChart } from '@/components/tools/tool1-comparator/chart-keyword-distribution'; // Grafico rimosso
import { CommonKeywordsTop10Chart } from '@/components/tools/tool1-comparator/chart-common-keywords-top10';
import { TopOpportunitiesChart } from '@/components/tools/tool1-comparator/chart-top-opportunities';
import { ComparisonResultsTable } from '@/components/tools/tool1-comparator/table-comparison-results';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TOOL1_DATA_CHANNEL_NAME, type RequestTool1DataMessage, type ResponseTool1DataMessage, type Tool1DataPayload } from '@/lib/tool1-data-channel';

export default function Tool1DetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const sectionId = params.sectionId as DetailPageSection;
  const [pageData, setPageData] = useState<DetailPageDataTool1 | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dataLoadError, setDataLoadError] = useState<string | null>(null);

  const channelRef = useRef<BroadcastChannel | null>(null);
  const requestingTabIdRef = useRef<string>(`detailTab-${Date.now()}-${Math.random().toString(36).substring(2,7)}`);
  const dataIdRef = useRef<string | null>(null);

  useEffect(() => {
    const dataIdFromParams = searchParams.get('dataId');
    dataIdRef.current = dataIdFromParams;

    if (!dataIdFromParams || !sectionId) {
      setDataLoadError("Impossibile caricare i dettagli. ID dati o sezione mancante. Torna al tool principale e riprova.");
      setIsLoading(false);
      return;
    }

    channelRef.current = new BroadcastChannel(TOOL1_DATA_CHANNEL_NAME);
    
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'RESPONSE_TOOL1_DATA') {
        const { dataId: responseDataId, requestingTabId: responseTabId, payload } = event.data as ResponseTool1DataMessage;
        
        if (responseDataId === dataIdRef.current && responseTabId === requestingTabIdRef.current) {
          if (payload) {
            const { comparisonResults, activeCompetitorNames } = payload;
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
              // case 'distribution': // Sezione rimossa
              //   dataForPage = {
              //     pageTitle: "Panoramica Distribuzione Keyword",
              //     description: "Questo grafico illustra come le keyword uniche analizzate si distribuiscono tra le categorie.",
              //     chartComponent: <KeywordDistributionChart results={comparisonResults} />,
              //     additionalContent: `<h5 class="mt-4 font-semibold">Conteggi Esatti:</h5>
              //                         <ul>
              //                           <li>Totale Keyword Comuni: ${commonKWs.length}</li>
              //                           <li>Totale Punti di Forza (Solo Mio Sito): ${mySiteOnlyKWs.length}</li>
              //                           <li>Totale Opportunità (Solo Competitor): ${competitorOnlyKWs.length}</li>
              //                         </ul>`,
              //   };
              //   break;
              case 'commonTop10':
                let commonTop10AdditionalContent = `<h5 class="mt-4 font-semibold">Mio Sito - Keyword Comuni in Top 10:</h5>`;
                const mySiteTop10KWsDetail = commonKWs
                  .filter(kw => kw.mySiteInfo.pos !== 'N/P' && typeof kw.mySiteInfo.pos === 'number' && kw.mySiteInfo.pos <= 10)
                  .sort((a, b) => (a.mySiteInfo.pos as number) - (b.mySiteInfo.pos as number));
                
                if (mySiteTop10KWsDetail.length > 0) {
                  commonTop10AdditionalContent += '<ul>';
                  mySiteTop10KWsDetail.forEach(item => {
                    commonTop10AdditionalContent += `<li>${item.keyword} (Pos: ${item.mySiteInfo.pos})</li>`;
                  });
                  commonTop10AdditionalContent += '</ul>';
                } else {
                  commonTop10AdditionalContent += '<p>Nessuna keyword comune in Top 10 per "Mio Sito".</p>';
                }

                activeCompetitorNames.forEach(compName => {
                  commonTop10AdditionalContent += `<h5 class="mt-4 font-semibold">${compName} - Keyword Comuni in Top 10:</h5>`;
                  const competitorKWsDetail = commonKWs
                    .filter(kw => {
                      const compInfo = kw.competitorInfo.find(c => c.name === compName);
                      return compInfo && compInfo.pos !== 'N/P' && typeof compInfo.pos === 'number' && compInfo.pos <= 10;
                    })
                    .sort((a, b) => {
                       const posA = a.competitorInfo.find(c => c.name === compName)?.pos as number;
                       const posB = b.competitorInfo.find(c => c.name === compName)?.pos as number;
                       return posA - posB;
                    });

                  if (competitorKWsDetail.length > 0) {
                    commonTop10AdditionalContent += '<ul>';
                    competitorKWsDetail.forEach(item => {
                      const compInfo = item.competitorInfo.find(c => c.name === compName);
                      commonTop10AdditionalContent += `<li>${item.keyword} (Pos: ${compInfo?.pos})</li>`;
                    });
                    commonTop10AdditionalContent += '</ul>';
                  } else {
                    commonTop10AdditionalContent += `<p>Nessuna keyword comune in Top 10 per ${compName}.</p>`;
                  }
                });

                dataForPage = {
                  pageTitle: "Analisi Keyword Comuni: Posizionamento Top 10",
                  description: "Confronto del numero di keyword comuni per cui \"Il Mio Sito\" e ciascun competitor si posizionano in Top 10, con dettaglio delle keyword.",
                  chartComponent: <CommonKeywordsTop10Chart results={comparisonResults} activeCompetitorNames={activeCompetitorNames} />,
                  additionalContent: commonTop10AdditionalContent,
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
              default: // Caso di fallback se sectionId non corrisponde
                setDataLoadError(`La sezione di dettaglio '${sectionId}' non è riconosciuta o è stata rimossa. Torna al tool principale.`);
                setIsLoading(false);
                return;
            }
            setPageData(dataForPage as DetailPageDataTool1);
            setDataLoadError(null);
          } else {
            setDataLoadError("I dati per questa sessione di dettaglio non sono più disponibili. Questo può accadere se la scheda del tool principale è stata chiusa o l'analisi è stata aggiornata. Torna al tool principale e riesegui l'analisi se necessario.");
            setPageData(null);
          }
          setIsLoading(false);
          if (timeoutId) clearTimeout(timeoutId); 
        }
      }
    };
    
    channelRef.current.onmessage = handleMessage;

    const requestMsg: RequestTool1DataMessage = {
      type: 'REQUEST_TOOL1_DATA',
      dataId: dataIdFromParams,
      requestingTabId: requestingTabIdRef.current,
    };
    channelRef.current.postMessage(requestMsg);

    const timeoutId = setTimeout(() => {
      if (isLoading) { 
        setDataLoadError("Timeout: Nessuna risposta dal tool principale. Assicurati che la scheda del Tool 1 sia aperta e attiva. Potrebbe essere necessario rieseguire l'analisi.");
        setPageData(null);
        setIsLoading(false);
      }
    }, 7000); 

    return () => {
      channelRef.current?.close();
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [sectionId, searchParams, isLoading]); // isLoading è ancora qui per il timeout, rimosso da altre parti

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen"><p>Caricamento dettagli in corso... Richiesta dati al tool principale.</p></div>;
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
