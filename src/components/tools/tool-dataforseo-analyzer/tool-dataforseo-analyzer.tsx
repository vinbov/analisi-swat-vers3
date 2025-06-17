
"use client";
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { TableDataForSeoResults } from './table-dataforseo-results';
import { fetchDataForSEOKeywordIdeasAction } from '@/app/actions/dataforseo-actions';
import type { DataForSEOKeywordMetrics } from '@/lib/dataforseo/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { KeyRound, SearchIcon, Globe, Languages, Loader2, AlertCircle, Download } from 'lucide-react';
import { exportToCSV } from '@/lib/csv';

interface ToolDataForSeoAnalyzerProps {
  dataForSeoLogin: string;
  setDataForSeoLogin: (value: string) => void;
  dataForSeoPassword: string;
  setDataForSeoPassword: (value: string) => void;
  seedKeywords: string;
  setSeedKeywords: (value: string) => void;
  locationCode: string; // Stored as string for input, parsed to number
  setLocationCode: (value: string) => void;
  languageCode: string;
  setLanguageCode: (value: string) => void;
  analysisResults: DataForSEOKeywordMetrics[];
  setAnalysisResults: React.Dispatch<React.SetStateAction<DataForSEOKeywordMetrics[]>>;
}

export function ToolDataForSeoAnalyzer({
  dataForSeoLogin, setDataForSeoLogin,
  dataForSeoPassword, setDataForSeoPassword,
  seedKeywords, setSeedKeywords,
  locationCode, setLocationCode,
  languageCode, setLanguageCode,
  analysisResults, setAnalysisResults,
}: ToolDataForSeoAnalyzerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleRunAnalysis = async () => {
    if (!dataForSeoLogin || !dataForSeoPassword) {
      setError("Le credenziali API DataForSEO (Login e Password) sono obbligatorie.");
      toast({ title: "Credenziali Mancanti", description: "Inserisci login e password per DataForSEO.", variant: "destructive" });
      return;
    }
    const keywordsArray = seedKeywords.split(',').map(kw => kw.trim()).filter(kw => kw.length > 0);
    if (keywordsArray.length === 0) {
      setError("Inserisci almeno una keyword seed.");
      toast({ title: "Keyword Mancante", description: "Inserisci una o più keyword separate da virgola.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    setLoadingMessage("Recupero idee keyword da DataForSEO...");
    setError(null);
    setAnalysisResults([]);

    try {
      const locCodeNum = locationCode.trim() ? parseInt(locationCode.trim(), 10) : undefined;
      if (locationCode.trim() && (isNaN(locCodeNum as number) || (locCodeNum as number) <=0)) {
        throw new Error("Il Codice Località deve essere un numero positivo valido.");
      }
      
      const langCodeTrimmed = languageCode.trim();

      const result = await fetchDataForSEOKeywordIdeasAction({
        keywords: keywordsArray,
        apiLogin: dataForSeoLogin,
        apiPassword: dataForSeoPassword,
        locationCode: locCodeNum,
        languageCode: langCodeTrimmed || undefined, // Send undefined if empty to use DFS default
      });

      if ('dfs_error' in result) {
        throw new Error(result.dfs_error);
      }
      
      setAnalysisResults(result);
      setLoadingMessage(`Analisi completata. Trovate ${result.length} idee di keyword.`);
      toast({ title: "Analisi Completata", description: `Trovate ${result.length} idee di keyword.` });

    } catch (e: any) {
      console.error("Errore durante l'analisi con DataForSEO (Tool Domanda Consapevole):", e);
      setError(e.message || "Errore sconosciuto durante la comunicazione con DataForSEO.");
      toast({ title: "Errore Analisi DFS", description: e.message, variant: "destructive" });
      setAnalysisResults([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDownloadCSV = () => {
    if (analysisResults.length === 0) {
      toast({ title: "Nessun dato", description: "Nessun risultato da scaricare.", variant: "destructive" });
      return;
    }
    const headers = ["Keyword", "Volume di Ricerca", "CPC", "Difficoltà Keyword", "Competizione"];
    const dataToExport = analysisResults.map(item => ({
        "Keyword": item.keyword || "N/D",
        "Volume di Ricerca": item.search_volume?.toLocaleString() ?? "N/A",
        "CPC": item.cpc ?? "N/A",
        "Difficoltà Keyword": item.keyword_difficulty ?? "N/A",
        "Competizione": item.competition !== null && item.competition !== undefined ? (item.competition * 100).toFixed(0) + '%' : "N/A"
    }));
    exportToCSV("report_analisi_domanda_consapevole_dfs.csv", headers, dataToExport);
  };


  return (
    <div className="space-y-8">
      <header className="text-center">
        <h2 className="text-3xl font-bold" style={{ color: 'hsl(var(--sky-600))' }}>Analisi Domanda Consapevole (DataForSEO)</h2>
        <p className="text-muted-foreground mt-2">Esplora le idee di keyword e le relative metriche fornite da DataForSEO.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><KeyRound className="mr-2 h-5 w-5 text-blue-600" />Credenziali API DataForSEO</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="dfsApiLoginToolNew" className="block text-sm font-medium text-foreground mb-1">API Login (Email)</label>
            <Input 
              type="email" 
              id="dfsApiLoginToolNew" 
              value={dataForSeoLogin} 
              onChange={(e) => setDataForSeoLogin(e.target.value)} 
              placeholder="La tua email di login DataForSEO" 
            />
          </div>
          <div>
            <label htmlFor="dfsApiPasswordToolNew" className="block text-sm font-medium text-foreground mb-1">API Password (o API Key)</label>
            <Input 
              type="password" 
              id="dfsApiPasswordToolNew" 
              value={dataForSeoPassword} 
              onChange={(e) => setDataForSeoPassword(e.target.value)} 
              placeholder="La tua password o API key DataForSEO"
            />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Parametri Analisi Keyword</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label htmlFor="seedKeywords" className="block text-sm font-medium text-foreground mb-1">Keyword Seed (separate da virgola)</label>
            <Textarea
              id="seedKeywords"
              value={seedKeywords}
              onChange={(e) => setSeedKeywords(e.target.value)}
              placeholder="Es: marketing digitale, intelligenza artificiale, viaggi low cost"
              rows={3}
            />
            <p className="text-xs text-muted-foreground mt-1">Inserisci una o più keyword di partenza per l'analisi.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="locationCodeDfs" className="block text-sm font-medium text-foreground mb-1">
                <Globe className="inline mr-1 h-4 w-4" />Codice Località (Opzionale)
              </label>
              <Input 
                type="number" 
                id="locationCodeDfs" 
                value={locationCode} 
                onChange={(e) => setLocationCode(e.target.value)} 
                placeholder="Es: 2840 per USA, 2380 per Italia (default: 2840)" 
              />
              <p className="text-xs text-muted-foreground mt-1">Default Stati Uniti (2840) se lasciato vuoto.</p>
            </div>
            <div>
              <label htmlFor="languageCodeDfs" className="block text-sm font-medium text-foreground mb-1">
                <Languages className="inline mr-1 h-4 w-4" />Codice Lingua (Opzionale)
              </label>
              <Input 
                type="text" 
                id="languageCodeDfs" 
                value={languageCode} 
                onChange={(e) => setLanguageCode(e.target.value)} 
                placeholder="Es: en per Inglese, it per Italiano (default: en)" 
              />
              <p className="text-xs text-muted-foreground mt-1">Default Inglese ('en') se lasciato vuoto.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="text-center">
        <Button onClick={handleRunAnalysis} disabled={isLoading} className="action-button bg-sky-600 hover:bg-sky-700 text-white text-lg">
          {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <SearchIcon className="mr-2 h-5 w-5" />}
          {isLoading ? "Analisi in corso..." : "Analizza Domanda Consapevole"}
        </Button>
      </div>

      {isLoading && (
        <div className="text-center my-6">
          <p className="text-sky-600 text-lg mb-2">{loadingMessage}</p>
          <Progress value={50} className="w-3/4 mx-auto" /> {/* Simple progress for now */}
        </div>
      )}

      {error && (
         <Alert variant="destructive" className="my-4">
           <AlertCircle className="h-4 w-4" />
           <AlertTitle>Errore</AlertTitle>
           <AlertDescription>{error}</AlertDescription>
         </Alert>
      )}

      {analysisResults.length > 0 && !isLoading && (
        <section className="mt-10">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-2xl">Risultati Analisi Domanda Consapevole (DataForSEO)</CardTitle>
                <CardDescription>{analysisResults.length} keyword/idee trovate.</CardDescription>
              </div>
              <Button onClick={handleDownloadCSV} variant="outline">
                Scarica Risultati (CSV) <Download className="ml-2 h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <TableDataForSeoResults results={analysisResults} />
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  );
}
