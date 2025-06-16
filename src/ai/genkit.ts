
import { genkit } from 'genkit';
// import { googleAI } from '@genkit-ai/googleai'; // Rimosso import GoogleAI
import { openAI } from '@genkit-ai/openai'; 

export const ai = genkit({
  plugins: [
    // googleAI(), // Rimosso plugin GoogleAI
    openAI(),   // Abilitato plugin OpenAI
  ],
  // È FONDAMENTALE che le variabili d'ambiente appropriate (OPENAI_API_KEY) 
  // siano impostate (es. nel file .env o nell'ambiente server) affinché i plugin funzionino.
  // Per OpenAI, il plugin cercherà OPENAI_API_KEY.
  // Il plugin GoogleAI è stato rimosso da questa configurazione.
});

// Nota per l'utente:
// Per far funzionare il plugin OpenAI, assicurati di:
// 1. Aver aggiunto "@genkit-ai/openai" alle dipendenze (ORA PRESENTE).
// 2. Impostare la tua OPENAI_API_KEY nel file .env o come variabile d'ambiente del server,
//    oppure fornirla direttamente nell'interfaccia del Tool 3.
//
// Il plugin Google AI è stato rimosso da questa configurazione.
// Se hai ancora il plugin @genkit-ai/googleai nelle dipendenze del package.json e non lo usi,
// puoi considerare di rimuoverlo per pulizia.
