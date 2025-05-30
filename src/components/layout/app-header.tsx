
import Image from 'next/image';
import Link from 'next/link';

export function AppHeader() {
  return (
    <header className="mb-8 text-center flex flex-col items-center">
      <Link href="/" passHref>
        <Image
          id="appLogo"
          src="https://placehold.co/150x50/0284c7/FFFFFF?text=SEO+Toolkit+Pro"
          alt="Logo SEO Toolkit Pro"
          width={150}
          height={50}
          className="h-12 mb-4 object-contain"
          style={{ height: "auto", width: "auto" }}
          data-ai-hint="logo abstract"
        />
      </Link>
      <h1 className="text-4xl md:text-5xl font-bold" style={{ color: 'hsl(var(--sky-700))' }}>
        Suite SEO Multi-Tool
      </h1>
    </header>
  );
}
