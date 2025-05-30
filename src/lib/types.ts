

// Tool 1: Keyword Comparator
export interface CsvRowTool1 {
  keyword: string;
  posizione: number | null;
  url: string;
  volume: number | null;
  difficolta: number | null;
  opportunity: number | null;
  intento: string;
  // Optional columns from original HTML that might not be strictly used in core logic
  varTraffico?: string;
  trafficoStimato?: string;
  cpcMedio?: string;
}

export interface CompetitorEntry {
  name: string;
  pos: number | string | null; // Can be 'N/P'
  url: string;
}

export interface ComparisonResult {
  keyword: string;
  mySiteInfo: { pos: number | string | null; url: string };
  competitorInfo: CompetitorEntry[];
  volume: number | string | null;
  difficolta: number | string | null;
  opportunity: number | string | null;
  intento: string;
  status: 'common' | 'mySiteOnly' | 'competitorOnly';
}

// Tool 2: Keyword Pertinence & Priority Analyzer
export interface CsvRowTool2 {
  keyword: string;
  volume: number | string; // Can be "N/A"
  difficolta: number | string; // Can be "N/A"
  opportunity: number | string; // Can be "N/A"
  posizione: number | string; // Can be "N/A"
  url: string;
  intento: string;
}

export interface PertinenceAnalysisResult {
  keyword: string;
  settore: string;
  pertinenza: string;
  prioritaSEO: string;
  motivazioneSEO: string;
}

// Tool 3: Facebook Ads Library Scraper
export interface ApifyRawAdItem {
  // Define based on expected structure from Apify actor 'curious_coder~facebook-ads-library-scraper'
  // This can be complex, for now let's assume a simplified processed structure.
  // Based on original JS, it looks for snapshot.cards or snapshot directly
  snapshot?: {
    cards?: Array<{
      body?: string;
      title?: string;
      link_url?: string;
      resized_image_url?: string;
      original_image_url?: string;
    }>;
    body?: { text?: string };
    title?: string;
    page_name?: string;
    link_url?: string;
    page_profile_uri?: string;
    videos?: Array<{ video_preview_image_url?: string }>;
    images?: Array<{ url?: string }>;
    page_profile_picture_url?: string;
  };
  url?: string; // Fallback URL
  // Other fields from Apify...
  [key: string]: any;
}

export interface ScrapedAd {
  id: string; // Add an ID for keying in React lists
  testo: string;
  titolo: string;
  link: string;
  immagine: string;
}

export interface AngleAnalysisScores {
  C1: number; // Chiarezza
  C2: number; // Coinvolgimento
  C3: number; // Concretezza
  C4: number; // Coerenza
  C5: number; // Credibilità
  C6: number; // CTA
  C7: number; // Contesto
}

export interface AngleAnalysis {
  scores: AngleAnalysisScores;
  totalScore: number;
  evaluation: string;
  detailedAnalysis: string;
  error?: string; // In case of parsing or AI error
  raw?: string; // Raw AI response if parsing fails
}

export interface AdWithAngleAnalysis extends ScrapedAd {
  angleAnalysis?: AngleAnalysis;
  analysisError?: string;
}

// Tool 4: GSC Analyzer
export type GscReportType = 'queries' | 'pages' | 'countries' | 'devices' | 'searchAppearance' | 'filters';

export interface GscSheetRow {
  item?: string; // Represents Query, Page, Country, Device, Search Appearance string
  clicks_current?: number;
  clicks_previous?: number;
  impressions_current?: number;
  impressions_previous?: number;
  ctr_current?: number;
  ctr_previous?: number;
  position_current?: number | null;
  position_previous?: number | null;
  // For filters sheet
  filterName?: string;
  filterValue?: string;
  // Allow any other property from XLSX
  [key: string]: any;
}

