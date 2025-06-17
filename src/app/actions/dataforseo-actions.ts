
"use server";

import type { 
  KeywordIdeasLiveRequestParams, 
  DataForSEOLiveResponse,
  DataForSEOTaskPost,
  DataForSEOKeywordMetrics // Changed from ProcessedDataForSEOMetrics
} from '@/lib/dataforseo/types';

interface FetchDataForSEOInput {
  keywords: string[]; // Changed to array to support multiple seed keywords for the new tool
  apiLogin: string;
  apiPassword: string;
  locationCode?: number; // e.g., 2840 for US
  languageCode?: string; // e.g., "en"
  searchPartners?: boolean;
}

const DFS_API_BASE_URL = "https://api.dataforseo.com/v3";

// This action now returns an array of keyword metrics or an error object
export async function fetchDataForSEOKeywordIdeasAction(
  input: FetchDataForSEOInput
): Promise<DataForSEOKeywordMetrics[] | { dfs_error: string }> {
  const { keywords, apiLogin, apiPassword, locationCode = 2840, languageCode = "en", searchPartners = false } = input;

  if (!apiLogin || !apiPassword) {
    return { dfs_error: "DataForSEO API Login and Password are required." };
  }
  if (!keywords || keywords.length === 0) {
    return { dfs_error: "At least one keyword is required." };
  }

  const endpoint = `${DFS_API_BASE_URL}/keywords_data/google/keyword_ideas/live`;
  
  const requestPayload: DataForSEOTaskPost<KeywordIdeasLiveRequestParams>[] = [
    {
      keywords: keywords,
      location_code: locationCode,
      language_code: languageCode,
      search_partners: searchPartners,
      // limit: 100, // Example: can be parameterized for the new tool
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

    if (data.tasks_error > 0 || !data.tasks || data.tasks.length === 0 || data.tasks[0].status_code !== 20000) {
      const taskError = data.tasks?.[0]?.status_message || "Unknown task error.";
      console.error("DataForSEO Task Error:", taskError, data);
      return { dfs_error: `DataForSEO task error: ${taskError}` };
    }

    const taskResult = data.tasks[0].result;
    if (!taskResult || taskResult.length === 0 || !taskResult[0].items) {
      return { dfs_error: "No metrics or keyword ideas returned from DataForSEO for these keywords." };
    }
    
    // taskResult[0].items is an array of DataForSEOKeywordMetrics
    return taskResult[0].items;

  } catch (error: any) {
    console.error("Error calling DataForSEO API:", error);
    return { dfs_error: `Failed to fetch data from DataForSEO: ${error.message}` };
  }
}
