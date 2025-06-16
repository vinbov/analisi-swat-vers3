
"use client";

import React, { useState } from 'react';
import { AppHeader } from '@/components/layout/app-header';
import { ToolNavigation } from '@/components/layout/tool-navigation';
import { Tool1Comparator } from '@/components/tools/tool1-comparator/tool1-comparator';
import { Tool2Analyzer } from '@/components/tools/tool2-analyzer/tool2-analyzer';
import { Tool3Scraper } from '@/components/tools/tool3-scraper/tool3-scraper';
import { Tool4GSCAnalyzer } from '@/components/tools/tool4-gsc-analyzer/tool4-gsc-analyzer';
import { Tool5MasterReport } from '@/components/tools/tool5-master-report/tool5-master-report';

const tools = [
  { id: 'tool1', label: 'Analizzatore Comparativo KW' },
  { id: 'tool2', label: 'Analizzatore Pertinenza & Priorità KW' },
  { id: 'tool3', label: 'FB Ads Library Scraper' },
  { id: 'tool4', label: 'Analizzatore Dati GSC' },
  { id: 'tool5', label: 'Report Consolidato' },
];

export default function HomePage() {
  const [activeTool, setActiveTool] = useState<string>('tool1');

  // --- State for Tool 1 ---
  const [tool1SiteFiles, setTool1SiteFiles] = useState<Record<string, { content: string; name: string }>>({});

  // --- State for Tool 2 ---
  const [tool2Industry, setTool2Industry] = useState('');
  const [tool2IndustryKeywords, setTool2IndustryKeywords] = useState('');
  const [tool2CsvFile, setTool2CsvFile] = useState<{ content: string; name: string } | null>(null);
  
  // --- State for Tool 3 ---
  const [tool3ApifyToken, setTool3ApifyToken] = useState('');
  const [tool3ApifyActorId, setTool3ApifyActorId] = useState('curious_coder~facebook-ads-library-scraper');
  const [tool3FbAdsUrl, setTool3FbAdsUrl] = useState('');
  const [tool3MaxAdsToProcess, setTool3MaxAdsToProcess] = useState(10);
  const [tool3GoogleApiKey, setTool3GoogleApiKey] = useState('');

  // --- State for Tool 4 ---
  const [tool4GscExcelFile, setTool4GscExcelFile] = useState<{ content: ArrayBuffer; name: string } | null>(null);


  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
      <div className="container mx-auto max-w-7xl bg-card p-4 md:p-6 lg:p-8 rounded-lg shadow-xl">
        <AppHeader />
        <ToolNavigation activeTool={activeTool} setActiveTool={setActiveTool} tools={tools} />

        <main>
          {activeTool === 'tool1' && (
            <div id="tool1-container">
              <Tool1Comparator
                siteFiles={tool1SiteFiles}
                setSiteFiles={setTool1SiteFiles}
              />
            </div>
          )}
          {activeTool === 'tool2' && (
            <div id="tool2-container">
              <Tool2Analyzer
                industry={tool2Industry}
                setIndustry={setTool2Industry}
                industryKeywords={tool2IndustryKeywords}
                setIndustryKeywords={setTool2IndustryKeywords}
                csvFile={tool2CsvFile}
                setCsvFile={setTool2CsvFile}
              />
            </div>
          )}
          {activeTool === 'tool3' && (
            <div id="tool3-container">
              <Tool3Scraper
                apifyToken={tool3ApifyToken}
                setApifyToken={setTool3ApifyToken}
                apifyActorId={tool3ApifyActorId}
                setApifyActorId={setTool3ApifyActorId}
                fbAdsUrl={tool3FbAdsUrl}
                setFbAdsUrl={setTool3FbAdsUrl}
                maxAdsToProcess={tool3MaxAdsToProcess}
                setMaxAdsToProcess={setTool3MaxAdsToProcess}
                googleApiKey={tool3GoogleApiKey}
                setGoogleApiKey={setTool3GoogleApiKey}
              />
            </div>
          )}
          {activeTool === 'tool4' && (
            <div id="tool4-container">
              <Tool4GSCAnalyzer
                gscExcelFile={tool4GscExcelFile}
                setGscExcelFile={setTool4GscExcelFile}
              />
            </div>
          )}
          {activeTool === 'tool5' && (
            <div id="tool5-container">
              <Tool5MasterReport />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
