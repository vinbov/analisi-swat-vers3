
import { config } from 'dotenv';
config();

import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
// import { openAI } from '@genkit-ai/openai'; // Temporarily commented out due to installation issues

export const ai = genkit({
  plugins: [
    googleAI(),
    // openAI(), // Temporarily commented out
  ],
  // È FONDAMENTALE che le variabili d'ambiente appropriate (GOOGLE_API_KEY e/o OPENAI_API_KEY)
  // siano impostate (es. nel file .env o nell'ambiente server) aff
]);
