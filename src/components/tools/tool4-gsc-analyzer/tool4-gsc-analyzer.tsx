
"use client";
import React, { useState, useCallback, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { FileUploadZone } from '@/components/shared/file-upload-zone';
import { useToast } from '@/hooks/use-toast';
import { exportToCSV } from '@/lib/csv';
import type { GscSheetRow, GscParsedData, GscAnalyzedData, GscSectionAnalysis, GscReportType, GscAnalyzedItem } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TableGSC } from './table-gsc';
import { ChartGSC } from './charts-gsc';
import { Loader2, BarChart2, PieChartIcon, Download, AlertCircle, Eye } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

const GSC_SHEET_MAPPING: Record<GscReportType, string[]> = {
    filters: ["Filters", "Filtri", "Panoramica"],
    queries: ["Queries", "Query", "Query di ricerca", "Principali query"],
    pages: ["Pages", "Pagine", "Pagine principali", "Principali pagine"],
    countries: ["Countries", "Paesi"],
    devices: ["Devices", "Dispositivi"],
    searchAppearance: ["Search Appearance", "Aspetto nella ricerca", "Search appearances", "Tipi di risultati multimediali", "Aspetto della ricerca"]
};
const GSC_SHEET_DISPLAY_ORDER: GscReportType[] = ['filters', 'queries', 'pages', 'countries', 'devices', 'searchAppearance'];

const GSC_LOGO_URL = "https://placehold.co/150x50/1e3a8a/FFFFFF?text=GSC+Tool";

