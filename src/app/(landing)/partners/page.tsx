
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, ExternalLink, Handshake } from 'lucide-react';

// Partner data is stored here for easy updates.
const partners = [
  {
    name: "AgriTech Innovators",
    logo: "https://placehold.co/400x200.png",
    website: "https://example.com",
    description: "Pioneering new technologies in sustainable agriculture to improve crop yields and reduce environmental impact.",
    logoHint: "technology innovation"
  },
  {
    name: "Green Fields Foundation",
    logo: "https://placehold.co/400x200.png",
    website: "https://example.com",
    description: "A non-profit organization dedicated to supporting smallholder farmers through education, resources, and community building.",
    logoHint: "green field"
  },
  {
    name: "Global Harvest Logistics",
    logo: "https://placehold.co/400x200.png",
    website: "https://example.com",
    description: "Providing state-of-the-art supply chain solutions to ensure fresh produce reaches markets efficiently and safely.",
    logoHint: "logistics truck"
  },
  {
    name: "CropScience Solutions",
    logo: "https://placehold.co/400x200.png",
    website: "https://example.com",
    description: "Developing advanced, eco-friendly crop protection and enhancement products for modern farming.",
    logoHint: "science laboratory"
  },
  {
    name: "Farm-to-Table Co-op",
    logo: "https://placehold.co/400x200.png",
    website: "https://example.com",
    description: "Connecting local farmers directly with consumers and restaurants to promote fresh, locally-sourced food.",
    logoHint: "market stall"
  },
  {
    name: "AquaFarm Systems",
    logo: "https://placehold.co/400x200.png",
    website: "https://example.com",
    description: "Specialists in aquaponics and hydroponics systems, enabling year-round cultivation with minimal water usage.",
    logoHint: "water farming"
  },
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
            <Handshake className="mr-3 h-10 w-10" /> Our Valued Partners
          </h1>
          <p className="mt-3 text-lg sm:text-xl text-foreground/80 max-w-2xl mx-auto">
            We are proud to collaborate with leading organizations to drive innovation in agriculture.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {partners.map((partner, index) => (
            <Card key={index} className="flex flex-col overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-300">
              <CardHeader className="p-0">
                <div className="relative aspect-video">
                  <Image
                    src={partner.logo}
                    alt={`${partner.name} Logo`}
                    layout="fill"
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
