
import { genkit } from 'genkit';
// import {openai} from '@genkit-ai/openai'; // Import and enable OpenAI

import {googleAI} from '@genkit-ai/googleai'; // Using GoogleAI as a fallback due to OpenAI plugin install issues

export const ai = genkit({
  plugins: [
    // openai(), // Temporarily disabled due to installation issues for @genkit-ai/openai
    googleAI() // Using GoogleAI plugin as a fallback. Ensure GOOGLE_API_KEY is in .env
  ],
  // model: 'gemini-pro', // You can set a default GoogleAI model here if you wish
  // Se in futuro si volessero usare sia GoogleAI che OpenAI per flow diversi,
  // sarà necessario specificare il modello desiderato in ogni flow/prompt.
});

