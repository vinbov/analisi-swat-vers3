"use server";

import { analyzeFacebookAdMarketingAngle, type AnalyzeFacebookAdMarketingAngleInput, type AnalyzeFacebookAdMarketingAngleOutput } from '@/ai/flows/analyze-facebook-ad-marketing-angle';

export async function analyzeAdAngleAction(
  input: AnalyzeFacebookAdMarketingAngleInput,
  apiKey: string 
): Promise<AnalyzeFacebookAdMarketingAngleOutput> {
  
  try {
    const result = await analyzeFacebookAdMarketingAngle(input);
    return result;
  } catch (error: any) {
    console.error("Error in analyzeAdAngleAction:", error);
    throw new Error(`AI ad angle analysis failed: ${error.message}`);
  }
}
