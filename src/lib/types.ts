
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

// For detail pages
export type DetailPageSection = 
  | 'distribution' 
  | 'commonTop10' 
  | 'topOpportunities' 
  | 'commonKeywordsSectionTool1' 
  | 'mySiteOnlyKeywordsSectionTool1' 
  | 'competitorOnlyKeywordsSectionTool1'
  | 'angleAnalysisDetail';

export type ChartConfig = any; // From recharts/Chart.js

export interface DetailPageDataTool1 {
  pageTitle: string;
  description: string;
  chartConfig?: ChartConfig;
  tableData?: ComparisonResult[];
  tableHeaders?: string[];
  tableType?: 'common' | 'mySiteOnly' | 'competitorOnly';
  activeCompetitorNames?: string[];
  additionalContent?: string; // For things like top 10 lists
}

export interface DetailPageDataTool3 {
  pageTitle: string;
  descriptionHTML: string; // Can contain HTML for 7C framework description
  chartConfig?: ChartConfig;
  tableData: AdWithAngleAnalysis[];
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
