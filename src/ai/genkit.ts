
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
// import { openAI } from '@genkit-ai/openai'; // Temporaneamente commentato a causa di problemi di npm install (E404)

export const ai = genkit({
  plugins: [
    googleAI(), 
    // openAI(), // TEMPORANEAMENTE DISABILITATO.
              // Decommentare questa riga e l'import sopra una volta risolti i problemi
              // con 'npm install @genkit-ai/openai'.
              // Assicurarsi che la variabile d'ambiente OPENAI_API_KEY sia impostata,
              // o che venga passata tramite UI al Tool 3 per l'analisi dell'angle.
  ],
  // È FONDAMENTALE che le variabili d'ambiente appropriate (OPENAI_API_KEY e/o GOOGLE_API_KEY) 
  // siano impostate (es. nel file .env o nell'ambiente server) affinché i plugin funzionino.
  // Per OpenAI (@genkit-ai/openai), il plugin cercherà OPENAI_API_KEY.
  // Per GoogleAI (Gemini), il plugin cercherà GOOGLE_API_KEY o GEMINI_API_KEY.
});
