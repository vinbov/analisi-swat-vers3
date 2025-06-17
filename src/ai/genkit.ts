
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
// import { openAI } from '@genkit-ai/openai'; // Temporaneamente rimosso a causa di problemi di installazione npm

export const ai = genkit({
  plugins: [
    googleAI(), 
    // openAI(), // Temporaneamente rimosso
  ],
  // È FONDAMENTALE che le variabili d'ambiente appropriate (OPENAI_API_KEY e/o GOOGLE_API_KEY) 
  // siano impostate (es. nel file .env o nell'ambiente server) affinché i plugin funzionino.
  // Per OpenAI (@genkit-ai/openai), se riattivato, il plugin cercherà OPENAI_API_KEY.
  // Per GoogleAI (Gemini), il plugin cercherà GOOGLE_API_KEY o GEMINI_API_KEY.
});

// Nota per l'utente:
// Il plugin OpenAI è stato temporaneamente rimosso a causa di problemi con `npm install`.
// Per riattivare la funzionalità di analisi angle con OpenAI nel Tool 3:
// 1. Risolvi i problemi del tuo ambiente npm che impediscono l'installazione di `@genkit-ai/openai`.
// 2. Aggiungi nuovamente "@genkit-ai/openai" (es. alla versione ^1.11.0) alle dipendenze in package.json.
// 3. Decommenta le righe relative a `openAI` in questo file.
// 4. Assicurati che la tua OPENAI_API_KEY sia impostata nel file .env o come variabile d'ambiente.

