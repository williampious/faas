
'use client';

import type { Metadata } from 'next';
import '../globals.css';
import Image from 'next/image';
import Link from 'next/link';

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div 
      className="font-body antialiased flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-background to-green-50 dark:from-slate-900 dark:to-green-950 p-4" 
      suppressHydrationWarning={true}
    >
      <header className="mb-8">
        <Link href="/">
          <Image
            src="/agrifaas-logo.png"
            alt="AgriFAAS Connect Logo"
            width={280}
            height={84}
            objectFit="contain"
            priority
          />
        </Link>
      </header>
      <main className="w-full">
        {children}
      </main>
    </div>
  );
}