export function Tool4GSCAnalyzer() {
    const [gscExcelFile, setGscExcelFile] = useState<{ content: ArrayBuffer; name: string } | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState("");
    const [progress, setProgress] = useState(0);

    const [parsedGscData, setParsedGscData] = useState<GscParsedData | null>(null);
    const [analyzedGscData, setAnalyzedGscData] = useState<GscAnalyzedData | null>(null);
    const [gscFiltersDisplay, setGscFiltersDisplay] = useState<string>("");

    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();
    const router = useRouter();

    useEffect(() => {
      console.log("[Tool4 Effect] analyzedGscData state updated:", analyzedGscData);
    }, [analyzedGscData]);

    const handleFileLoad = useCallback((content: string, name: string, arrayBufferContent?: ArrayBuffer) => {
        console.log("[Tool4 handleFileLoad] File received:", name, "ArrayBuffer present:", !!arrayBufferContent, "Length:", arrayBufferContent?.byteLength);
        if (arrayBufferContent && arrayBufferContent.byteLength > 0) {
            setGscExcelFile({ content: arrayBufferContent, name });
            setError(null);
            // Reset previous results when a new file is loaded
            setParsedGscData(null);
            setAnalyzedGscData(null);
            setGscFiltersDisplay("");
        } else {
            console.error("Tool4 handleFileLoad: arrayBufferContent non valido o vuoto.", { name, arrayBufferContent });
            setError("Errore nel caricamento del file Excel/ODS. Il contenuto non è valido o il file è vuoto.");
            setGscExcelFile(null);
        }
    }, []);

    const handleResetFile = () => {
        setGscExcelFile(null);
        setParsedGscData(null);
        setAnalyzedGscData(null);
        setError(null);
        setGscFiltersDisplay("");
    };

    const parseSheetData = (sheet: XLSX.WorkSheet, reportType: GscReportType): GscSheetRow[] => {
        console.log(`[Tool4 ParseSheetData] Parsing sheet for reportType: ${reportType}`);
        const jsonData = XLSX.utils.sheet_to_json<any>(sheet, { header: 1, blankrows: false, defval: null });
        if (jsonData.length === 0) {
            console.warn(`[Tool4 ParseSheetData] Sheet for ${reportType} is empty or unreadable.`);
            return [];
        }
        console.log(`[Tool4 ParseSheetData] Raw data from sheet for ${reportType} (first 5 rows):`, JSON.stringify(jsonData.slice(0,5)));

        let headersRaw: any[] = [];
        let dataRows: any[][] = [];
        let headerRowIndex = -1;

        for (let i = 0; i < Math.min(5, jsonData.length); i++) {
            const row = jsonData[i] as any[];
            if (row && row.some(h => typeof h === 'string' && (
                h.toLowerCase().includes('clic') || h.toLowerCase().includes('impression') ||
                h.toLowerCase().includes('query') || h.toLowerCase().includes('page') ||
                h.toLowerCase().includes('date') || h.toLowerCase().includes('filter')
            ))) {
                headersRaw = row;
                dataRows = jsonData.slice(i + 1) as any[][];
                headerRowIndex = i;
                console.log(`[Tool4 ParseSheetData] Headers found for ${reportType} at row index ${i}:`, headersRaw);
                break;
            }
        }
        
        if (headerRowIndex === -1) {
            if (jsonData.length > 0 && reportType === 'filters') {
                headersRaw = jsonData[0] as any[]; 
                dataRows = jsonData.slice(1) as any[][];
                 console.log(`[Tool4 ParseSheetData] No typical GSC headers found for FILTERS, using first row as headers:`, headersRaw);
            } else if (jsonData.length > 0 && reportType !== 'filters') {
                 headersRaw = jsonData[0] as any[]; 
                 dataRows = jsonData.slice(1) as any[][];
                 console.warn(`[Tool4 ParseSheetData] No typical GSC headers found for ${reportType}. Assuming first row as headers:`, headersRaw);
            } else {
                console.warn(`[Tool4 ParseSheetData] Sheet for ${reportType} has no headers and no data rows.`);
                return [];
            }
        }

        const headerMap: Record<string, keyof GscSheetRow | 'item'> = {
            "top queries": "item", "top query": "item", "query": "item", "principali query": "item",
            "top pages": "item", "pagina": "item", "pagine principali": "item", "principali pagine": "item",
            "country": "item", "paese": "item", "paesi": "item",
            "device": "item", "dispositivo": "item", "dispositivi": "item",
            "search appearance": "item", "aspetto nella ricerca": "item", "search appearances": "item", "tipi di risultati multimediali": "item", "aspetto della ricerca": "item",
            "date": "item", "data": "item",

            "clicks": "clicks_current", "clic": "clicks_current",
            "impressions": "impressions_current", "impressioni": "impressions_current",
            "ctr": "ctr_current",
            "position": "position_current", "posizione": "position_current",

            "last 3 months clicks": "clicks_current", "clic ultimi 3 mesi": "clicks_current", "clic (ultimi 3 mesi)": "clicks_current",
            "clicks last 28 days": "clicks_current", "clic ultimi 28 giorni": "clicks_current",
            "previous 3 months clicks": "clicks_previous", "clic 3 mesi precedenti": "clicks_previous", "clic (3 mesi precedenti)": "clicks_previous",
            "clicks previous 28 days": "clicks_previous", "clic 28 giorni precedenti": "clicks_previous",

            "last 3 months impressions": "impressions_current", "impressioni ultimi 3 mesi": "impressions_current", "impressioni (ultimi 3 mesi)": "impressions_current",
            "impressions last 28 days": "impressions_current", "impressioni ultimi 28 giorni": "impressions_current",
            "previous 3 months impressions": "impressions_previous", "impressioni 3 mesi precedenti": "impressions_previous", "impressioni (3 mesi precedenti)": "impressions_previous",
            "impressions previous 28 days": "impressions_previous", "impressioni 28 giorni precedenti": "impressions_previous",

            "last 3 months ctr": "ctr_current", "ctr ultimi 3 mesi": "ctr_current", "ctr (ultimi 3 mesi)": "ctr_current",
            "ctr last 28 days": "ctr_current", "ctr ultimi 28 giorni": "ctr_current",
            "previous 3 months ctr": "ctr_previous", "ctr 3 mesi precedenti": "ctr_previous", "ctr (3 mesi precedenti)": "ctr_previous",
            "ctr previous 28 days": "ctr_previous", "ctr 28 giorni precedenti": "ctr_previous",

            "last 3 months position": "position_current", "posizione ultimi 3 mesi": "position_current", "posizione (ultimi 3 mesi)": "position_current",
            "position last 28 days": "position_current", "posizione ultimi 28 giorni": "position_current",
            "previous 3 months position": "position_previous", "posizione 3 mesi precedenti": "position_previous", "posizione (3 mesi precedenti)": "position_previous",
            "position previous 28 days": "position_previous", "posizione 28 giorni precedenti": "position_previous",

            "filter": "filterName", "filtro": "filterName",
            "value": "filterValue", "valore": "filterValue"
        };

        const headers = headersRaw.map((h, idx) => {
            const trimmedHeader = String(h || '').trim().toLowerCase();
            if (idx === 0 && reportType !== 'filters') return 'item'; 
            return headerMap[trimmedHeader] || trimmedHeader.replace(/\s+/g, '_').replace(/[^\w_]/gi, '') || `column_${idx}`;
        });
         console.log(`[Tool4 ParseSheetData] Mapped headers for ${reportType}:`, headers);

        const parsedRows: GscSheetRow[] = dataRows.map(row => {
            const entry: GscSheetRow = {};
            headers.forEach((header, index) => {
                let value = row[index];
                const key = header as keyof GscSheetRow;

                if (key === 'clicks_current' || key === 'clicks_previous' || key === 'impressions_current' || key === 'impressions_previous') {
                    value = (value === undefined || value === null || String(value).trim() === "" || String(value).trim() === "-") ? 0 : parseInt(String(value).replace(/[^\d]/g, '')) || 0;
                } else if (key === 'ctr_current' || key === 'ctr_previous') {
                    if (typeof value === 'string') value = parseFloat(value.replace('%', '').replace(',', '.')) / 100;
                    else if (typeof value === 'number') value = (value > 1 && value <= 100) ? value / 100 : value;
                    else value = 0;
                    value = isNaN(value) ? 0 : value;
                } else if (key === 'position_current' || key === 'position_previous') {
                    value = (value === undefined || value === null || String(value).trim() === "" || String(value).trim() === "-") ? null : parseFloat(String(value).replace(',', '.')) || null;
                } else if (key === 'item' || key === 'filterName' || key === 'filterValue') {
                    value = String(value || '').trim();
                }
                entry[key] = value;
            });
            if (!entry.item && reportType !== 'filters' && row[0] !== undefined && row[0] !== null) {
                entry.item = String(row[0]).trim();
            }
            if (reportType === 'filters' && !entry.filterName && row[0]) entry.filterName = String(row[0]).trim();
            if (reportType === 'filters' && !entry.filterValue && row[1]) entry.filterValue = String(row[1]).trim();
            
            return entry;
        }).filter(entry => (reportType === 'filters' ? entry.filterName : entry.item) ); 
        console.log(`[Tool4 ParseSheetData] Parsed ${parsedRows.length} rows for ${reportType}. First parsed row (if any):`, JSON.stringify(parsedRows[0]));
        return parsedRows;
    };

    const analyzeGSCData = (data: GscSheetRow[], itemKeyType: GscReportType): GscSectionAnalysis | null => {
        console.log(`[Tool4 AnalyzeGSCData] Analyzing data for ${itemKeyType}. Input data length: ${data?.length}`);
        if (!data || data.length === 0) {
             console.warn(`[Tool4 AnalyzeGSCData] No data to analyze for ${itemKeyType}, returning null.`);
            return null;
        }

        let totalCurrentClicks = 0, totalPreviousClicks = 0, totalCurrentImpressions = 0, totalPreviousImpressions = 0;

        const processedItems: GscAnalyzedItem[] = data.map(d => {
            const currentClicks = d.clicks_current || 0;
            const previousClicks = d.clicks_previous || 0;
            const currentImpressions = d.impressions_current || 0;
            const previousImpressions = d.impressions_previous || 0;
            const currentCTR = d.ctr_current || 0;
            const previousCTR = d.ctr_previous || 0;
            const currentPosition = d.position_current ?? null;
            const previousPosition = d.position_previous ?? null;

            totalCurrentClicks += currentClicks;
            totalPreviousClicks += previousClicks;
            totalCurrentImpressions += currentImpressions;
            totalPreviousImpressions += previousImpressions;

            const diffClicks = currentClicks - previousClicks;
            const percChangeClicks = previousClicks !== 0 ? (diffClicks / previousClicks) : (currentClicks > 0 ? Infinity : 0);
            const diffImpressions = currentImpressions - previousImpressions;
            const percChangeImpressions = previousImpressions !== 0 ? (diffImpressions / previousImpressions) : (currentImpressions > 0 ? Infinity : 0);
            const diffCTR = currentCTR - previousCTR;
            let diffPosition: number | null = null;
            if (currentPosition !== null && previousPosition !== null) {
                diffPosition = previousPosition - currentPosition;
            }

            return {
                item: d.item || "N/D",
                clicks_current: currentClicks, clicks_previous: previousClicks, diff_clicks: diffClicks, perc_change_clicks: percChangeClicks,
                impressions_current: currentImpressions, impressions_previous: previousImpressions, diff_impressions: diffImpressions, perc_change_impressions: percChangeImpressions,
                ctr_current: currentCTR, ctr_previous: previousCTR, diff_ctr: diffCTR,
                position_current: currentPosition, position_previous: previousPosition, diff_position: diffPosition,
            };
        });
        console.log(`[Tool4 AnalyzeGSCData] Processed ${processedItems.length} items for ${itemKeyType}. First processed item:`, JSON.stringify(processedItems[0]));

        let summaryText = `Clic totali (periodo corrente): ${totalCurrentClicks.toLocaleString()}. Impressioni totali: ${totalCurrentImpressions.toLocaleString()}.`;
        if(totalPreviousClicks > 0 || totalPreviousImpressions > 0) {
            const overallClickDiff = totalCurrentClicks - totalPreviousClicks;
            const overallImpressionDiff = totalCurrentImpressions - totalPreviousImpressions;
            summaryText += ` Variazione clic vs periodo precedente: ${overallClickDiff >= 0 ? '+' : ''}${overallClickDiff.toLocaleString()}.`;
            summaryText += ` Variazione impressioni: ${overallImpressionDiff >= 0 ? '+' : ''}${overallImpressionDiff.toLocaleString()}.`;
        }
        console.log(`[Tool4 AnalyzeGSCData] Summary for ${itemKeyType}: ${summaryText}`);

        const topNForChart = 5;
        const topItemsByClicks = [...processedItems]
                                  .filter(it => it.item && it.clicks_current > 0)
                                  .sort((a, b) => (b.clicks_current || 0) - (a.clicks_current || 0))
                                  .slice(0, topNForChart);
        
        const chartColors = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

        let chartDataForBar: GscSectionAnalysis['topItemsByClicksChartData'] = {
            labels: [], datasets: [{ label: 'Clic (Corrente)', data: [], backgroundColor: chartColors[0] }]
        };
        let chartDataForPie: GscSectionAnalysis['pieChartData'] = [];

        if (itemKeyType === 'devices') {
            const deviceSummary = processedItems.reduce((acc, curr) => {
                const deviceName = curr.item || 'Sconosciuto';
                acc[deviceName] = (acc[deviceName] || 0) + curr.clicks_current;
                return acc;
            }, {} as Record<string, number>);

            chartDataForPie = Object.entries(deviceSummary)
                .filter(([, value]) => value > 0)
                .map(([name, value], index) => ({ name, value, fill: chartColors[index % chartColors.length] }))
                .sort((a,b) => b.value - a.value);
            
            chartDataForBar = { 
                labels: chartDataForPie.map(d => d.name),
                datasets: [{ label: 'Clic per Dispositivo', data: chartDataForPie.map(d => d.value), backgroundColor: chartDataForPie.map(d=>d.fill) }]
            };
        } else if (topItemsByClicks.length > 0) {
             chartDataForBar = {
                labels: topItemsByClicks.map(it => (String(it.item) || 'N/D').substring(0, 30) + ((String(it.item) || '').length > 30 ? '...' : '')),
                datasets: [{ label: 'Clic (Corrente)', data: topItemsByClicks.map(it => it.clicks_current), backgroundColor: topItemsByClicks.map((_, index) => chartColors[index % chartColors.length]) }]
            };
        }
        console.log(`[Tool4 AnalyzeGSCData] For ${itemKeyType}: chartDataForBar prepared with ${chartDataForBar.labels.length} labels. Data:`, JSON.stringify(chartDataForBar.datasets[0].data));
        console.log(`[Tool4 AnalyzeGSCData] For ${itemKeyType}: pieChartData prepared with ${chartDataForPie.length} items. Data:`, JSON.stringify(chartDataForPie));
        
        return { summaryText, detailedDataWithDiffs: processedItems, topItemsByClicksChartData: chartDataForBar, pieChartData: chartDataForPie };
    };

    const processGSCData = async () => {
        console.log("[Tool4 ProcessGSCData] STEP 1: Function called.");
        if (!gscExcelFile) {
            setError("Nessun file Excel/ODS caricato.");
            console.error("[Tool4 ProcessGSCData] STEP 2: No GSC Excel file loaded. gscExcelFile is null.");
            return;
        }
        console.log("[Tool4 ProcessGSCData] STEP 2: gscExcelFile details:", { name: gscExcelFile.name, contentExists: !!gscExcelFile.content, contentLength: gscExcelFile.content?.byteLength });
        if (!gscExcelFile.content || gscExcelFile.content.byteLength === 0) {
            setError("Il contenuto del file Excel/ODS è vuoto o non valido.");
            console.error("[Tool4 ProcessGSCData] STEP 2.1: File content is empty or invalid.");
            return;
        }

        setIsLoading(true);
        setLoadingMessage("Lettura file...");
        setError(null);
        setParsedGscData(null); // Reset previous parsed data
        setAnalyzedGscData(null); // Reset previous analyzed data
        setGscFiltersDisplay("");
        console.log("[Tool4 ProcessGSCData] STEP 3: State reset, loading indicator shown.");

        try {
            console.log("[Tool4 ProcessGSCData] STEP 4: Reading GSC Excel file content. File name:", gscExcelFile.name);
            const workbook = XLSX.read(gscExcelFile.content, { type: 'array', cellDates: true });
            console.log("[Tool4 ProcessGSCData] STEP 5: Workbook read. Sheet names:", workbook.SheetNames);
            
            const newParsedData: GscParsedData = {};
            const newAnalyzedData: GscAnalyzedData = {};

            let filtersText = '<h4 class="font-semibold text-sky-700 mb-1">Filtri GSC Applicati all\'Export:</h4>';
            const filtersSheetName = workbook.SheetNames.find(name => GSC_SHEET_MAPPING.filters.some(pn => name.toLowerCase().trim() === pn.toLowerCase().trim()));
            
            if (filtersSheetName) {
                console.log(`[Tool4 ProcessGSCData] STEP 6: Found filters sheet: ${filtersSheetName}`);
                newParsedData.filters = parseSheetData(workbook.Sheets[filtersSheetName], 'filters');
                 console.log(`[Tool4 ProcessGSCData] STEP 6.1: Parsed filters data (count: ${newParsedData.filters?.length}):`, JSON.stringify(newParsedData.filters?.slice(0,2)));
                if (newParsedData.filters && newParsedData.filters.length > 0) {
                    filtersText += '<ul>';
                    newParsedData.filters.forEach(filter => {
                         filtersText += `<li class="ml-4 list-disc">${filter.filterName || 'Filtro Sconosciuto'}: ${filter.filterValue || 'N/D'}</li>`;
                    });
                    filtersText += '</ul>';
                } else {
                    filtersText += '<p>Nessun filtro specifico rilevato o foglio "Filters" vuoto.</p>';
                }
            } else {
                filtersText += '<p>Foglio "Filters" non trovato.</p>';
                console.log("[Tool4 ProcessGSCData] STEP 6: Filters sheet not found.");
            }
            setGscFiltersDisplay(filtersText);
            console.log("[Tool4 ProcessGSCData] STEP 7: Filters display HTML set.");

            let currentProgress = 0;
            const progressIncrement = 100 / (GSC_SHEET_DISPLAY_ORDER.length -1); // -1 because filters is separate

            for (const reportType of GSC_SHEET_DISPLAY_ORDER) {
                if (reportType === 'filters') continue;

                console.log(`[Tool4 ProcessGSCData] STEP 8: --- Processing reportType: ${reportType} ---`);
                setLoadingMessage(`Parsing foglio: ${reportType}...`);
                const sheetName = workbook.SheetNames.find(name => GSC_SHEET_MAPPING[reportType].some(pn => name.toLowerCase().trim() === pn.toLowerCase().trim()));

                if (sheetName) {
                    console.log(`[Tool4 ProcessGSCData] STEP 8.1: Found sheet for ${reportType}: ${sheetName}`);
                    const sheetData = parseSheetData(workbook.Sheets[sheetName], reportType);
                    newParsedData[reportType] = sheetData;
                    console.log(`[Tool4 ProcessGSCData] STEP 8.2: Parsed data for ${reportType} (count: ${sheetData.length}).`);
                    
                    if (sheetData.length > 0) {
                        setLoadingMessage(`Analisi dati: ${reportType}...`);
                        newAnalyzedData[reportType] = analyzeGSCData(sheetData, reportType) || undefined;
                        console.log(`[Tool4 ProcessGSCData] STEP 8.3: Analyzed data for ${reportType} (exists: ${!!newAnalyzedData[reportType]})`);
                    } else {
                        console.warn(`[Tool4 ProcessGSCData] STEP 8.3: Sheet data for ${reportType} is empty. Setting analyzed data to undefined.`);
                        newAnalyzedData[reportType] = undefined;
                    }
                } else {
                    console.warn(`[Tool4 ProcessGSCData] STEP 8.1: Sheet for ${reportType} not found with expected names: ${GSC_SHEET_MAPPING[reportType].join(', ')}.`);
                    newParsedData[reportType] = [];
                    newAnalyzedData[reportType] = undefined;
                }
                 currentProgress += progressIncrement;
                 setProgress(Math.min(currentProgress, 100)); 
            }

            console.log("[Tool4 ProcessGSCData] STEP 9: Final newParsedData to be set:", JSON.stringify(newParsedData).substring(0, 500) + "...");
            console.log("[Tool4 ProcessGSCData] STEP 10: Final newAnalyzedData to be set:", JSON.stringify(newAnalyzedData).substring(0, 500) + "...");
            setParsedGscData(newParsedData);
            setAnalyzedGscData(newAnalyzedData);
            
            toast({ title: "Analisi Completata", description: "Dati GSC processati." });
            console.log("[Tool4 ProcessGSCData] STEP 11: Analysis complete. State updated.");

        } catch (e: any) {
            console.error("[Tool4 ProcessGSCData] STEP FINAL_ERROR: Error during GSC processing:", e);
            setError(`Errore nel processamento del file GSC: ${e.message}`);
            toast({ title: "Errore Analisi", description: e.message, variant: "destructive" });
        } finally {
            setIsLoading(false);
            setLoadingMessage("");
            setProgress(0);
            console.log("[Tool4 ProcessGSCData] STEP FINAL: Processing finished. Loading state reset.");
        }
    };

    const getReportItemDisplayName = (type: GscReportType): string => {
        switch(type) {
            case 'queries': return 'Query';
            case 'pages': return 'Pagina';
            case 'countries': return 'Paese';
            case 'devices': return 'Dispositivo';
            case 'searchAppearance': return 'Aspetto nella Ricerca';
            default: return 'Elemento';
        }
    };

    const handleDownloadSectionCSV = (reportType: GscReportType) => {
        const dataToExport = analyzedGscData?.[reportType]?.detailedDataWithDiffs;
        if (!dataToExport || dataToExport.length === 0) {
            toast({ title: "Nessun dato", description: `Nessun dato da scaricare per ${getReportItemDisplayName(reportType)}.`, variant: "destructive" });
            return;
        }
        const headers = [
            getReportItemDisplayName(reportType), "Clic Attuali", "Clic Prec.", "Diff. Clic", "% Clic",
            "Impr. Attuali", "Impr. Prec.", "Diff. Impr.", "% Impr.",
            "CTR Attuale", "CTR Prec.", "Diff. CTR",
            "Pos. Attuale", "Pos. Prec.", "Diff. Pos."
        ];
         const dataForCsv = dataToExport.map(d => ({
            [getReportItemDisplayName(reportType)]: d.item,
            "Clic Attuali": d.clicks_current, "Clic Prec.": d.clicks_previous, "Diff. Clic": d.diff_clicks,
            "% Clic": isFinite(d.perc_change_clicks) ? (d.perc_change_clicks * 100).toFixed(1) + '%' : (d.perc_change_clicks === Infinity ? '+Inf%' : 'N/A'),
            "Impr. Attuali": d.impressions_current, "Impr. Prec.": d.impressions_previous, "Diff. Impr.": d.diff_impressions,
            "% Impr.": isFinite(d.perc_change_impressions) ? (d.perc_change_impressions * 100).toFixed(1) + '%' : (d.perc_change_impressions === Infinity ? '+Inf%' : 'N/A'),
            "CTR Attuale": (d.ctr_current * 100).toFixed(2) + '%', "CTR Prec.": (d.ctr_previous * 100).toFixed(2) + '%',
            "Diff. CTR": (d.diff_ctr * 100).toFixed(2) + 'pp',
            "Pos. Attuale": d.position_current?.toFixed(1) || 'N/A', "Pos. Prec.": d.position_previous?.toFixed(1) || 'N/A',
            "Diff. Pos.": d.diff_position?.toFixed(1) || 'N/A',
        }));
        exportToCSV(`report_gsc_${reportType}.csv`, headers, dataForCsv);
    };

    const openDetailPage = (reportType: GscReportType) => {
        const analysis = analyzedGscData?.[reportType];
        console.log(`[Tool4 openDetailPage] Opening detail for ${reportType}. Analysis data available: ${!!analysis}`);
        if (!analysis || !analysis.detailedDataWithDiffs || analysis.detailedDataWithDiffs.length === 0) {
            toast({ title: "Dati Insufficienti", description: `Nessun dato dettagliato da visualizzare per ${getReportItemDisplayName(reportType)}.`, variant: "destructive"});
            return;
        }
        localStorage.setItem('tool4DetailData', JSON.stringify({
            reportType,
            itemDisplayName: getReportItemDisplayName(reportType),
            analyzedData: analysis,
            chartType: reportType === 'devices' ? 'pie' : 'bar',
            pageTitle: `Dettaglio GSC: ${getReportItemDisplayName(reportType)}`,
            description: analysis.summaryText,
        }));
        router.push(`/tool4/${reportType}`);
    };

    const acceptedExcelTypes = ".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,.xls,application/vnd.ms-excel,.ods,application/vnd.oasis.opendocument.spreadsheet";

    return (
        <div className="space-y-8">
            <header className="text-center">
                 <Image src={GSC_LOGO_URL} alt="Logo GSC Tool" width={150} height={50} className="mx-auto h-12 mb-4 object-contain" data-ai-hint="logo excel chart" />
                <h2 className="text-3xl font-bold text-sky-700">Analizzatore Dati Google Search Console</h2>
                <p className="text-muted-foreground mt-2">Carica il tuo export Excel/ODS da GSC per un'analisi descrittiva dei dati.</p>
            </header>

            <Card>
                <CardHeader>
                    <CardTitle>Caricamento File GSC Excel/ODS (Ver.ULTIMO_TENTATIVO)</CardTitle>
                </CardHeader>
                <CardContent>
                    <FileUploadZone
                        siteKey="gscExcelFile"
                        label="File GSC (formati .xlsx, .xls, .ods)"
                        onFileLoad={handleFileLoad}
                        acceptedFileTypes={acceptedExcelTypes}
                        dropInstructionText="Trascina qui il file (.xlsx, .xls, .ods) o clicca per selezionare."
                        expectsArrayBuffer={true}
                    />
                     <p className="text-xs text-muted-foreground mt-1">Il tool analizzerà i fogli: Queries, Pages, Countries, Devices, Search Appearance, Filters (se presenti con nomi standard o comuni alias in italiano/inglese).</p>
                    {gscExcelFile && (
                         <Button onClick={handleResetFile} variant="outline" size="sm" className="mt-2">Rimuovi File</Button>
                    )}
                </CardContent>
            </Card>

            {gscExcelFile && (
                <div className="text-center">
                    <Button 
                        onClick={() => {
                            console.log("[Tool4 Button Click] 'Analizza Dati GSC' clicked. Calling processGSCData.");
                            processGSCData();
                        }} 
                        disabled={isLoading} 
                        className="action-button bg-sky-600 hover:bg-sky-700 text-white text-lg"
                    >
                        {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <BarChart2 className="mr-2 h-5 w-5" />}
                        {isLoading ? "Analisi in corso..." : "Analizza Dati GSC"}
                    </Button>
                </div>
            )}

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

            {analyzedGscData && !isLoading && (
                <div className="space-y-8 mt-10">
                    {gscFiltersDisplay && (
                        <Card>
                            <CardContent className="pt-6">
                                <div dangerouslySetInnerHTML={{ __html: gscFiltersDisplay }} className="prose prose-sm max-w-none text-muted-foreground"/>
                            </CardContent>
                        </Card>
                    )}

                    {GSC_SHEET_DISPLAY_ORDER.filter(type => type !== 'filters').map((reportType) => {
                        const analysis = analyzedGscData[reportType];
                        const itemDisplayName = getReportItemDisplayName(reportType);
                        const chartType = reportType === 'devices' ? 'pie' : 'bar';
                        
                        console.log(`[Tool4 Rendering Section] ReportType: ${reportType}, Analysis available: ${!!analysis}, Detailed data present: ${!!analysis?.detailedDataWithDiffs?.length}`);
                        
                        if (!analysis || !analysis.detailedDataWithDiffs || analysis.detailedDataWithDiffs.length === 0) {
                             console.log(`[Tool4 Rendering Section] No data or empty detailedDataWithDiffs for ${reportType}. Rendering 'No data' card.`);
                             return (
                                <Card key={reportType}>
                                    <CardHeader>
                                        <CardTitle className="text-xl font-semibold">Analisi {itemDisplayName}</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-muted-foreground">Nessun dato trovato per {itemDisplayName} o foglio non presente/vuoto.</p>
                                    </CardContent>
                                </Card>
                            );
                        }
                        
                        const chartDataForRender = analysis.topItemsByClicksChartData && analysis.topItemsByClicksChartData.labels && analysis.topItemsByClicksChartData.labels.length > 0
                            ? analysis.topItemsByClicksChartData 
                            : { labels: [], datasets: [{ label: 'Clic (Corrente)', data: [], backgroundColor: 'hsl(var(--chart-1))' }] };
                        
                        const pieDataForRender = analysis.pieChartData && Array.isArray(analysis.pieChartData) && analysis.pieChartData.length > 0
                            ? analysis.pieChartData
                            : [];

                        console.log(`[Tool4 Rendering Section] For ${reportType}: chartDataForRender -> labels: ${chartDataForRender.labels.length}, dataset data: ${chartDataForRender.datasets[0].data.length}`);
                        console.log(`[Tool4 Rendering Section] For ${reportType}: pieDataForRender -> items: ${pieDataForRender.length}`);

                        return (
                            <Card key={reportType} id={`${reportType}-analysis-section`}>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-xl font-semibold">Analisi {itemDisplayName}</CardTitle>
                                    <Button variant="outline" size="sm" onClick={() => openDetailPage(reportType)}>
                                        <Eye className="mr-2 h-4 w-4"/> Vedi Dettaglio
                                    </Button>
                                </CardHeader>
                                <CardContent>
                                    {analysis.summaryText && <CardDescription className="mb-3 prose prose-sm max-w-none" dangerouslySetInnerHTML={{__html: analysis.summaryText}} /> }

                                    {(chartType === 'bar' && chartDataForRender.labels.length > 0 && chartDataForRender.datasets[0].data.length > 0) || (chartType === 'pie' && pieDataForRender.length > 0) ? (
                                        <div className="my-6 h-[350px] md:h-[400px]">
                                            <ChartGSC
                                                data={chartDataForRender}
                                                pieData={pieDataForRender}
                                                type={chartType}
                                                title={`Top 5 ${itemDisplayName} per Clic`}
                                            />
                                        </div>
                                     ) : (
                                        <p className="text-muted-foreground text-center py-8">Nessun dato sufficiente per il grafico di {itemDisplayName}.</p>
                                     )}

                                    <h4 className="text-lg font-semibold text-foreground mt-6 mb-2">Tabella Dati {itemDisplayName} (Top 20 righe)</h4>
                                    <TableGSC data={analysis.detailedDataWithDiffs.slice(0,20)} itemDisplayName={itemDisplayName} />

                                    <div className="text-center mt-4">
                                        <Button onClick={() => handleDownloadSectionCSV(reportType)} variant="default" size="sm">
                                            <Download className="mr-2 h-4 w-4"/> Scarica Dati {itemDisplayName} (CSV)
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
      
  