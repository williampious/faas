
import type { Metadata } from 'next';
import '../globals.css';
import Image from 'next/image';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Setup Your Farm - AgriFAAS Connect',
  description: 'Complete the initial setup for your farm on AgriFAAS Connect.',
};

export default function SetupLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-background to-green-50 dark:from-slate-900 dark:to-green-950 p-4">
      <header className="mb-8">
        <Link href="/">
            <Image
                src="/agrifaas-logo.png"
                alt="AgriFAAS Connect Logo"
                width={280}
                height={84}
                style={{ objectFit: 'contain' }}
            />
        </Link>
      </header>
      <main className="w-full max-w-2xl">
        {children}
      </main>
    </div>
  );
}
