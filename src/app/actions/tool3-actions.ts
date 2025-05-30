"use server";

import { analyzeFacebookAdMarketingAngle, type AnalyzeFacebookAdMarketingAngleInput, type AnalyzeFacebookAdMarketingAngleOutput } from '@/ai/flows/analyze-facebook-ad-marketing-angle';

// Genkit is configured globally in src/ai/genkit.ts and flows use that instance.
// The conditional reconfiguration block previously here was incorrect for Genkit v1.x and has been removed.

export async function analyzeAdAngleAction(
  input: AnalyzeFacebookAdMarketingAngleInput,
  apiKey: string // Client-provided API Key for OpenAI (or other models if used by flow)
): Promise<AnalyzeFacebookAdMarketingAngleOutput> {
  // Similar to Tool 2, Genkit flow should use its configured key from src/ai/genkit.ts.
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
