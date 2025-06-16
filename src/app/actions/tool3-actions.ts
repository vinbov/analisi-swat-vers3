
'use server';

import {
  analyzeFacebookAdMarketingAngle,
  type AnalyzeFacebookAdMarketingAngleInput,
  type AnalyzeFacebookAdMarketingAngleOutput,
} from '@/ai/flows/analyze-facebook-ad-marketing-angle';

export async function analyzeAdAngleAction(
  input: AnalyzeFacebookAdMarketingAngleInput,
  apiKey: string // Questa chiave API proviene dall'UI, attesa come chiave Google API
): Promise<AnalyzeFacebookAdMarketingAngleOutput> {
  // Il plugin Genkit googleAI cercherà GOOGLE_API_KEY (o GEMINI_API_KEY) in process.env
  // se una chiave API non è stata fornita all'inizializzazione del plugin.
  // La impostiamo temporaneamente qui per lo scope di questa action,
  // dando priorità alla chiave fornita dall'utente tramite UI.

  const originalEnvGoogleApiKey = process.env.GOOGLE_API_KEY;
  const originalEnvGeminiApiKey = process.env.GEMINI_API_KEY;
  let restoreGoogleNeeded = false;
  let restoreGeminiNeeded = false;

  if (apiKey && typeof apiKey === 'string' && apiKey.trim() !== '') {
    // Genkit's Google AI plugin might look for either GOOGLE_API_KEY or GEMINI_API_KEY.
    // We set both to be safe, prioritizing the one already set if available.
    if (originalEnvGeminiApiKey) {
        process.env.GEMINI_API_KEY = apiKey;
        restoreGeminiNeeded = true;
    } else {
        process.env.GOOGLE_API_KEY = apiKey;
        restoreGoogleNeeded = true;
    }
    console.log('analyzeAdAngleAction: GOOGLE_API_KEY/GEMINI_API_KEY impostata temporaneamente dall\'input UI.');
  } else if (originalEnvGoogleApiKey || originalEnvGeminiApiKey) {
    console.log('analyzeAdAngleAction: GOOGLE_API_KEY/GEMINI_API_KEY utilizzata dalle variabili d\'ambiente globali.');
  } else {
    console.warn(
      'analyzeAdAngleAction: Nessuna Google API Key fornita tramite UI, e GOOGLE_API_KEY/GEMINI_API_KEY non è impostata nell\'ambiente.'
    );
  }

  try {
    // Il flow 'analyzeFacebookAdMarketingAngle' specifica già `model: 'googleai/gemini-1.5-flash-latest'`
    const result = await analyzeFacebookAdMarketingAngle(input);
    return result;
  } catch (error: any) {
    console.error('Errore in analyzeAdAngleAction (Google AI):', error);
    let errorMessage = `AI ad angle analysis with Google AI failed: ${error.message}`;
    if (
      (error.message?.includes('API key') || error.message?.includes('credential')) &&
      (!apiKey || apiKey.trim() === '') && 
      !originalEnvGoogleApiKey && !originalEnvGeminiApiKey
    ) {
      errorMessage = `AI ad angle analysis with Google AI failed: La Google API Key è mancante. Forniscila nel campo di input o imposta la variabile d'ambiente GOOGLE_API_KEY/GEMINI_API_KEY. Errore originale: ${error.message}`;
    } else if (error.message?.includes('model_not_found') && error.message?.includes('gemini')) {
      errorMessage = `AI ad angle analysis with Google AI failed: Il modello specificato (es. gemini-1.5-flash-latest) potrebbe non essere disponibile con la tua API Key Google o il plugin Google AI non è configurato correttamente. Errore originale: ${error.message}`;
    }
    throw new Error(errorMessage);
  } finally {
    if (restoreGoogleNeeded) {
      if (originalEnvGoogleApiKey !== undefined) {
        process.env.GOOGLE_API_KEY = originalEnvGoogleApiKey;
      } else {
        delete process.env.GOOGLE_API_KEY;
      }
      console.log('analyzeAdAngleAction: GOOGLE_API_KEY ripristinata/rimossa.');
    }
    if (restoreGeminiNeeded) {
        if (originalEnvGeminiApiKey !== undefined) {
            process.env.GEMINI_API_KEY = originalEnvGeminiApiKey;
        } else {
            delete process.env.GEMINI_API_KEY;
        }
        console.log('analyzeAdAngleAction: GEMINI_API_KEY ripristinata/rimossa.');
    }
  }
}
