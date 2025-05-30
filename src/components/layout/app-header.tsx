
import Image from 'next/image';
import Link from 'next/link';

export function AppHeader() {
  return (
    <header className="mb-8 text-center flex flex-col items-center">
      <Link href="/" passHref>
        <Image
          id="appLogo"
          src="https://placehold.co/150x50.png" // Corretto da 150x150 a 150x50
          alt="Logo ANALISI S.W.A.T."
          width={150}
          height={50}
          className="mb-4 object-contain"
          data-ai-hint="logo abstract"
          priority
        />
      </Link>
      <h1 className="text-4xl md:text-5xl font-bold" style={{ color: 'hsl(var(--sky-700))' }}>
        ANALISI S.W.A.T. (Strengths, Weaknesses, Approaches, Tactics) Punti di forza, debolezze, approcci, tattiche
      </h1>
    </header>
  );
}
