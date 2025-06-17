
"use server";

import type { 
  KeywordIdeasLiveRequestParams, 
  DataForSEOLiveResponse,
  DataForSEOTaskPost,
  DataForSEOKeywordMetrics
} from '@/lib/dataforseo/types';

interface FetchDataForSEOInput {
  keywords: string[];
  apiLogin: string;
  apiPassword: string;
  locationCode?: number;
  languageCode?: string;
  searchPartners?: boolean;
}

const DFS_API_BASE_URL = "https://api.dataforseo.com/v3";

export async function fetchDataForSEOKeywordIdeasAction(
  input: FetchDataForSEOInput
): Promise<DataForSEOKeywordMetrics[] | { dfs_error: string }> {
  const { keywords, apiLogin, apiPassword, locationCode, languageCode, searchPartners = false } = input;

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
      location_code: locationCode, // Will be undefined if not provided, DFS uses defaults
      language_code: languageCode, // Will be undefined if not provided, DFS uses defaults
      search_partners: searchPartners,
      // limit: 100, // Example: can be parameterized
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
      let errorBodyText = "Could not parse error response from DataForSEO.";
      try {
        errorBodyText = await response.text();
      } catch (e) {
        // Ignore if reading text fails, errorBodyText will retain its default.
      }
      
      let specificMessage = `DataForSEO API request failed: ${response.status} ${response.statusText}. Details: ${errorBodyText.substring(0, 250)}`;
      
      if (response.status === 404) {
        try {
          // Attempt to parse the JSON even for the more specific message
          const errorJson = JSON.parse(errorBodyText);
          if (errorJson.status_code === 40400) { // DataForSEO specific "Not Found"
            specificMessage = `DataForSEO API request failed (40400): The endpoint '${endpoint}' was not found. This might indicate that your DataForSEO subscription plan does not include access to this 'live' endpoint, or the endpoint path is incorrect. Please verify your subscription and the endpoint. Original error: ${errorBodyText.substring(0, 200)}`;
          }
        } catch (e) { 
          // If JSON parsing fails, use the already constructed specificMessage which includes the raw text
        }
      }
      console.error("DataForSEO API Error Response:", errorBodyText);
      return { dfs_error: specificMessage };
    }

    const data = await response.json() as DataForSEOLiveResponse;

    if (data.tasks_error > 0 || !data.tasks || data.tasks.length === 0 || data.tasks[0].status_code !== 20000) {
      const taskError = data.tasks?.[0]?.status_message || "Unknown task error from DataForSEO.";
      console.error("DataForSEO Task Error:", taskError, data);
      return { dfs_error: `DataForSEO task error: ${taskError}` };
    }

    const taskResult = data.tasks[0].result;
    if (!taskResult || taskResult.length === 0 || !taskResult[0].items) {
      // It's possible to get a 20000 status but no items if the keyword yields no results
      // This should be handled by the component, returning an empty array is valid here.
      return []; 
    }
    
    return taskResult[0].items;

  } catch (error: any) {
    console.error("Error calling DataForSEO API:", error);
    return { dfs_error: `Failed to fetch data from DataForSEO: ${error.message}` };
  }
}
