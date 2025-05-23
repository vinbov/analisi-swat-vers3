"use server";

import { analyzeFacebookAdMarketingAngle, type AnalyzeFacebookAdMarketingAngleInput, type AnalyzeFacebookAdMarketingAngleOutput } from '@/ai/flows/analyze-facebook-ad-marketing-angle';
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


export async function analyzeAdAngleAction(
  input: AnalyzeFacebookAdMarketingAngleInput,
  apiKey: string // Client-provided API Key for OpenAI
): Promise<AnalyzeFacebookAdMarketingAngleOutput> {
  // Similar to Tool 2, Genkit flow should use its configured key.
  // The client-provided apiKey is available if the Genkit flow was designed to accept it directly,
  // or if we needed to make a direct OpenAI call outside Genkit.
  // For now, assuming the Genkit flow is self-contained regarding its API key.

  try {
    const result = await analyzeFacebookAdMarketingAngle(input);
    return result;
  } catch (error: any) {
    console.error("Error in analyzeAdAngleAction:", error);
    throw new Error(`AI ad angle analysis failed: ${error.message}`);
  }
}
