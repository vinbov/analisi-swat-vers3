
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
// import { openAI } from '@genkit-ai/openai'; // Temporaneamente commentato a causa di problemi di installazione persistenti (E404 per @genkit-ai/openai).

export const ai = genkit({
  plugins: [
    googleAI(),
    // openAI(), // Temporaneamente commentato.
              // Per riattivare:
              // 1. Risolvi i problemi nel tuo ambiente npm che impediscono l'installazione di `@genkit-ai/openai`.
              // 2. Esegui `npm install @genkit-ai/openai`.
              // 3. Decommenta questa riga e l'importazione sopra.
              // 4. Assicurati che la variabile d'ambiente OPENAI_API_KEY sia impostata o fornita tramite UI nel Tool 3.
  ],
  // È FONDAMENTALE che le variabili d'ambiente appropriate (GOOGLE_API_KEY e/o OPENAI_API_KEY)
  // siano impostate (es. nel file .env o nell'ambiente server) affinché i plugin funzionino.
});
