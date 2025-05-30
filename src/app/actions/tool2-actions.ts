"use server";

import { analyzeKeywordPertinenceAndPriority, type AnalyzeKeywordPertinenceAndPriorityInput, type AnalyzeKeywordPertinenceAndPriorityOutput } from '@/ai/flows/analyze-keyword-pertinence-and-priority';

// Genkit is configured globally in src/ai/genkit.ts and flows use that instance.
// The conditional reconfiguration block previously here was incorrect for Genkit v1.x and has been removed.

export async function analyzeKeywordAction(
  input: AnalyzeKeywordPertinenceAndPriorityInput,
  apiKey: string // The API key is passed from client, Genkit flow should use its configured key
): Promise<AnalyzeKeywordPertinenceAndPriorityOutput> {
  // Note: The apiKey passed from the client is for client-side calls if any were made directly.
  // The Genkit flow `analyzeKeywordPertinenceAndPriority` itself should be configured
  // to use an API key from its environment (e.g., process.env.GEMINI_API_KEY for GoogleAI via the googleAI() plugin).
  // We are not directly using the client-provided apiKey here for the Genkit flow,
  // as Genkit handles its own auth. This parameter might be for future use or if the flow needed it.

  try {
    const result = await analyzeKeywordPertinenceAndPriority(input);
    return result;
  } catch (error: any) {
    console.error("Error in analyzeKeywordAction:", error);
    // Rethrow or return a structured error
    throw new Error(`AI analysis failed: ${error.message}`);
  }
}
