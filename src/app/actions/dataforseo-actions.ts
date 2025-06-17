
"use server";

import type { 
  KeywordIdeasLiveRequestParams, 
  DataForSEOLiveResponse,
  DataForSEOTaskPost,
  ProcessedDataForSEOMetrics
} from '@/lib/dataforseo/types';

interface FetchDataForSEOInput {
  keyword: string;
  apiLogin: string;
  apiPassword: string;
  locationCode?: number; // e.g., 2840 for US
  languageCode?: string; // e.g., "en"
}

const DFS_API_BASE_URL = "https://api.dataforseo.com/v3";

export async function fetchDataForSEOAction(
  input: FetchDataForSEOInput
): Promise<ProcessedDataForSEOMetrics> {
  const { keyword, apiLogin, apiPassword, locationCode = 2840, languageCode = "en" } = input;

  if (!apiLogin || !apiPassword) {
    return { dfs_error: "DataForSEO API Login and Password are required." };
  }
  if (!keyword) {
    return { dfs_error: "Keyword is required." };
  }

  const endpoint = `${DFS_API_BASE_URL}/keywords_data/google/keyword_ideas/live`;
  
  const requestPayload: DataForSEOTaskPost<KeywordIdeasLiveRequestParams>[] = [
    {
      keywords: [keyword],
      location_code: locationCode,
      language_code: languageCode,
      search_partners: false, // Example default, can be parameterized
    },
  ];

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Authorization": "Basic " + Buffer.from(apiLogin + ":" + apiPassword).toString("base64"),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestPayload),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("DataForSEO API Error Response:", errorBody);
      return { dfs_error: `DataForSEO API request failed: ${response.status} ${response.statusText}. Details: ${errorBody.substring(0, 200)}` };
    }

    const data = await response.json() as DataForSEOLiveResponse;

    if (data.tasks_error > 0 || !data.tasks || data.tasks.length === 0) {
      const taskError = data.tasks?.[0]?.status_message || "Unknown task error.";
      console.error("DataForSEO Task Error:", taskError, data);
      return { dfs_error: `DataForSEO task error: ${taskError}` };
    }

    const taskResult = data.tasks[0].result;
    if (!taskResult || taskResult.length === 0 || !taskResult[0].items || taskResult[0].items.length === 0) {
      return { dfs_error: "No metrics returned from DataForSEO for this keyword." };
    }
    
    // Assuming the first item in 'items' array contains the primary metrics for the keyword
    const metrics = taskResult[0].items[0];

    return {
      dfs_volume: metrics.search_volume,
      dfs_cpc: metrics.cpc,
      // DataForSEO 'keyword_difficulty' is typically 0-100, but the endpoint 'keyword_ideas' might not return it directly.
      // It's more common in 'keywords_data.google.adwords.search_volume' or 'keywords_data.google.keywords_for_keywords.live'
      // For 'keyword_ideas', you might get 'competition_level' or similar instead, or just volume/CPC.
      // Adjust this based on the actual response structure of 'keyword_ideas/live'.
      // For now, I'll leave it as potentially null.
      dfs_keyword_difficulty: metrics.keyword_difficulty ?? null, 
    };

  } catch (error: any) {
    console.error("Error calling DataForSEO API:", error);
    return { dfs_error: `Failed to fetch data from DataForSEO: ${error.message}` };
  }
}
