"use client"

import type { PertinenceAnalysisResult } from '@/lib/types';

interface TablePertinenceResultsProps {
  results: PertinenceAnalysisResult[];
}

export function TablePertinenceResults({ results }: TablePertinenceResultsProps) {
  if (results.length === 0) {
    return <p className="text-muted-foreground py-4">Nessun risultato da mostrare.</p>;
  }

  const headers = ['Keyword', 'Settore Analizzato', 'Pertinenza', 'Priorità SEO', 'Motivazione'];

  return (
    <div className="table-container">
      <table className="min-w-full divide-y divide-border">
        <thead>
          <tr>
            {headers.map(header => (
              <th key={header} scope="col">{header}</th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-card divide-y divide-border">
          {results.map((row, index) => (
            <tr key={`${row.keyword}-${index}`}>
              <td className="font-medium text-foreground">{row.keyword}</td>
              <td>{row.settore}</td>
              <td className={row.pertinenza === "Errore" ? "text-destructive" : ""}>{row.pertinenza}</td>
              <td className={row.prioritaSEO === "Errore" ? "text-destructive" : ""}>{row.prioritaSEO}</td>
              <td className={`wrap-text-detail ${row.motivazioneSEO.startsWith("Errore") ? "text-destructive" : ""}`}>{row.motivazioneSEO}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
