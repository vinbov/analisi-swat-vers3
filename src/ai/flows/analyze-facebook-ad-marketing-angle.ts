// 'use server'

/**
 * @fileOverview A Facebook Ad marketing angle analyzer flow.
 *
 * - analyzeFacebookAdMarketingAngle - A function that handles the Facebook Ad marketing angle analysis process.
 * - AnalyzeFacebookAdMarketingAngleInput - The input type for the analyzeFacebookAdMarketingAngle function.
 * - AnalyzeFacebookAdMarketingAngleOutput - The return type for the analyzeFacebookAdMarketingAngle function.
 */

'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeFacebookAdMarketingAngleInputSchema = z.object({
  adText: z.string().describe('The text content of the Facebook Ad.'),
  adTitle: z.string().describe('The title of the Facebook Ad, if available.'),
});
export type AnalyzeFacebookAdMarketingAngleInput = z.infer<typeof AnalyzeFacebookAdMarketingAngleInputSchema>;

const AnalyzeFacebookAdMarketingAngleOutputSchema = z.object({
  c1Clarity: z.number().describe('Clarity: How understandable is the message (0-2).'),
  c2Engagement: z.number().describe('Engagement: Does the first line attract attention (0-2).'),
  c3Concreteness: z.number().describe('Concreteness: Are the benefits clear and measurable (0-2).'),
  c4Coherence: z.number().describe('Coherence: Is the tone and language suitable for the audience (0-2).'),
  c5Credibility: z.number().describe('Credibility: Are there elements of trust (0-2).'),
  c6CallToAction: z.number().describe('Call to Action: Is the invitation clear (0-2).'),
  c7Context: z.number().describe('Context: Is the text optimized for the platform (0-2).'),
  totalScore: z.number().describe('The sum of all the scores.'),
  evaluation: z.string().describe('Qualitative evaluation of the ad copy.'),
  detailedAnalysis: z.string().describe('Detailed analysis of the ad including its strengths and weaknesses.'),
});
export type AnalyzeFacebookAdMarketingAngleOutput = z.infer<typeof AnalyzeFacebookAdMarketingAngleOutputSchema>;

export async function analyzeFacebookAdMarketingAngle(
  input: AnalyzeFacebookAdMarketingAngleInput
): Promise<AnalyzeFacebookAdMarketingAngleOutput> {
  return analyzeFacebookAdMarketingAngleFlow(input);
}

const analyzeFacebookAdMarketingAnglePrompt = ai.definePrompt({
  name: 'analyzeFacebookAdMarketingAnglePrompt',
  input: {schema: AnalyzeFacebookAdMarketingAngleInputSchema},
  output: {schema: AnalyzeFacebookAdMarketingAngleOutputSchema},
  prompt: `Analyze the following text and title (if available) using the \"Metodo 7C\" framework.

Text: {{{adText}}}
Title: {{{adTitle}}}

Framework:
🎯 C1 Chiarezza: Il messaggio è comprensibile in meno di 5 secondi? (Punteggio 0-2)
🧲 C2 Coinvolgimento (Hook): Il primo rigo attira l’attenzione o incuriosisce? (Punteggio 0-2)
💎 C3 Concretezza (Benefit chiari): È chiaro il vantaggio per l’utente? È concreto, misurabile? (Punteggio 0-2)
👤 C4 Coerenza col target: Usa un tono e un linguaggio adatto al pubblico (immagina un pubblico generico se non specificato)? (Punteggio 0-2)
🧠 C5 Credibilità: Ci sono elementi di fiducia (numeri, testimonianze, dati, specificità)? (Punteggio 0-2)
🚀 C6 Call To Action (CTA): L’invito all’azione è chiaro, diretto e contestuale? (Punteggio 0-2)
📱 C7 Contesto (platform-fit): Il testo sembra ottimizzato per una piattaforma social come Facebook/Instagram (concisione, emoji appropriate, hashtag se pertinenti)? (Punteggio 0-2)

Rispondi con un oggetto JSON che contenga:
- Un campo per ogni "C" chiamato c1Clarity, c2Engagement, c3Concreteness, c4Coherence, c5Credibility, c6CallToAction, c7Context, che contenga il valore del punteggio corrispondente.
- Un campo totalScore, che contenga la somma dei singoli punteggi.
- Un campo evaluation, che contenga una valutazione qualitativa del testo e del titolo in base alla seguente scala:
  - 12-14: Ottimo - copy ad alta resa
  - 9-11: Buono - migliorabile in alcuni punti
  - 6-8: Debole - serve revisione
  - 0-5: Scarso - da riscrivere
- Un campo detailedAnalysis, che contenga una breve analisi del testo e del titolo, che includa i punti di forza e di debolezza.`,
  config: {
    temperature: 0.5,
    maxTokens: 1024,
  },
});

