'use server';

import {
  analyzeFacebookAdMarketingAngle,
  type AnalyzeFacebookAdMarketingAngleInput,
  type AnalyzeFacebookAdMarketingAngleOutput,
} from '@/ai/flows/analyze-facebook-ad-marketing-angle';

export async function analyzeAdAngleAction(
  input: AnalyzeFacebookAdMarketingAngleInput,
  apiKey: string // Questa chiave API proviene dall'UI, attesa come chiave OpenAI
): Promise<AnalyzeFacebookAdMarketingAngleOutput> {
  // Il plugin Genkit openai cercherà OPENAI_API_KEY in process.env
  // se una chiave API non è stata fornita all'inizializzazione del plugin.
  // La impostiamo temporaneamente qui per lo scope di questa action.

  const originalEnvApiKey = process.env.OPENAI_API_KEY;
  let restoreNeeded = false;

  if (apiKey && typeof apiKey === 'string' && apiKey.trim() !== '') {
    process.env.OPENAI_API_KEY = apiKey;
    restoreNeeded = true;
  } else if (originalEnvApiKey === undefined) {
    // Se nessuna chiave API è fornita tramite parametro e nessuna globale è impostata.
    console.warn(
      'analyzeAdAngleAction: Nessuna chiave API OpenAI fornita tramite UI, e OPENAI_API_KEY non è impostata nell\'ambiente.'
    );
  }

  try {
    // Nota: il flow userà il modello predefinito configurato in genkit.ts (ora openai/gpt-4o)
    // o un modello specificato nel flow stesso se diverso.
    const result = await analyzeFacebookAdMarketingAngle(input);
    return result;
  } catch (error: any) {
    console.error('Errore in analyzeAdAngleAction:', error);
    // Aumenta il messaggio di errore se è relativo alla chiave API e nessuna chiave era visibilmente impostata.
    if (
      (error.message?.includes('authentication') || error.message?.includes('API key') || error.message?.includes('credential')) &&
      (!apiKey || apiKey.trim() === '') && // Nessuna chiave dall'UI
      !originalEnvApiKey // Nessuna chiave da OPENAI_API_KEY env prima di questa action
    ) {
      throw new Error(
        `AI ad angle analysis failed: La chiave API OpenAI è mancante. Forniscila nel campo di input o imposta la variabile d'ambiente OPENAI_API_KEY. Errore originale: ${error.message}`
      );
    }
    throw new Error(`AI ad angle analysis failed: ${error.message}`);
  } finally {
    // Ripristina lo stato originale della variabile d'ambiente
    if (restoreNeeded) {
      if (originalEnvApiKey !== undefined) {
        process.env.OPENAI_API_KEY = originalEnvApiKey;
      } else {
        delete process.env.OPENAI_API_KEY;
      }
    }
  }
}
