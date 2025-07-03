
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, ExternalLink, Handshake } from 'lucide-react';

// Partner data is stored here for easy updates.
const partners = [
  {
    name: "ALX Africa",
    logo: "https://placehold.co/400x200.png",
    website: "https://alx-ventures.com/",
    description: "Helping us TRANSFORM OUR IDEAS INTO ACTION.",
    logoHint: "alx ventures"
  }
];

export default function PartnersPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-background to-green-50 dark:from-slate-900 dark:to-green-900/50 py-8 sm:py-12">
      <div className="container mx-auto px-4">
        <header className="mb-10 text-center">
          <Link href="/">
            <Image
              src="/agrifaas-logo.png"
              alt="AgriFAAS Connect Logo"
              width={200}
              height={67}
              objectFit="contain"
            />
          </Link>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-primary font-headline flex items-center justify-center">
            <Handshake className="mr-3 h-10 w-10" /> Our Key Partner
          </h1>
          <p className="mt-3 text-lg sm:text-xl text-foreground/80 max-w-2xl mx-auto">
            We are proud to collaborate with ALX Africa to help transform our ideas into action.
          </p>
        </header>

        <div className="flex justify-center">
          {partners.map((partner, index) => (
            <Card key={index} className="flex flex-col overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-300 max-w-sm w-full">
              <CardHeader className="p-0">
                <div className="relative aspect-video">
                  <Image
                    src={partner.logo}
                    alt={`${partner.name} Logo`}
                    fill
                    objectFit="cover"
                    data-ai-hint={partner.logoHint}
                  />
                </div>
              </CardHeader>
              <CardContent className="p-6 flex-grow">
                <CardTitle className="text-xl text-primary mb-2">{partner.name}</CardTitle>
                <CardDescription className="text-sm">{partner.description}</CardDescription>
              </CardContent>
              <CardFooter className="p-6 pt-0 mt-auto">
                <a href={partner.website} target="_blank" rel="noopener noreferrer" className="w-full">
                  <Button variant="outline" className="w-full">
                    Visit Website <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>
                </a>
              </CardFooter>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
            <Link href="/">
                <Button>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
                </Button>
            </Link>
        </div>
      </div>
    </div>
  );
}
