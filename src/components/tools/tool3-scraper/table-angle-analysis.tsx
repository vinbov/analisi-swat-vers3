
"use client";

import type { AdWithAngleAnalysis, AngleAnalysis } from '@/lib/types';

interface TableAngleAnalysisProps {
  adsWithAnalysis: AdWithAngleAnalysis[];
  isDetailPage?: boolean;
}

export function TableAngleAnalysis({ adsWithAnalysis, isDetailPage = false }: TableAngleAnalysisProps) {
  if (adsWithAnalysis.length === 0) {
    return <p className="text-muted-foreground py-4">Nessun risultato di analisi angle da visualizzare.</p>;
  }

  const headers = ["Ad (Titolo/Testo)", "C1", "C2", "C3", "C4", "C5", "C6", "C7", "Totale", "Valutazione", "Analisi Approfondita"];

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
            const analysis = item.angleAnalysis;
            const hasError = item.analysisError || analysis?.error;

            return (
              <tr key={item.id}>
                <td className="wrap-text-detail font-medium text-foreground" title={`${item.titolo || ''}\n${item.testo || ''}`}>{adIdentifier}</td>
                {hasError ? (
                  <td colSpan={headers.length - 1} className="text-destructive wrap-text-detail">
                    Errore analisi: {item.analysisError || analysis?.error || "Errore sconosciuto"}
                    {/* Non tentare di accedere a analysis.raw qui se analysis potrebbe essere l'errore stesso */}
                  </td>
                ) : analysis ? (
                  <>
                    <td className="text-center">{analysis.c1Clarity ?? 'N/A'}</td>
                    <td className="text-center">{analysis.c2Engagement ?? 'N/A'}</td>
                    <td className="text-center">{analysis.c3Concreteness ?? 'N/A'}</td>
                    <td className="text-center">{analysis.c4Coherence ?? 'N/A'}</td>
                    <td className="text-center">{analysis.c5Credibility ?? 'N/A'}</td>
                    <td className="text-center">{analysis.c6CallToAction ?? 'N/A'}</td>
                    <td className="text-center">{analysis.c7Context ?? 'N/A'}</td>
                    <td className="text-center font-semibold">{analysis.totalScore ?? 'N/A'}</td>
                    <td className="wrap-text-detail">{analysis.evaluation || 'N/A'}</td>
                    <td 
                      className="wrap-text-detail min-w-[300px] md:min-w-[350px]" 
                      dangerouslySetInnerHTML={{ __html: (analysis.detailedAnalysis || 'N/A').replace(/\n/g, '<br />') }} 
                    />
                  </>
                ) : (
                  <td colSpan={headers.length - 1} className="text-muted-foreground wrap-text-detail text-center">
                    Analisi non ancora eseguita o non selezionata.
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
    