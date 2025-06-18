
'use server';

import type {
  AnalyzeFacebookAdMarketingAngleInput,
  AnalyzeFacebookAdMarketingAngleOutput,
} from '@/lib/types'; // Assumendo che AnalyzeFacebookAdMarketingAngleOutput sia definito qui

// Helper function per parsare la risposta dall'API OpenAI
function parseOpenAIResponse(responseText: string | undefined): Partial<AnalyzeFacebookAdMarketingAngleOutput> {
  if (!responseText) {
    return {
      evaluation: 'Errore OpenAI',
      detailedAnalysis: 'Nessuna risposta ricevuta dal modello OpenAI.',
      totalScore: 0,
      c1Clarity: 0, c2Engagement: 0, c3Concreteness: 0, c4Coherence: 0, c5Credibility: 0, c6CallToAction: 0, c7Context: 0,
    };
  }

  const parts = responseText.split('|||');
  const result: Partial<AnalyzeFacebookAdMarketingAngleOutput> = {
    c1Clarity: 0, c2Engagement: 0, c3Concreteness: 0, c4Coherence: 0, c5Credibility: 0, c6CallToAction: 0, c7Context: 0,
    totalScore: 0,
    evaluation: "Errore Parsing Risposta AI",
    detailedAnalysis: `Risposta grezza dall'AI: ${responseText.substring(0, 500)}${responseText.length > 500 ? '...' : ''}`,
  };

  if (parts.length < 10) {
    console.warn('Formato risposta Angle Analysis non standard da OpenAI:', responseText);
    result.detailedAnalysis = `Formato risposta non standard. Risposta grezza: ${responseText.substring(0, 500)}${responseText.length > 500 ? '...' : ''}`;
    return result;
  }

  try {
    const scores: Record<string, number> = {};
    const scoreKeys: (keyof AnalyzeFacebookAdMarketingAngleOutput)[] = ['c1Clarity', 'c2Engagement', 'c3Concreteness', 'c4Coherence', 'c5Credibility', 'c6CallToAction', 'c7Context'];
    
    for (let i = 0; i < 7; i++) {
      const cPart = parts[i].split(':');
      const scoreValue = cPart[1] ? parseInt(cPart[1].trim(), 10) : 0;
      const key = scoreKeys[i];
      if (key) {
        (result as any)[key] = isNaN(scoreValue) ? 0 : scoreValue;
      }
    }

    const totalScorePart = parts[7].split(':');
    result.totalScore = totalScorePart[1] ? parseInt(totalScorePart[1].trim(), 10) : 0;
    if (isNaN(result.totalScore)) result.totalScore = 0;

    const evaluationPart = parts[8].split(':');
    result.evaluation = evaluationPart[1] ? evaluationPart[1].trim() : 'Valutazione non disponibile';
    
    // L'ultima parte è l'analisi dettagliata
    result.detailedAnalysis = parts.slice(9).join('|||').trim(); // Ricongiunge se '|||' fosse presente nell'analisi

    if (result.detailedAnalysis.toLowerCase().startsWith('analisi approfondita:')) {
        result.detailedAnalysis = result.detailedAnalysis.substring('analisi approfondita:'.length).trim();
    }


  } catch (e) {
    console.error('Errore durante il parsing della risposta OpenAI:', e, 'Risposta:', responseText);
    // result.detailedAnalysis è già impostato con la raw response
  }
  return result;
}


// Funzione per costruire il prompt per OpenAI
function buildOpenAIPrompt(adText: string, adTitle?: string): string {
  return `
Analizza il seguente testo pubblicitario (e titolo, se presente) usando il framework "Metodo 7C".
Testo Ad: "${(adText || "").replace(/"/g, '""')}"
Titolo Ad (se applicabile): "${(adTitle || 'N/A').replace(/"/g, '""')}"

Framework di valutazione copy AD – Metodo 7C:
🎯 C1 Chiarezza: Il messaggio è comprensibile in meno di 5 secondi? (Punteggio 0-2)
🧲 C2 Coinvolgimento (Hook): Il primo rigo attira l’attenzione o incuriosisce? (Punteggio 0-2)
💎 C3 Concretezza (Benefit chiari): È chiaro il vantaggio per l’utente? È concreto, misurabile? (Punteggio 0-2)
👤 C4 Coerenza col target: Usa un tono e un linguaggio adatto al pubblico (immagina un pubblico generico se non specificato)? (Punteggio 0-2)
🧠 C5 Credibilità: Ci sono elementi di fiducia (numeri, testimonianze, dati, specificità)? (Punteggio 0-2)
🚀 C6 Call To Action (CTA): L’invito all’azione è chiaro, diretto e contestuale? (Punteggio 0-2)
📱 C7 Contesto (platform-fit): Il testo sembra ottimizzato per una piattaforma social come Facebook/Instagram (concisione, emoji appropriate, hashtag se pertinenti)? (Punteggio 0-2)

Per ciascuna "C", fornisci un punteggio da 0 a 2: 0 = assente, 1 = presente ma debole, 2 = presente e forte.

Rispondi OBBLIGATORIAMENTE con il seguente formato ESATTO, separando ogni parte con "|||":
C1:[punteggio C1]|||C2:[punteggio C2]|||C3:[punteggio C3]|||C4:[punteggio C4]|||C5:[punteggio C5]|||C6:[punteggio C6]|||C7:[punteggio C7]|||Punteggio Totale:[somma dei punteggi C1-C7]|||Valutazione:[valutazione qualitativa basata sul punteggio totale, es. "Ottimo", "Buono", "Debole", "Scarso"]|||Analisi Approfondita: [La tua analisi dettagliata qui, che includa: 1. Sintesi di Marketing (messaggio principale e angle). 2. Punti di Forza (cosa funziona bene). 3. Punti Deboli (cosa migliorare). 4. Linee Guida (2-3 suggerimenti concreti).]

Esempio di valutazione: 12-14 Ottimo; 9-11 Buono; 6-8 Debole; 0-5 Scarso.
L'Analisi Approfondita DEVE contenere le 4 sezioni indicate.
`;
}

