
"use client";

import type { AdWithAngleAnalysis, AngleAnalysis } from '@/lib/types'; // Aggiunto AngleAnalysis

interface TableAngleAnalysisProps {
  adsWithAnalysis: AdWithAngleAnalysis[];
  isDetailPage?: boolean;
}

export function TableAngleAnalysis({ adsWithAnalysis, isDetailPage = false }: TableAngleAnalysisProps) {
  if (adsWithAnalysis.length === 0) {
    return <p className="text-muted-foreground py-4">Nessun risultato di analisi angle da visualizzare.</p>;
  }

  const headers = ["Ad (Titolo/Testo)", "C1", "C2", "C3", "C4", "C5", "C6", "C7", "Totale", "Valutazione", "Analisi Approfondita"];

  // Funzione helper per accedere ai punteggi in modo sicuro
  const getScore = (analysis: AngleAnalysis | undefined, scoreKey: keyof Omit<AngleAnalysis, 'scores' | 'totalScore' | 'evaluation' | 'detailedAnalysis' | 'error' | 'raw'> | keyof AngleAnalysis['scores']) => {
    if (!analysis) return 'N/A';
    // Prova prima i campi diretti come c1Clarity, poi quelli dentro 'scores'
    if (scoreKey in analysis) return (analysis as any)[scoreKey] ?? 'N/A';
    if (analysis.scores && scoreKey in analysis.scores) return (analysis.scores as any)[scoreKey] ?? 'N/A';
    return 'N/A';
  };


  return (
    <div className={isDetailPage ? "detail-page-table-container" : "table-container"}>
      <table className="min-w-full divide-y divide-border">
        <thead>
          <tr>
            {headers.map(header => (
              <th key={header} scope="col" className="text-center first:text-left">{header}</th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-card divide-y divide-border">
          {adsWithAnalysis.map((item) => {
            const adIdentifier = item.titolo ? item.titolo.substring(0, 50) + (item.titolo.length > 50 ? "..." : "") : item.testo.substring(0, 50) + "...";
            const analysis = item.angleAnalysis; // Questo è l'oggetto AnalyzeFacebookAdMarketingAngleOutput
            const hasError = item.analysisError || analysis?.error;

            return (
              <tr key={item.id}>
                <td className="wrap-text-detail font-medium text-foreground" title={`${item.titolo || ''}\n${item.testo || ''}`}>{adIdentifier}</td>
                {hasError ? (
                  <td colSpan={headers.length - 1} className="text-destructive wrap-text-detail">
                    Errore analisi: {item.analysisError || analysis?.error} 
                    {analysis?.raw && ` (Raw: ${analysis.raw.substring(0,100)}...)`}
                  </td>
                ) : analysis ? (
                  <>
                    <td className="text-center">{getScore(analysis, 'c1Clarity')}</td>
                    <td className="text-center">{getScore(analysis, 'c2Engagement')}</td>
                    <td className="text-center">{getScore(analysis, 'c3Concreteness')}</td>
                    <td className="text-center">{getScore(analysis, 'c4Coherence')}</td>
                    <td className="text-center">{getScore(analysis, 'c5Credibility')}</td>
                    <td className="text-center">{getScore(analysis, 'c6CallToAction')}</td>
                    <td className="text-center">{getScore(analysis, 'c7Context')}</td>
                    <td className="text-center font-semibold">{analysis.totalScore ?? 'N/A'}</td>
                    <td className="wrap-text-detail">{analysis.evaluation || 'N/A'}</td>
                    <td className="wrap-text-detail min-w-[300px] md:min-w-[350px]" dangerouslySetInnerHTML={{ __html: (analysis.detailedAnalysis || 'N/A').replace(/\n/g, '<br />') }} />
                  </>
                ) : (
                  <td colSpan={headers.length - 1} className="text-muted-foreground wrap-text-detail text-center">Analisi non ancora eseguita.</td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

    