export interface GscAnalyzedItem {
  item: string;
  clicks_current: number;
  clicks_previous: number;
  diff_clicks: number;
  perc_change_clicks: number; // as fraction, format as % in UI
  impressions_current: number;
  impressions_previous: number;
  diff_impressions: number;
  perc_change_impressions: number; // as fraction
  ctr_current: number;
  ctr_previous: number;
  diff_ctr: number; // absolute diff
  position_current: number | null;
  position_previous: number | null;
  diff_position: number | null; // note: higher previous position is "better" so diff is prev - curr
}

export interface GscSectionAnalysis {
  summaryText: string;
  detailedDataWithDiffs: GscAnalyzedItem[];
  topItemsByClicksChartData: { 
    labels: string[]; 
    datasets: Array<{
        label: string;
        data: number[];
        backgroundColor?: string | string[];
        borderColor?: string | string[];
        borderWidth?: number;
        fill?: string; // for recharts Bar
    }>;
  };
   // For PieChart (e.g., devices)
  pieChartData?: Array<{ name: string; value: number; fill: string }>;
}


export interface GscParsedData {
  queries?: GscSheetRow[];
  pages?: GscSheetRow[];
  countries?: GscSheetRow[];
  devices?: GscSheetRow[];
  searchAppearance?: GscSheetRow[];
  filters?: GscSheetRow[];
}

export interface GscAnalyzedData {
  queries?: GscSectionAnalysis;
  pages?: GscSectionAnalysis;
  countries?: GscSectionAnalysis;
  devices?: GscSectionAnalysis;
  searchAppearance?: GscSectionAnalysis;
}


// For detail pages
export type DetailPageSection = 
  | 'distribution' 
  | 'commonTop10' 
  | 'topOpportunities' 
  | 'commonKeywordsSectionTool1' 
  | 'mySiteOnlyKeywordsSectionTool1' 
  | 'competitorOnlyKeywordsSectionTool1'
  | 'angleAnalysisDetail'
  | GscReportType; // Adding GSC report types as detail page sections


export type ChartConfig = any; // From recharts/Chart.js

export interface DetailPageDataTool1 {
  pageTitle: string;
  description: string;
  chartConfig?: ChartConfig; // Should be recharts compatible structure
  tableData?: ComparisonResult[];
  tableHeaders?: string[];
  tableType?: 'common' | 'mySiteOnly' | 'competitorOnly';
  activeCompetitorNames?: string[];
  additionalContent?: string; // For things like top 10 lists
}

export interface DetailPageDataTool3 {
  pageTitle: string;
  descriptionHTML: string; // Can contain HTML for 7C framework description
  chartConfig?: ChartConfig; // Should be recharts compatible
  tableData: AdWithAngleAnalysis[];
}

export interface DetailPageDataTool4 {
  pageTitle: string;
  description: string;
  analyzedData: GscSectionAnalysis | null;
  itemDisplayName: string; 
  reportType: GscReportType;
  chartType?: 'bar' | 'pie';
}


// CSV Column mapping
export const EXPECTED_COLUMNS_TOOL1: Record<keyof CsvRowTool1, string> = { 
  keyword: 'Keyword', posizione: 'Pos', url: 'URL', volume: 'Volume',
  difficolta: 'Keyword Difficulty', opportunity: 'Keyword Opportunity', intento: 'Intent',
  varTraffico: 'var. traffico', trafficoStimato: 'traffico stimato', cpcMedio: 'cpc medio'
};

export const COLUMN_ALIASES_TOOL1: Record<keyof Partial<CsvRowTool1>, string[]> = { 
  difficolta: ['keyword difficulty', 'key diff'], 
  opportunity: ['keyword opportunity'], 
  posizione: ['pos']
};

export const EXPECTED_COLUMNS_TOOL2: Record<keyof CsvRowTool2, string> = { 
  keyword: 'Keyword', posizione: 'Pos', url: 'URL', volume: 'Volume',
  difficolta: 'Keyword Difficulty', opportunity: 'Keyword Opportunity', intento: 'Intent'
};
export const COLUMN_ALIASES_TOOL2 = COLUMN_ALIASES_TOOL1; // Same aliases

