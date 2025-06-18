
/**
 * @fileOverview A Facebook Ad marketing angle analyzer flow, using OpenAI.
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
  adTitle: z.string().optional().describe('The title of the Facebook Ad, if available.'),
});
export type AnalyzeFacebookAdMarketingAngleInput = z.infer<typeof AnalyzeFacebookAdMarketingAngleInputSchema>;

const AnalyzeFacebookAdMarketingAngleOutputSchema = z.object({
  c1Clarity: z.number().min(0).max(2).describe('Clarity: How understandable is the message (0-2).'),
  c2Engagement: z.number().min(0).max(2).describe('Engagement: Does the first line attract attention (0-2).'),
  c3Concreteness: z.number().min(0).max(2).describe('Concreteness: Are the benefits clear and measurable (0-2).'),
  c4Coherence: z.number().min(0).max(2).describe('Coherence: Is the tone and language suitable for the audience (0-2).'),
  c5Credibility: z.number().min(0).max(2).describe('Credibility: Are there elements of trust (0-2).'),
  c6CallToAction: z.number().min(0).max(2).describe('Call to Action: Is the invitation clear (0-2).'),
  c7Context: z.number().min(0).max(2).describe('Context: Is the text optimized for the platform (0-2).'),
  totalScore: z.number().describe('The sum of all the C scores (0-14).'),
  evaluation: z.string().describe('Qualitative evaluation of the ad copy based on the total score (e.g., Ottimo, Buono, Debole, Scarso).'),
  detailedAnalysis: z.string().describe(
    'Detailed qualitative analysis of the ad. This should include: ' +
    '1. Sintesi di Marketing: The main message and marketing angle. ' +
    '2. Punti di Forza: What works well in this ad. ' +
    '3. Punti Deboli: What could be improved. ' +
    '4. Linee Guida: 2-3 concrete suggestions for optimizing the ad.'
  ),
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
  model: 'openai/gpt-4o', // Questo modello sarà usato se il plugin OpenAI è attivo
  prompt: `Analyze the following text and title (if available) using the "Metodo 7C" framework.

Text: {{{adText}}}
Title: {{{adTitle}}}

Framework di valutazione copy AD – Metodo 7C:
🎯 C1 Chiarezza: Il messaggio è comprensibile in meno di 5 secondi? (Punteggio 0-2)
🧲 C2 Coinvolgimento (Hook): Il primo rigo attira l’attenzione o incuriosisce? (Punteggio 0-2)
💎 C3 Concretezza (Benefit chiari): È chiaro il vantaggio per l’utente? È concreto, misurabile? (Punteggio 0-2)
👤 C4 Coerenza col target: Usa un tono e un linguaggio adatto al pubblico (immagina un pubblico generico se non specificato)? (Punteggio 0-2)
🧠 C5 Credibilità: Ci sono elementi di fiducia (numeri, testimonianze, dati, specificità)? (Punteggio 0-2)
🚀 C6 Call To Action (CTA): L’invito all’azione è chiaro, diretto e contestuale? (Punteggio 0-2)
📱 C7 Contesto (platform-fit): Il testo sembra ottimizzato per una piattaforma social come Facebook/Instagram (concisione, emoji appropriate, hashtag se pertinenti)? (Punteggio 0-2)

Per ciascuna "C", fornisci un punteggio da 0 a 2 (0 = assente, 1 = presente ma debole, 2 = presente e forte).

Rispondi con un oggetto JSON che contenga:
- Punteggi per c1Clarity, c2Engagement, c3Concreteness, c4Coherence, c5Credibility, c6CallToAction, c7Context.
- Un campo totalScore: la somma dei singoli punteggi (da 0 a 14).
- Un campo evaluation: valutazione qualitativa basata sul punteggio totale (12-14: Ottimo - copy ad alta resa; 9-11: Buono - migliorabile; 6-8: Debole - serve revisione; 0-5: Scarso - da riscrivere).
- Un campo detailedAnalysis che includa OBBLIGATORIAMENTE:
    1. Sintesi di Marketing: Qual è il messaggio principale e l'angle di marketing?
    2. Punti di Forza: Cosa funziona bene in questo annuncio?
    3. Punti Deboli: Cosa potrebbe essere migliorato?
    4. Linee Guida: 2-3 suggerimenti concreti per ottimizzare l'annuncio.

Assicurati che i punteggi per C1-C7 siano sempre numeri tra 0 e 2.
L'intero output DEVE essere un oggetto JSON valido. Non includere testo prima o dopo l'oggetto JSON.
`,
  config: {
    temperature: 0.5,
  },
});

// Schema per sanitizzare l'output se non corrisponde perfettamente
const AnalyzeFacebookAdMarketingAngleOutputSchemaSanitized = z.object({
  c1Clarity: z.number().min(0).max(2).optional(),
  c2Engagement: z.number().min(0).max(2).optional(),
  c3Concreteness: z.number().min(0).max(2).optional(),
  c4Coherence: z.number().min(0).max(2).optional(),
  c5Credibility: z.number().min(0).max(2).optional(),
  c6CallToAction: z.number().min(0).max(2).optional(),
  c7Context: z.number().min(0).max(2).optional(),
  totalScore: z.number().optional(),
  evaluation: z.string().optional(),
  detailedAnalysis: z.string().optional(),
});


const analyzeFacebookAdMarketingAngleFlow = ai.defineFlow(
  {
    name: 'analyzeFacebookAdMarketingAngleFlow',
    inputSchema: AnalyzeFacebookAdMarketingAngleInputSchema,
    outputSchema: AnalyzeFacebookAdMarketingAngleOutputSchema,
  },
  async (input: AnalyzeFacebookAdMarketingAngleInput): Promise<AnalyzeFacebookAdMarketingAngleOutput> => {
    let outputJson: any;
    try {
      const result = await analyzeFacebookAdMarketingAnglePrompt(input);

      if (typeof result.output === 'string') {
        try {
            outputJson = JSON.parse(result.output);
        } catch (parseError) {
            console.error("analyzeFacebookAdMarketingAngleFlow: Errore nel parsing dell'output JSON grezzo:", parseError);
            console.error("analyzeFacebookAdMarketingAngleFlow: Output grezzo ricevuto:", result.output);
            // Se il parsing fallisce, tentiamo di costruire un output di errore strutturato ma includiamo il raw output.
             return {
                c1Clarity: 0, c2Engagement: 0, c3Concreteness: 0, c4Coherence: 0, c5Credibility: 0, c6CallToAction: 0, c7Context: 0,
                totalScore: 0,
                evaluation: "Errore Output AI (Parsing Fallito)",
                detailedAnalysis: `L'AI ha restituito una stringa non JSON valida. Contenuto ricevuto: ${result.output.substring(0, 500)}${result.output.length > 500 ? '...' : ''}`,
            };
        }
      } else {
        outputJson = result.output;
      }

      if (!outputJson) {
        throw new Error("L'AI non ha restituito un output valido (outputJson è nullo o indefinito dopo il tentativo di parsing).");
      }

    } catch (flowError: any) {
      console.error("analyzeFacebookAdMarketingAngleFlow: Errore durante l'esecuzione del prompt AI:", flowError);
      let detailedErrorMessage = `Impossibile eseguire l'analisi dell'angle. Errore originale: ${flowError.message}`;
      if (flowError.message?.toLowerCase().includes('openai') && (flowError.message?.includes('not found') || flowError.message?.includes('not configured') || flowError.message?.includes('plugin'))) {
        detailedErrorMessage = `Impossibile eseguire l'analisi dell'angle. Il plugin OpenAI richiesto ('@genkit-ai/openai') potrebbe non essere installato, non configurato correttamente, o il modello specificato non è accessibile. Controlla la console e lo stato del pacchetto '@genkit-ai/openai'. Errore originale: ${flowError.message}`;
      }
      return {
        c1Clarity: 0, c2Engagement: 0, c3Concreteness: 0, c4Coherence: 0, c5Credibility: 0, c6CallToAction: 0, c7Context: 0,
        totalScore: 0,
        evaluation: "Analisi AI Non Disponibile",
        detailedAnalysis: detailedErrorMessage,
      };
    }

    const validationResult = AnalyzeFacebookAdMarketingAngleOutputSchema.safeParse(outputJson);

    if (!validationResult.success) {
      console.warn("analyzeFacebookAdMarketingAngleFlow: L'output dell'AI non corrisponde perfettamente allo schema. Tentativo di sanitizzazione.", validationResult.error.flatten());
      const sanitizedParse = AnalyzeFacebookAdMarketingAngleOutputSchemaSanitized.safeParse(outputJson);
      if (sanitizedParse.success && sanitizedParse.data) { // Verifica che sanitizedParse.data esista
        outputJson = sanitizedParse.data; 
      } else {
        console.error("analyzeFacebookAdMarketingAngleFlow: Fallita anche la sanitizzazione dell'output AI:", sanitizedParse.error?.flatten());
         return { // Output di errore strutturato
            c1Clarity: 0, c2Engagement: 0, c3Concreteness: 0, c4Coherence: 0, c5Credibility: 0, c6CallToAction: 0, c7Context: 0,
            totalScore: 0,
            evaluation: "Errore Output AI (Validazione Fallita)",
            detailedAnalysis: `L'output dell'AI non è valido e non è stato possibile sanitizzarlo. Dettagli: ${JSON.stringify(sanitizedParse.error?.flatten() || 'Errore di validazione sconosciuto')}`,
        };
      }
    } else {
       outputJson = validationResult.data; 
    }

    // Assicurarsi che tutti i campi numerici abbiano un fallback a 0 se non presenti
    const c1 = outputJson.c1Clarity ?? 0;
    const c2 = outputJson.c2Engagement ?? 0;
    const c3 = outputJson.c3Concreteness ?? 0;
    const c4 = outputJson.c4Coherence ?? 0;
    const c5 = outputJson.c5Credibility ?? 0;
    const c6 = outputJson.c6CallToAction ?? 0;
    const c7 = outputJson.c7Context ?? 0;

    // Calcola totalScore se non fornito o se si usano i valori sanitizzati/di fallback
    const totalScore = outputJson.totalScore !== undefined && typeof outputJson.totalScore === 'number' 
                       ? outputJson.totalScore 
                       : (c1 + c2 + c3 + c4 + c5 + c6 + c7);


    let evaluation = outputJson.evaluation;
    // Ricalcola evaluation se mancante o se il totalScore è stato ricalcolato
    if (!evaluation || typeof evaluation !== 'string' || outputJson.totalScore === undefined) {
        evaluation =
            totalScore >= 12 ? 'Ottimo - copy ad alta resa' :
            totalScore >= 9 ? 'Buono - migliorabile in alcuni punti' :
            totalScore >= 6 ? 'Debole - serve revisione' :
            'Scarso - da riscrivere';
    }
    
    const finalDetailedAnalysis = outputJson.detailedAnalysis ?? (validationResult.success ? 'Analisi dettagliata non fornita.' : `Analisi dettagliata non disponibile a causa di problemi con l'output dell'AI. Errore validazione: ${JSON.stringify(validationResult.error?.flatten())}`);


    return {
      c1Clarity: c1,
      c2Engagement: c2,
      c3Concreteness: c3,
      c4Coherence: c4,
      c5Credibility: c5,
      c6CallToAction: c6,
      c7Context: c7,
      totalScore: totalScore,
      evaluation: evaluation,
      detailedAnalysis: finalDetailedAnalysis,
    };
  }
);