const AnalyzeFacebookAdMarketingAngleOutputSchemaSanitized = z.object({
  c1Clarity: z.number().describe('Clarity: How understandable is the message (0-2).').optional(),
  c2Engagement: z.number().describe('Engagement: Does the first line attract attention (0-2).').optional(),
  c3Concreteness: z.number().describe('Concreteness: Are the benefits clear and measurable (0-2).').optional(),
  c4Coherence: z.number().describe('Coherence: Is the tone and language suitable for the audience (0-2).').optional(),
  c5Credibility: z.number().describe('Credibility: Are there elements of trust (0-2).').optional(),
  c6CallToAction: z.number().describe('Call to Action: Is the invitation clear (0-2).').optional(),
  c7Context: z.number().describe('Context: Is the text optimized for the platform (0-2).').optional(),
  totalScore: z.number().describe('The sum of all the scores.').optional(),
  evaluation: z.string().describe('Qualitative evaluation of the ad copy.').optional(),
  detailedAnalysis: z.string().describe('Detailed analysis of the ad including its strengths and weaknesses.').optional(),
});

const analyzeFacebookAdMarketingAngleFlow = ai.defineFlow(
  {
    name: 'analyzeFacebookAdMarketingAngleFlow',
    inputSchema: AnalyzeFacebookAdMarketingAngleInputSchema,
    outputSchema: AnalyzeFacebookAdMarketingAngleOutputSchema,
  },
  async input => {
    const {output} = await analyzeFacebookAdMarketingAnglePrompt(input);

    const sanitizedOutput = AnalyzeFacebookAdMarketingAngleOutputSchemaSanitized.parse(output);
    const totalScore =
      (sanitizedOutput?.c1Clarity ?? 0) +
      (sanitizedOutput?.c2Engagement ?? 0) +
      (sanitizedOutput?.c3Concreteness ?? 0) +
      (sanitizedOutput?.c4Coherence ?? 0) +
      (sanitizedOutput?.c5Credibility ?? 0) +
      (sanitizedOutput?.c6CallToAction ?? 0) +
      (sanitizedOutput?.c7Context ?? 0);

    const evaluation =
      totalScore >= 12 ? 'Ottimo - copy ad alta resa' :
      totalScore >= 9 ? 'Buono - migliorabile in alcuni punti' :
      totalScore >= 6 ? 'Debole - serve revisione' :
      'Scarso - da riscrivere';

    return {
      c1Clarity: sanitizedOutput?.c1Clarity ?? 0,
      c2Engagement: sanitizedOutput?.c2Engagement ?? 0,
      c3Concreteness: sanitizedOutput?.c3Concreteness ?? 0,
      c4Coherence: sanitizedOutput?.c4Coherence ?? 0,
      c5Credibility: sanitizedOutput?.c5Credibility ?? 0,
      c6CallToAction: sanitizedOutput?.c6CallToAction ?? 0,
      c7Context: sanitizedOutput?.c7Context ?? 0,
      totalScore: totalScore,
      evaluation: sanitizedOutput?.evaluation ?? evaluation,
      detailedAnalysis: sanitizedOutput?.detailedAnalysis ?? '',
    };
  }
);
