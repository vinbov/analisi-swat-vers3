
"use client";

import React from 'react';
import { BarChart, Bar, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, LabelList } from 'recharts';
import type { GscSectionAnalysis } from '@/lib/types';

interface ChartGSCProps {
  data?: GscSectionAnalysis['topItemsByClicksChartData']; // For Bar charts
  pieData?: GscSectionAnalysis['pieChartData'];      // For Pie charts
  type: 'bar' | 'pie';
  title: string;
}

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export function ChartGSC({ data, pieData, type, title }: ChartGSCProps) {
  if (type === 'bar') {
    if (!data || !data.labels || data.labels.length === 0 || !data.datasets || data.datasets.length === 0 || data.datasets[0].data.length === 0) {
      return <p className="text-muted-foreground text-center py-8">Dati insufficienti per il grafico a barre: {title}.</p>;
    }
    // Ensure data for Recharts BarChart is an array of objects
    const chartData = data.labels.map((label, index) => ({
      name: label,
      value: data.datasets[0].data[index] || 0,
      fill: Array.isArray(data.datasets[0].backgroundColor) 
            ? data.datasets[0].backgroundColor[index % data.datasets[0].backgroundColor.length] 
            : typeof data.datasets[0].backgroundColor === 'string' 
            ? data.datasets[0].backgroundColor 
            : COLORS[index % COLORS.length]
    }));

    return (
      <div className="h-full w-full">
        <h4 className="text-lg font-semibold text-center mb-4 text-foreground">{title}</h4>
        <ResponsiveContainer width="100%" height="calc(100% - 30px)">
          <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 35 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-25} textAnchor="end" height={70} interval={0} style={{ fontSize: '0.75rem' }} />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Legend />
            <Bar dataKey="value" name={data.datasets[0].label || "Valore"}>
                {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              <LabelList dataKey="value" position="top" style={{ fill: 'hsl(var(--foreground))' }}/>
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (type === 'pie') {
    if (!pieData || pieData.length === 0) {
      return <p className="text-muted-foreground text-center py-8">Dati insufficienti per il grafico a torta: {title}.</p>;
    }
    // pieData should already be in the format: { name: string, value: number, fill: string }[]
    return (
      <div className="h-full w-full">
        <h4 className="text-lg font-semibold text-center mb-4 text-foreground">{title}</h4>
        <ResponsiveContainer width="100%" height="calc(100% - 30px)">
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius="80%"
              fill="#8884d8" // Default fill, will be overridden by Cell
              dataKey="value"
              nameKey="name"
              label={({ name, percent, value }) => `${name}: ${value.toLocaleString()} (${(percent * 100).toFixed(0)}%)`}
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill || COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value: number, name: string) => [`${value.toLocaleString()} Clic`, name]} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return <p className="text-muted-foreground">Tipo di grafico non supportato: {type}.</p>;
}
