
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
// import { openAI } from '@genkit-ai/openai'; // Temporaneamente commentato a causa di errori E404 persistenti durante npm install.

export const ai = genkit({
  plugins: [
    googleAI(), 
    // openAI(), // Temporaneamente commentato.
              // Per riattivare:
              // 1. Assicurati che il tuo ambiente npm possa installare '@genkit-ai/openai'.
              //    Potrebbe essere necessario pulire la cache npm (`npm cache clean --force`) o verificare la configurazione del registro npm.
              // 2. Aggiungi `"@genkit-ai/openai": "^1.11.0"` (o la versione più recente) a package.json.
              // 3. Decommenta l'import e questa riga.
              // 4. Assicurati che OPENAI_API_KEY sia impostata nel file .env o fornita tramite UI.
  ],
  // È FONDAMENTALE che le variabili d'ambiente appropriate (OPENAI_API_KEY e/o GOOGLE_API_KEY) 
  // siano impostate (es. nel file .env o nell'ambiente server) affinché i plugin funzionino.
  // Per OpenAI (@genkit-ai/openai), il plugin cercherà OPENAI_API_KEY.
  // Per GoogleAI (Gemini), il plugin cercherà GOOGLE_API_KEY o GEMINI_API_KEY.
});
