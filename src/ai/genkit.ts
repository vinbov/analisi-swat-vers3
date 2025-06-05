import {genkit} from 'genkit';
// import {openai} from '@genkit-ai/openai'; // Temporaneamente commentato a causa di problemi di installazione
// import {googleAI} from '@genkit-ai/googleai'; // Assicurarsi che questo sia rimosso o commentato se non si usa Gemini

export const ai = genkit({
  plugins: [
    // openai(), // Temporaneamente commentato
    // googleAI() 
  ],
  // model: 'openai/gpt-4o', // Temporaneamente commentato - Il modello predefinito dipende dai plugin attivi
  // Se in futuro si volessero usare sia GoogleAI che OpenAI per flow diversi,
  // sarà necessario specificare il modello desiderato in ogni flow/prompt.
  // Altrimenti, si può rimuovere completamente il plugin googleAI() e riferimenti a modelli Gemini.
});
