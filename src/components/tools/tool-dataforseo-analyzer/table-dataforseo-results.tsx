
"use client";

import type { DataForSEOKeywordMetrics } from '@/lib/dataforseo/types';

interface TableDataForSeoResultsProps {
  results: DataForSEOKeywordMetrics[];
}

export function TableDataForSeoResults({ results }: TableDataForSeoResultsProps) {
  if (!results || results.length === 0) {
    return <p className="text-muted-foreground py-4">Nessun risultato da DataForSEO da visualizzare.</p>;
  }

  const headers = [
    "Keyword",
    "Volume di Ricerca",
    "CPC",
    "Difficoltà Keyword",
    "Competizione",
    // "Location Code",
    // "Language Code",
    // "Categorie",
    // "Average Bid" 
  ];

  return (
    <div className="table-container">
      <table className="min-w-full divide-y divide-border">
        <thead>
          <tr>
            {headers.map(header => (
              <th key={header} scope="col" className="text-center first:text-left">{header}</th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-card divide-y divide-border">
          {results.map((item, index) => (
            <tr key={`${item.keyword}-${index}`}>
              <td className="font-medium text-foreground wrap-text-detail">{item.keyword || "N/D"}</td>
              <td className="text-center">{item.search_volume?.toLocaleString() ?? "N/A"}</td>
              <td className="text-center">{item.cpc ?? "N/A"}</td>
              <td className="text-center">{item.keyword_difficulty ?? "N/A"}</td>
              <td className="text-center">{item.competition !== null && item.competition !== undefined ? (item.competition * 100).toFixed(0) + '%' : "N/A"}</td>
              {/* 
              <td className="text-center">{item.location_code ?? "N/A"}</td>
              <td className="text-center">{item.language_code ?? "N/A"}</td>
              <td className="wrap-text">{item.categories?.join(', ') ?? "N/A"}</td>
              <td className="text-center">{item.average_bid ?? "N/A"}</td>
              */}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
