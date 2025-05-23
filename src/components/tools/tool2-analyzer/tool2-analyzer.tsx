"use client";
import React, { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { FileUploadZone } from '@/components/shared/file-upload-zone';
import { parseCSVTool2, exportToCSV } from '@/lib/csv';
import type { CsvRowTool2, PertinenceAnalysisResult } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { analyzeKeywordAction } from '@/app/actions/tool2-actions'; 
import { TablePertinenceResults } from './table-pertinence-results';
import { PlayIcon, StopCircle, Download, AlertCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const APP_CHUNK_SIZE_TOOL2 = 10; // Smaller chunk for AI calls to avoid rate limits / long waits

export function Tool2Analyzer() {
  const [apiKey, setApiKey] = useState('');
  const [industry, setIndustry] = useState('');
  const [csvFile, setCsvFile] = useState<{ content: string; name: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [progress, setProgress] = useState(0);
  const [analysisResults, setAnalysisResults] = useState<PertinenceAnalysisResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const isAnalysisStoppedRef = useRef(false);

  const { toast } = useToast();

  const handleFileLoad = useCallback((content: string, name: string) => {
    if (content) {
      setCsvFile({ content, name });
    } else {
      setCsvFile(null);
    }
  }, []);

  const handleStopAnalysis = () => {
    isAnalysisStoppedRef.current = true;
    setLoadingMessage("Interruzione analisi in corso...");
    toast({ title: "Analisi Interrotta", description: "L'analisi è stata interrotta dall'utente." });
  };

  const runAnalysis = async () => {
    if (!apiKey) { setError("Inserisci la tua OpenAI API Key."); return; }
    if (!industry) { setError("Inserisci il Settore di Riferimento."); return; }
    if (!csvFile) { setError("Carica un file CSV con le keyword."); return; }

    setIsLoading(true);
    setLoadingMessage("Preparazione analisi...");
    setProgress(0);
    setError(null);
    setAnalysisResults([]);
    isAnalysisStoppedRef.current = false;

    try {
      const keywordData = parseCSVTool2(csvFile.content);
      if (!keywordData || keywordData.length === 0) {
        setError("Nessun dato valido trovato nel file CSV. Assicurati che ci siano le colonne richieste.");
        setIsLoading(false);
        return;
      }

      const totalKeywords = keywordData.length;
      const results: PertinenceAnalysisResult[] = [];
      
      for (let i = 0; i < totalKeywords; i += APP_CHUNK_SIZE_TOOL2) {
        if (isAnalysisStoppedRef.current) break;

        const chunk = keywordData.slice(i, i + APP_CHUNK_SIZE_TOOL2);
        setLoadingMessage(`Analisi keyword ${i + 1}-${Math.min(i + chunk.length, totalKeywords)} di ${totalKeywords}...`);
        
        const chunkPromises = chunk.map(async (row) => {
          if (isAnalysisStoppedRef.current) return null;
          try {
            const analysis = await analyzeKeywordAction({
              keyword: row.keyword,
              industry: industry,
              volume: typeof row.volume === 'number' ? row.volume : 0, // Default to 0 if N/A
              keywordDifficulty: typeof row.difficolta === 'number' ? row.difficolta : 0,
              opportunity: typeof row.opportunity === 'number' ? row.opportunity : 0,
              currentPosition: typeof row.posizione === 'number' ? row.posizione : 0,
              url: row.url,
              searchIntent: row.intento,
            }, apiKey); // Pass API key to server action
            return {
              keyword: row.keyword,
              settore: industry,
              pertinenza: analysis.relevance,
              prioritaSEO: analysis.seoPriority,
              motivazioneSEO: analysis.motivation,
            };
          } catch (e: any) {
            console.error(`Errore analisi keyword ${row.keyword}:`, e);
            return {
              keyword: row.keyword,
              settore: industry,
              pertinenza: "Errore",
              prioritaSEO: "Errore",
              motivazioneSEO: e.message || "Errore sconosciuto durante analisi AI",
            };
          }
        });

        const chunkResults = (await Promise.all(chunkPromises)).filter(r => r !== null) as PertinenceAnalysisResult[];
        results.push(...chunkResults);
        setAnalysisResults([...results]); // Update results incrementally for display
        
        setProgress(((i + chunk.length) / totalKeywords) * 100);
        
        // Optional delay to avoid overwhelming API or to be polite
        if (!isAnalysisStoppedRef.current && i + APP_CHUNK_SIZE_TOOL2 < totalKeywords) {
          await new Promise(resolve => setTimeout(resolve, 200)); 
        }
      }

      if (isAnalysisStoppedRef.current) {
        setLoadingMessage(`Analisi interrotta. ${results.length} keyword processate.`);
      } else {
        setLoadingMessage("Analisi completata!");
        toast({ title: "Analisi Completata", description: `${results.length} keyword analizzate.` });
      }

    } catch (e: any) {
      console.error("Errore durante l'analisi (Tool 2):", e);
      setError(`Errore analisi (Tool 2): ${e.message}`);
      toast({
        title: "Errore di Analisi",
        description: e.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadCSV = () => {
    if (analysisResults.length === 0) {
      toast({ title: "Nessun dato", description: "Nessun risultato da scaricare.", variant: "destructive" });
      return;
    }
    const headers = ["Keyword", "Settore Analizzato", "Pertinenza", "Priorità SEO", "Motivazione"];
    exportToCSV("report_analisi_pertinenza_priorita.csv", headers, analysisResults);
  };

  return (
    <div className="space-y-8">
      <header className="text-center">
        <h2 className="text-3xl font-bold" style={{ color: 'hsl(var(--sky-600))' }}>Analizzatore Pertinenza & Priorità Keyword</h2>
        <p className="text-muted-foreground mt-2">Determina pertinenza, priorità SEO e motivazione per le tue keyword, usando l'AI.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Configurazione Analisi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="apiKeyTool2" className="block text-sm font-medium text-foreground mb-1">OpenAI API Key</label>
              <Input 
                type="password" 
                id="apiKeyTool2" 
                value={apiKey} 
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Inserisci la tua chiave API OpenAI (es. sk-...)" 
              />
              <p className="text-xs text-muted-foreground mt-1">La chiave API è usata per le chiamate AI e non viene memorizzata permanentemente.</p>
            </div>
            <div>
              <label htmlFor="settoreTool2" className="block text-sm font-medium text-foreground mb-1">Settore di Riferimento</label>
              <Input 
                type="text" 
                id="settoreTool2" 
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="Es: Marketing Online, Ristorazione, etc." 
              />
            </div>
          </div>
          <div>
            <FileUploadZone
              siteKey="Tool2File"
              label="File CSV Keyword e Dati SEO"
              onFileLoad={handleFileLoad}
              dropInstructionText="Trascina qui il file CSV (con colonne: Keyword, Volume, KD, Opportunity, Posizione, URL, Intent) o clicca."
            />
          </div>
        </CardContent>
      </Card>
      
      <div className="text-center space-x-4">
        <Button onClick={runAnalysis} disabled={isLoading} className="action-button bg-sky-600 hover:bg-sky-700 text-white text-lg">
          {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <PlayIcon className="mr-2 h-5 w-5" />}
          {isLoading ? "Analisi in corso..." : "Analizza Keyword"}
        </Button>
        {isLoading && (
          <Button onClick={handleStopAnalysis} variant="destructive" className="action-button text-lg">
            <StopCircle className="mr-2 h-5 w-5" /> Interrompi Analisi
          </Button>
        )}
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

      {analysisResults.length > 0 && !isLoading && (
        <section className="mt-10">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-2xl">Risultati Analisi Pertinenza e Priorità SEO</CardTitle>
                <CardDescription>{analysisResults.length} keyword analizzate.</CardDescription>
              </div>
              <Button onClick={handleDownloadCSV} variant="outline">
                Scarica Risultati (CSV) <Download className="ml-2 h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <TablePertinenceResults results={analysisResults} />
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  );
}
