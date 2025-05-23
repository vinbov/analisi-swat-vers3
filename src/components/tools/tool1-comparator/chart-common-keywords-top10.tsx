"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { ComparisonResult } from '@/lib/types';

interface CommonKeywordsTop10ChartProps {
  results: ComparisonResult[];
  activeCompetitorNames: string[];
}

export function CommonKeywordsTop10Chart({ results, activeCompetitorNames }: CommonKeywordsTop10ChartProps) {
  const commonKWs = results.filter(r => r.status === 'common');
  
  let mySiteTop10Count = 0;
  const competitorTop10KeywordSets: Record<string, Set<string>> = {};
  activeCompetitorNames.forEach(name => competitorTop10KeywordSets[name] = new Set());

  commonKWs.forEach(kw => {
    if (kw.mySiteInfo.pos !== 'N/P' && typeof kw.mySiteInfo.pos === 'number' && kw.mySiteInfo.pos <= 10) {
      mySiteTop10Count++;
    }
    kw.competitorInfo.forEach(comp => {
      if (activeCompetitorNames.includes(comp.name) && comp.pos !== 'N/P' && typeof comp.pos === 'number' && comp.pos <= 10) {
        competitorTop10KeywordSets[comp.name].add(kw.keyword);
      }
    });
  });

  let avgCompetitorTop10Count = 0;
  if (activeCompetitorNames.length > 0) {
    const totalCompetitorTop10UniqueKeywords = new Set<string>();
    activeCompetitorNames.forEach(name => {
        competitorTop10KeywordSets[name].forEach(kw => totalCompetitorTop10UniqueKeywords.add(kw));
    });
    avgCompetitorTop10Count = totalCompetitorTop10UniqueKeywords.size; // Show total unique keywords any competitor ranks for in top 10
  }


  const data = [
    { name: 'Mio Sito', count: mySiteTop10Count, fill: 'hsl(var(--chart-3))' }, // green
    { name: `Competitors (${activeCompetitorNames.length})`, count: avgCompetitorTop10Count, fill: 'hsl(var(--chart-4))' }, // red
  ];

  if (mySiteTop10Count === 0 && avgCompetitorTop10Count === 0) {
     return <p className="text-muted-foreground text-center py-8">Nessuna keyword comune trovata in Top 10.</p>;
  }

  return (
    <div className="h-[350px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Legend />
          <Bar dataKey="count" name="N. Keyword Comuni in Top 10" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
