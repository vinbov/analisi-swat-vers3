"use server";

import { analyzeKeywordPertinenceAndPriority, type AnalyzeKeywordPertinenceAndPriorityInput, type AnalyzeKeywordPertinenceAndPriorityOutput } from '@/ai/flows/analyze-keyword-pertinence-and-priority';
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

// This is a simplified re-initialization for server actions.
// In a real setup, you'd ensure Genkit is configured globally.
if (!genkit.config().plugins?.find(p => p.name === 'googleAI')) {
  genkit.configure({
    plugins: [
      googleAI({ apiKey: process.env.GEMINI_API_KEY }), // Ensure API key is available
    ],
    logLevel: 'debug',
    enableTracingAndMetrics: true,
  });
}


export async function analyzeKeywordAction(
  input: AnalyzeKeywordPertinenceAndPriorityInput,
  apiKey: string // The API key is passed from client, Genkit flow should use its configured key
): Promise<AnalyzeKeywordPertinenceAndPriorityOutput> {
  // Note: The apiKey passed from the client is for client-side calls if any were made directly.
  // The Genkit flow `analyzeKeywordPertinenceAndPriority` itself should be configured
  // to use an API key from its environment (e.g., process.env.GEMINI_API_KEY for GoogleAI).
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
