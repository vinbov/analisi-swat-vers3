
// Inspired by DataForSEO API documentation and mcp-server-typescript repository

export interface DataForSEORequestParams {
  language_name?: string; // Full language name e.g., "English"
  language_code?: string; // Language code e.g., "en"
  location_name?: string; // Full location name e.g., "United States"
  location_code?: number; // Location code e.g., 2840 for United States
  keywords?: string[];
  // Add other common parameters as needed, e.g.,
  search_partners?: boolean;
  // sort_by?: string;
  // limit?: number;
  // offset?: number;
  // date_from?: string; // YYYY-MM-DD
  // date_to?: string; // YYYY-MM-DD
}

// This is a generic structure for a single task in a POST request array
export interface DataForSEOTaskPost<T extends DataForSEORequestParams> {
  [key: string]: T[keyof T]; // Allows for dynamic parameters based on T
}

// Example specific structure for Keyword Ideas Live
export interface KeywordIdeasLiveRequestParams extends DataForSEORequestParams {
  keywords: string[];
  search_partners?: boolean;
}

// Simplified response structure for what we might extract
// The actual DataForSEO response is much more complex.
export interface DataForSEOKeywordMetrics {
  keyword?: string;
  location_code?: number;
  language_code?: string;
  search_volume?: number | null;
  cpc?: number | null;
  keyword_difficulty?: number | null;
  // Add other metrics as needed:
  competition?: number | null; // 0-1 scale
  // monthly_searches?: Array<{ year: number, month: number, search_volume: number }>;
  categories?: number[] | null;
  average_bid?: number | null;
}

export interface DataForSEOTaskResult {
  keyword?: string;
  items?: DataForSEOKeywordMetrics[]; // Usually an array of results per task
  total_count?: number;
  items_count?: number;
}

export interface DataForSEOLiveResponse {
  tasks_error: number;
  tasks_count: number;
  tasks: Array<{
    id: string;
    status_code: number;
    status_message: string;
    cost: number;
    result_count: number;
    path: string[];
    data: Record<string, any>; // The actual data specific to the API endpoint
    result: DataForSEOTaskResult[] | null; // Typed more specifically
  }>;
}

// Simplified structure for the output of our server action for Tool 2 (single keyword focus)
export interface ProcessedDataForSEOMetrics {
  dfs_volume?: number | null;
  dfs_cpc?: number | null;
  dfs_keyword_difficulty?: number | null;
  dfs_error?: string | null;
}
