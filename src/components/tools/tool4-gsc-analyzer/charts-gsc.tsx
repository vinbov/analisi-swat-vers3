"use client";

import React from 'react';
import { BarChart, Bar, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, LabelList } from 'recharts';
import type { GscSectionAnalysis } from '@/lib/types';

interface ChartGSCProps {
  data?: GscSectionAnalysis['topItemsByClicksChartData'];
  pieData?: GscSectionAnalysis['pieChartData'];
  type: 'bar' | 'pie';
  title: string;
}

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export function ChartGSC({ data, pieData, type, title }: ChartGSCProps) {
  if (type === 'bar') {
    if (!data || !data.datasets || data.datasets.length === 0 || data.datasets[0].data.length === 0) {
      return <p className="text-muted-foreground text-center py-8">Nessun dato sufficiente per il grafico a barre.</p>;
    }
    const chartData = data.labels.map((label, index) => ({
      name: label,
      value: data.datasets[0].data[index] || 0,
    }));

    return (
      <div className="h-full w-full">
        <h4 className="text-lg font-semibold text-center mb-4 text-foreground">{title}</h4>
        <ResponsiveContainer width="100%" height="calc(100% - 30px)">
          <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-15} textAnchor="end" height={50} interval={0} />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Legend />
            <Bar dataKey="value" name={data.datasets[0].label || "Valore"} fill={COLORS[0]}>
              <LabelList dataKey="value" position="top" style={{ fill: 'hsl(var(--foreground))' }}/>
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (type === 'pie') {
    if (!pieData || pieData.length === 0) {
      return <p className="text-muted-foreground text-center py-8">Nessun dato sufficiente per il grafico a torta.</p>;
    }
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
              fill="#8884d8"
              dataKey="value"
              nameKey="name"
              label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
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

  return <p className="text-muted-foreground">Tipo di grafico non supportato.</p>;
}
