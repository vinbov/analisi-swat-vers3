"use client";

import React, { useState } from 'react';
import { AppHeader } from '@/components/layout/app-header';
import { ToolNavigation } from '@/components/layout/tool-navigation';
import { Tool1Comparator } from '@/components/tools/tool1-comparator/tool1-comparator';
import { Tool2Analyzer } from '@/components/tools/tool2-analyzer/tool2-analyzer';
import { Tool3Scraper } from '@/components/tools/tool3-scraper/tool3-scraper';
import { Card, CardContent } from '@/components/ui/card';

const tools = [
  { id: 'tool1', label: 'Analizzatore Comparativo KW' },
  { id: 'tool2', label: 'Analizzatore Pertinenza & Priorità KW' },
  { id: 'tool3', label: 'FB Ads Library Scraper' },
];

export default function HomePage() {
  const [activeTool, setActiveTool] = useState<string>('tool1');

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
      <div className="container mx-auto max-w-7xl bg-card p-4 md:p-6 lg:p-8 rounded-lg shadow-xl">
        <AppHeader />
        <ToolNavigation activeTool={activeTool} setActiveTool={setActiveTool} tools={tools} />

        <main>
          {activeTool === 'tool1' && (
            <div id="tool1-container">
              <Tool1Comparator />
            </div>
          )}
          {activeTool === 'tool2' && (
            <div id="tool2-container">
              <Tool2Analyzer />
            </div>
          )}
          {activeTool === 'tool3' && (
            <div id="tool3-container">
              <Tool3Scraper />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