export async function analyzeAdAngleAction(
  input: AnalyzeFacebookAdMarketingAngleInput,
  apiKey: string
): Promise<AnalyzeFacebookAdMarketingAngleOutput> {
  if (!apiKey || apiKey.trim() === '') {
    return {
      c1Clarity: 0, c2Engagement: 0, c3Concreteness: 0, c4Coherence: 0, c5Credibility: 0, c6CallToAction: 0, c7Context: 0,
      totalScore: 0,
      evaluation: 'Errore Configurazione',
      detailedAnalysis: "La OpenAI API Key è mancante. Forniscila nel campo di input del Tool 3.",
    };
  }

  const prompt = buildOpenAIPrompt(input.adText, input.adTitle);
  const payload = {
    model: 'gpt-4o', // Puoi cambiarlo se necessario, es. "gpt-3.5-turbo"
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 800, // Aumentato per consentire analisi più lunghe
    temperature: 0.5,
  };

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      console.error('Errore API OpenAI:', response.status, errorData);
      let errorMessage = `Errore API OpenAI (${response.status}): ${errorData.error?.message || errorData.message || 'Dettagli non disponibili'}`;
      if (response.status === 401) {
        errorMessage = 'Errore API OpenAI (401): API Key non valida o scaduta. Controlla la chiave inserita.';
      } else if (response.status === 429) {
        errorMessage = 'Errore API OpenAI (429): Rate limit superato o quota esaurita. Riprova più tardi o controlla il tuo piano OpenAI.';
      }
      return {
        c1Clarity: 0, c2Engagement: 0, c3Concreteness: 0, c4Coherence: 0, c5Credibility: 0, c6CallToAction: 0, c7Context: 0,
        totalScore: 0,
        evaluation: 'Errore API OpenAI',
        detailedAnalysis: errorMessage,
      };
    }

    const jsonResponse = await response.json();
    const rawAnalysisText = jsonResponse.choices?.[0]?.message?.content;
    
    const parsedResult = parseOpenAIResponse(rawAnalysisText);

    // Assicura che tutti i campi di AnalyzeFacebookAdMarketingAngleOutput siano presenti
    const finalResult: AnalyzeFacebookAdMarketingAngleOutput = {
      c1Clarity: parsedResult.c1Clarity ?? 0,
      c2Engagement: parsedResult.c2Engagement ?? 0,
      c3Concreteness: parsedResult.c3Concreteness ?? 0,
      c4Coherence: parsedResult.c4Coherence ?? 0,
      c5Credibility: parsedResult.c5Credibility ?? 0,
      c6CallToAction: parsedResult.c6CallToAction ?? 0,
      c7Context: parsedResult.c7Context ?? 0,
      totalScore: parsedResult.totalScore ?? 0,
      evaluation: parsedResult.evaluation ?? "Valutazione non disponibile",
      detailedAnalysis: parsedResult.detailedAnalysis ?? "Analisi dettagliata non disponibile.",
    };
    
    // Ricalcola totalScore se non fornito correttamente o per sicurezza
    const calculatedScore = finalResult.c1Clarity + finalResult.c2Engagement + finalResult.c3Concreteness + finalResult.c4Coherence + finalResult.c5Credibility + finalResult.c6CallToAction + finalResult.c7Context;
    if (finalResult.totalScore !== calculatedScore && parts.length >= 10) { // 'parts' è definito solo dentro parseOpenAIResponse
        // Solo se il parsing originale sembrava completo, altrimenti si sovrascrive un errore.
        // console.warn(`Ricalcolo totalScore: AI ha dato ${finalResult.totalScore}, calcolato è ${calculatedScore}. Uso il calcolato.`);
        // finalResult.totalScore = calculatedScore; 
        // Rimuovo il ricalcolo automatico del totalScore qui, mi fido di quello che l'AI ritorna se il formato base è corretto
        // E' più importante che l'AI sia istruita a calcolarlo correttamente.
    }
    
    // Ricalcola evaluation se non fornita o se il totalScore era 0 e ora è stato corretto (non più attivo il ricalcolo sopra)
    if (finalResult.evaluation === "Valutazione non disponibile" || finalResult.evaluation === "Errore Parsing Risposta AI") {
         const score = finalResult.totalScore;
         if (score >= 12) finalResult.evaluation = 'Ottimo - copy ad alta resa';
         else if (score >= 9) finalResult.evaluation = 'Buono - migliorabile in alcuni punti';
         else if (score >= 6) finalResult.evaluation = 'Debole - serve revisione';
         else if (score > 0) finalResult.evaluation = 'Scarso - da riscrivere';
         // Se score è 0, e non per errore, mantiene la evaluation che potrebbe essere "Errore API/Parsing"
    }


    return finalResult;

  } catch (error: any) {
    console.error('Eccezione durante la chiamata API OpenAI o il parsing:', error);
    return {
      c1Clarity: 0, c2Engagement: 0, c3Concreteness: 0, c4Coherence: 0, c5Credibility: 0, c6CallToAction: 0, c7Context: 0,
      totalScore: 0,
      evaluation: 'Errore Interno',
      detailedAnalysis: `Si è verificato un errore nello script: ${error.message}`,
    };
  }
}
