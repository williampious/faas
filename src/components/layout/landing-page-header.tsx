'use client';

import Link from 'next/link';
import Image from 'next/image';
import type { LucideIcon } from 'lucide-react';

interface LandingPageHeaderProps {
  title: string;
  description: string;
  icon: LucideIcon;
}

export function LandingPageHeader({ title, description, icon: Icon }: LandingPageHeaderProps) {
  return (
    <header className="mb-10 text-center">
      <Link href="/">
        <Image
          src="/agrifaas-logo.png"
          alt="AgriFAAS Connect Logo"
          width={200}
          height={67}
          objectFit="contain"
          priority
        />
      </Link>
      <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-primary font-headline flex items-center justify-center">
        <Icon className="mr-3 h-10 w-10" /> {title}
      </h1>
      <p className="mt-3 text-lg sm:text-xl text-foreground/80 max-w-2xl mx-auto">
        {description}
      </p>
    </header>
  );
}
