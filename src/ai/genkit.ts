
import { config } from 'dotenv';
config();

import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
// import { openAI } from '@genkit-ai/openai'; // Commentato a causa di errore installazione

export const ai = genkit({
  plugins: [
    googleAI(),
    // openAI(), // Commentato a causa di errore installazione
  ],
  // È FONDAMENTALE che le variabili d'ambiente appropriate (GOOGLE_API_KEY e/o OPENAI_API_KEY)
  // siano impostate (es. nel file .env o nell'ambiente server) aff
