
"use client";
import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { FileUploadZone } from '@/components/shared/file-upload-zone';
import { parseCSVTool1, exportTool1FullReportToXLSX } from '@/lib/csv'; // Modified import
import type { CsvRowTool1, ComparisonResult, DetailPageSection } from '@/lib/types';
import { KeywordDistributionChart } from './chart-keyword-distribution';
import { CommonKeywordsTop10Chart } from './chart-common-keywords-top10';
import { TopOpportunitiesChart } from './chart-top-opportunities';
import { ComparisonResultsTable } from './table-comparison-results';
import { useToast } from '@/hooks/use-toast';
import { BarChart3, Download, AlertCircle, Info, FileText, PieChartIcon, LineChart, DownloadCloud } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
// useRouter non serve più qui per la navigazione, window.open la gestirà
import { storeTool1TempData } from '@/lib/temp-data-store';


const APP_CHUNK_SIZE_TOOL1 = 500;

export function Tool1Comparator() {
  const [siteFiles, setSiteFiles] = useState<Record<string, { content: string; name: string }>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [progress, setProgress] = useState(0);
  const [comparisonResults, setComparisonResults] = useState<ComparisonResult[]>([]);
  const [activeCompetitorNames, setActiveCompetitorNames] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const { toast } = useToast();
  // const router = useRouter(); // Non più necessario per openDetailPage

  const handleFileLoad = useCallback((siteKey: string, content: string, name: string) => {
    setSiteFiles(prev => ({ ...prev, [siteKey]: { content, name } }));
  }, []);

  const runComparison = async () => {
    setIsLoading(true);
    setLoadingMessage("Preparazione analisi...");
    setProgress(0);
    setError(null);
    setComparisonResults([]);
    setActiveCompetitorNames([]);

    if (!siteFiles['Mio Sito']?.content) {
      setError("Carica il CSV per 'Il Mio Sito'.");
      setIsLoading(false);
      return;
    }

    const currentActiveCompetitors = Object.keys(siteFiles).filter(key => key !== 'Mio Sito' && siteFiles[key]?.content);
    if (currentActiveCompetitors.length === 0) {
      setError("Carica i dati CSV per almeno un Competitor.");
      setIsLoading(false);
      return;
    }
    setActiveCompetitorNames(currentActiveCompetitors);

    try {
      const parsedSiteData: Record<string, CsvRowTool1[]> = {};
      for (const siteName in siteFiles) {
        if (siteFiles[siteName]?.content) {
          setLoadingMessage(`Parsing dati per ${siteFiles[siteName].name}...`);
          await new Promise(resolve => setTimeout(resolve, 50));
          parsedSiteData[siteName] = parseCSVTool1(siteFiles[siteName].content, siteFiles[siteName].name);
        }
      }
      
      if (Object.keys(parsedSiteData).length === 0 || !parsedSiteData['Mio Sito'] || parsedSiteData['Mio Sito'].length === 0) {
        setError("Nessun dato CSV valido da analizzare. Controlla i file e le intestazioni.");
        setIsLoading(false);
        return;
      }

      const mySiteName = 'Mio Sito';
      const siteKeywordMaps: Record<string, Map<string, CsvRowTool1>> = {};
      for (const siteName in parsedSiteData) {
        siteKeywordMaps[siteName] = new Map(parsedSiteData[siteName].map(item => [item.keyword, item]));
      }

      let allKeywordsSet = new Set<string>();
      for (const siteName in parsedSiteData) {
        parsedSiteData[siteName].forEach(item => { if (item.keyword) allKeywordsSet.add(item.keyword); });
      }
      const allKeywordsArray = Array.from(allKeywordsSet);
      const totalKeywords = allKeywordsArray.length;
      
      const results: ComparisonResult[] = [];
      
      for (let i = 0; i < totalKeywords; i += APP_CHUNK_SIZE_TOOL1) {
        const chunk = allKeywordsArray.slice(i, i + APP_CHUNK_SIZE_TOOL1);
        for (const kw of chunk) {
          if (!kw) continue;
          const mySiteEntry = siteKeywordMaps[mySiteName]?.get(kw);
          let competitorEntriesData: { name: string; entry?: CsvRowTool1 }[] = [];
          let ranksInAtLeastOneCompetitor = false;

          currentActiveCompetitors.forEach(compName => {
            const compEntry = siteKeywordMaps[compName]?.get(kw);
            competitorEntriesData.push({ name: compName, entry: compEntry });
            if (compEntry) ranksInAtLeastOneCompetitor = true;
          });

          let status: ComparisonResult['status'] | '' = '';
          if (mySiteEntry && ranksInAtLeastOneCompetitor) status = 'common';
          else if (mySiteEntry && !ranksInAtLeastOneCompetitor) status = 'mySiteOnly';
          else if (!mySiteEntry && ranksInAtLeastOneCompetitor) status = 'competitorOnly';
          else continue;

          let commonMetricsSource = mySiteEntry;
          if (!commonMetricsSource && ranksInAtLeastOneCompetitor) {
            const firstCompetitorWithKw = competitorEntriesData.find(c => c.entry);
            if (firstCompetitorWithKw) commonMetricsSource = firstCompetitorWithKw.entry;
          }

          results.push({
            keyword: kw,
            mySiteInfo: mySiteEntry ? { pos: mySiteEntry.posizione ?? 'N/P', url: mySiteEntry.url ?? 'N/A' } : { pos: 'N/P', url: 'N/A' },
            competitorInfo: competitorEntriesData.map(c => ({ name: c.name, pos: c.entry?.posizione ?? 'N/P', url: c.entry?.url ?? 'N/A' })),
            volume: commonMetricsSource?.volume ?? 'N/A',
            difficolta: commonMetricsSource?.difficolta ?? 'N/A',
            opportunity: commonMetricsSource?.opportunity ?? 'N/A',
            intento: commonMetricsSource?.intento ?? 'N/A',
            status,
          });
        }
        setProgress(Math.min(i + APP_CHUNK_SIZE_TOOL1, totalKeywords) / totalKeywords * 100);
        setLoadingMessage(`Analisi Comparatore... (${Math.min(i + APP_CHUNK_SIZE_TOOL1, totalKeywords)} di ${totalKeywords} kw)`);
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      setComparisonResults(results);
      if (results.length === 0 && Object.values(siteFiles).some(f => f?.content && f.content.trim() !== '')) {
        toast({ title: "Nessun Risultato", description: "Nessuna keyword valida trovata o nessuna corrispondenza/differenza significativa. Controlla le intestazioni dei tuoi file CSV."});
      } else if (results.length > 0) {
        toast({ title: "Analisi Completata", description: `${results.length} keyword analizzate.` });
      }


    } catch (e: any) {
      console.error("Errore durante l'analisi (Tool1):", e);
      setError(`Errore analisi (Tool1): ${e.message}`);
      toast({
        title: "Errore di Analisi",
        description: e.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const openDetailPage = (section: DetailPageSection) => {
    if (!comparisonResults || comparisonResults.length === 0) {
        toast({
            title: "Nessun Dato da Visualizzare",
            description: "Esegui prima un'analisi per poter visualizzare i dettagli.",
            variant: "default",
        });
        return;
    }
    try {
      const dataId = `tool1-${section}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      storeTool1TempData(dataId, {
        comparisonResults,
        activeCompetitorNames
      });
      const url = `/tool1/${section}?dataId=${dataId}`;
      window.open(url, '_blank'); // Apre in una nuova scheda
    } catch (e: any) {
        console.error("Errore imprevisto nell'apertura della pagina di dettaglio:", e);
        toast({
            title: "Errore Imprevisto",
            description: "Si è verificato un errore nell'aprire la pagina di dettaglio. Controlla la console.",
            variant: "destructive",
        });
         setError(`Errore imprevisto nell'apertura dei dettagli: ${e.message}`);
    }
  };

  const handleDownloadFullReport = () => {
    if (comparisonResults.length === 0) {
      toast({ title: "Nessun dato", description: "Nessun risultato da scaricare per il report completo.", variant: "destructive" });
      return;
    }
    try {
      exportTool1FullReportToXLSX("report_completo_tool1_analisi_seo.xlsx", comparisonResults, activeCompetitorNames);
      toast({ title: "Download Avviato", description: "Il report completo del Tool 1 è in scaricamento." });
    } catch (e: any) {
      console.error("Errore durante la creazione del report Excel completo (Tool1):", e);
      setError(`Errore creazione report Excel: ${e.message}`);
      toast({
        title: "Errore Export Excel",
        description: e.message,
        variant: "destructive",
      });
    }
  };

  const competitorUploadZones = Array.from({ length: 5 }, (_, i) => `Competitor ${i + 1}`);

  return (
    <div className="space-y-8">
      <header className="text-center">
        <h2 className="text-3xl font-bold" style={{ color: 'hsl(var(--sky-600))' }}>Analizzatore Comparativo Keyword SEO</h2>
        <p className="text-muted-foreground mt-2">Trascina i file CSV per confrontare "Il Mio Sito" con fino a 5 competitor.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Caricamento File CSV</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <FileUploadZone
            siteKey="Mio Sito"
            label="Il Mio Sito"
            onFileLoad={(content, name) => handleFileLoad("Mio Sito", content, name)}
          />
          {competitorUploadZones.map((key, index) => (
            <FileUploadZone
              key={key}
              siteKey={key}
              label={`Competitor ${index + 1}`}
              optional={index > 0} 
              onFileLoad={(content, name) => handleFileLoad(key, content, name)}
            />
          ))}
        </CardContent>
      </Card>

      <div className="text-center">
        <Button onClick={runComparison} disabled={isLoading} className="action-button bg-sky-600 hover:bg-sky-700 text-white text-lg">
          {isLoading ? "Analisi in corso..." : "Confronta Dati"} <BarChart3 className="ml-2 h-5 w-5" />
        </Button>
      </div>

      {isLoading && (
        <div className="text-center my-6">
          <p className="text-sky-600 text-lg mb-2">{loadingMessage}</p>
          <Progress value={progress} className="w-3/4 mx-auto" />
        </div>
      )}

      {error && (
         <Alert variant="destructive" className="my-4">
           <AlertCircle className="h-4 w-4" />
           <AlertTitle>Errore</AlertTitle>
           <AlertDescription>{error}</AlertDescription>
         </Alert>
      )}

      {comparisonResults.length > 0 && !isLoading && (
        <section className="mt-12 space-y-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <h3 className="text-2xl font-semibold text-center md:text-left" style={{ color: 'hsl(var(--sky-700))' }}>Report Comparativo SEO</h3>
            <Button onClick={handleDownloadFullReport} variant="outline" className="w-full md:w-auto">
              Scarica Report Completo (Excel) <DownloadCloud className="ml-2 h-4 w-4" />
            </Button>
          </div>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xl font-semibold">Panoramica Distribuzione Keyword</CardTitle>
              <Button variant="link" onClick={() => openDetailPage('distribution')} className="detail-button">
                Visualizza Dettaglio <PieChartIcon className="ml-2 h-4 w-4"/>
              </Button>
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-3">Questo grafico illustra come le keyword uniche analizzate si distribuiscono tra le categorie.</CardDescription>
              <KeywordDistributionChart results={comparisonResults} />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-semibold">Cos'è la "Keyword Opportunity"?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">
                La metrica "Keyword Opportunity" (o "Punteggio di Opportunità"), quando fornita da tool SEO come Seozoom, è un indicatore sintetico che cerca di stimare il potenziale di una parola chiave. Generalmente, un punteggio più alto suggerisce una migliore opportunità. <br/>Questo punteggio è solitamente calcolato combinando diversi fattori, tra cui: Volume di Ricerca, Keyword Difficulty (KD), e a volte il Costo Per Click (CPC).<br/>Nel nostro report, le keyword nella sezione "Opportunità (Solo Competitor)" con un alto punteggio di "Keyword Opportunity" (se disponibile nel tuo CSV) e un buon volume di ricerca potrebbero essere priorità interessanti da considerare per la creazione di nuovi contenuti.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xl font-semibold">Analisi Keyword Comuni: Posizionamento Top 10</CardTitle>
               <Button variant="link" onClick={() => openDetailPage('commonTop10')} className="detail-button">
                Visualizza Dettaglio <BarChart3 className="ml-2 h-4 w-4"/>
              </Button>
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-3">Confronto del numero di keyword comuni per cui "Il Mio Sito" si posiziona in Top 10 rispetto ai competitor.</CardDescription>
              <CommonKeywordsTop10Chart results={comparisonResults} activeCompetitorNames={activeCompetitorNames} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xl font-semibold">Top 10 Opportunità per Volume (Keyword Gap)</CardTitle>
              <Button variant="link" onClick={() => openDetailPage('topOpportunities')} className="detail-button">
                Visualizza Dettaglio <LineChart className="ml-2 h-4 w-4"/>
              </Button>
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-3">Le keyword con il più alto volume di ricerca per cui i competitor si posizionano, ma "Il Mio Sito" no.</CardDescription>
              <TopOpportunitiesChart results={comparisonResults} />
            </CardContent>
          </Card>

          <div className="space-y-8 mt-10">
            <Card id="commonKeywordsSectionTool1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xl font-semibold">Anteprima Keyword Comuni</CardTitle>
                 <Button variant="link" onClick={() => openDetailPage('commonKeywordsSectionTool1')} className="detail-button">
                  Vedi Tabella Completa <FileText className="ml-2 h-4 w-4"/>
                </Button>
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-4">Keyword per cui "Il Mio Sito" e almeno un competitor si posizionano.</CardDescription>
                <ComparisonResultsTable results={comparisonResults.filter(r => r.status === 'common').slice(0,10)} type="common" activeCompetitorNames={activeCompetitorNames} />
                <p className="mt-2 text-sm text-muted-foreground">Totale: {comparisonResults.filter(r => r.status === 'common').length} keyword</p>
              </CardContent>
            </Card>

            <Card id="mySiteOnlyKeywordsSectionTool1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xl font-semibold">Anteprima Punti di Forza</CardTitle>
                 <Button variant="link" onClick={() => openDetailPage('mySiteOnlyKeywordsSectionTool1')} className="detail-button">
                  Vedi Tabella Completa <FileText className="ml-2 h-4 w-4"/>
                </Button>
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-4">Keyword per cui "Il Mio Sito" si posiziona, ma nessuno dei competitor analizzati.</CardDescription>
                <ComparisonResultsTable results={comparisonResults.filter(r => r.status === 'mySiteOnly').slice(0,10)} type="mySiteOnly" activeCompetitorNames={activeCompetitorNames}/>
                 <p className="mt-2 text-sm text-muted-foreground">Totale: {comparisonResults.filter(r => r.status === 'mySiteOnly').length} keyword</p>
              </CardContent>
            </Card>
            
            <Card id="competitorOnlyKeywordsSectionTool1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xl font-semibold">Anteprima Opportunità</CardTitle>
                <Button variant="link" onClick={() => openDetailPage('competitorOnlyKeywordsSectionTool1')} className="detail-button">
                  Vedi Tabella Completa <FileText className="ml-2 h-4 w-4"/>
                </Button>
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-4">Keyword per cui i competitor si posizionano e "Il Mio Sito" no.</CardDescription>
                <ComparisonResultsTable results={comparisonResults.filter(r => r.status === 'competitorOnly').slice(0,10)} type="competitorOnly" activeCompetitorNames={activeCompetitorNames}/>
                <p className="mt-2 text-sm text-muted-foreground">Totale: {comparisonResults.filter(r => r.status === 'competitorOnly').length} keyword</p>
              </CardContent>
            </Card>
          </div>
        </section>
      )}
    </div>
  );
}
