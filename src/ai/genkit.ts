
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [
    googleAI(),
  ],
  // È FONDAMENTALE che la variabile d'ambiente GOOGLE_API_KEY (o GEMINI_API_KEY) sia impostata
  // (es. nel file .env o nell'ambiente server) affinché il plugin googleAI() funzioni.
});

// Nota per l'utente:
// Per far funzionare il plugin Google AI, assicurati di:
// 1. Aver aggiunto "@genkit-ai/googleai" alle dipendenze nel tuo package.json (GIÀ PRESENTE).
// 2. Eseguire 'npm install' (o il comando del tuo package manager) - questo dovrebbe avvenire automaticamente.
// 3. Impostare la tua GOOGLE_API_KEY (o GEMINI_API_KEY) nel file .env o come variabile d'ambiente del server.
//    Esempio: GOOGLE_API_KEY=AIzaSy...
//    o GEMINI_API_KEY=AIzaSy...
