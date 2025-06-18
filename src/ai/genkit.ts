
import { config } from 'dotenv';
config();

import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
// import { openAI } from '@genkit-ai/openai'; // Commentato a causa di problemi di installazione pacchetto

export const ai = genkit({
  plugins: [
    googleAI(),
    // openAI(), // Commentato a causa di problemi di installazione pacchetto
              // Per riattivare:
              // 1. Risolvi i problemi nel tuo ambiente npm che impediscono l'installazione di `@genkit-ai/openai`.
              //    Potrebbe essere necessario verificare il nome corretto del pacchetto e la versione disponibile su npmjs.org.
              // 2. Esegui `npm install @genkit-ai/openai` (o il comando corretto).
              // 3. Decommenta questa riga e l'importazione sopra.
              // 4. Assicurati che la variabile d'ambiente OPENAI_API_KEY sia impostata o fornita tramite UI nel Tool 3.
  ],
  // È FONDAMENTALE che le variabili d'ambiente appropriate (GOOGLE_API_KEY e/o OPENAI_API_KEY)
  // siano impostate (es. nel file .env o nell'