'use server';

import {
  analyzeFacebookAdMarketingAngle,
  type AnalyzeFacebookAdMarketingAngleInput,
  type AnalyzeFacebookAdMarketingAngleOutput,
} from '@/ai/flows/analyze-facebook-ad-marketing-angle';

export async function analyzeAdAngleAction(
  input: AnalyzeFacebookAdMarketingAngleInput,
  apiKey: string // This key comes from the UI
): Promise<AnalyzeFacebookAdMarketingAngleOutput> {
  // The Genkit googleAI plugin will look for GEMINI_API_KEY or GOOGLE_API_KEY in process.env
  // if an API key was not provided at plugin initialization.
  // We temporarily set it here for the scope of this action.

  const originalEnvApiKey = process.env.GEMINI_API_KEY;
  let restoreNeeded = false;

  if (apiKey && typeof apiKey === 'string' && apiKey.trim() !== '') {
    process.env.GEMINI_API_KEY = apiKey;
    restoreNeeded = true;
  } else if (originalEnvApiKey === undefined && !process.env.GOOGLE_API_KEY) {
    // If no apiKey provided via parameter and no global one is set from other env sources.
    console.warn(
      'analyzeAdAngleAction: No API key provided via UI, and GEMINI_API_KEY/GOOGLE_API_KEY is not set in the environment.'
    );
  }

  try {
    const result = await analyzeFacebookAdMarketingAngle(input);
    return result;
  } catch (error: any) {
    console.error('Error in analyzeAdAngleAction:', error);
    // Augment the error message if it's a precondition failure and no key was visibly set.
    if (
      error.message?.includes('FAILED_PRECONDITION') &&
      (!apiKey || apiKey.trim() === '') && // No key from UI
      !originalEnvApiKey && // No key from GEMINI_API_KEY env before this action
      !process.env.GOOGLE_API_KEY // No key from GOOGLE_API_KEY env
    ) {
      throw new Error(
        `AI ad angle analysis failed: API key is missing. Please provide it in the input field or set GEMINI_API_KEY/GOOGLE_API_KEY environment variables. Original error: ${error.message}`
      );
    }
    throw new Error(`AI ad angle analysis failed: ${error.message}`);
  } finally {
    // Restore the original environment variable state
    if (restoreNeeded) {
      if (originalEnvApiKey !== undefined) {
        process.env.GEMINI_API_KEY = originalEnvApiKey;
      } else {
        // If it was not set before this action, delete it to avoid polluting the environment
        // for subsequent unrelated operations within the same process (if any).
        delete process.env.GEMINI_API_KEY;
      }
    }
  }
}
