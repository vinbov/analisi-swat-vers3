
import Image from 'next/image';
import Link from 'next/link';

export function AppHeader() {
  return (
    <header className="mb-8 text-center flex flex-col items-center">
      <Link href="/" passHref>
        <Image
          id="appLogo"
          src="https://placehold.co/150x50-test-v3.png" // URL univoco per cache busting
          alt="Logo SWAT Analisi (150x50 v3)" // Alt text aggiornato
          width={150}
          height={50}
          className="mb-4 object-contain"
          data-ai-hint="logo abstract"
          priority
          unoptimized={true} // Aggiunto per bypassare l'ottimizzazione di Next.js
        />
      </Link>
      <h1 className="text-4xl md:text-5xl font-bold" style={{ color: 'hsl(var(--sky-700))' }}>
        ANALISI S.W.A.T. (Strengths, Weaknesses, Approaches, Tactics) Punti di forza, debolezze, approcci, tattiche
      </h1>
    </header>
  );
}
