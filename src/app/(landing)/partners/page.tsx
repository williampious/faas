
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, ExternalLink, Handshake } from 'lucide-react';
import { LandingPageHeader } from '@/components/layout/landing-page-header';

// Partner data is stored here for easy updates.
const partners = [
  {
    name: "ALX Africa",
    logo: "/alx-logo.png", // Path to the logo in the /public directory
    website: "https://alx-ventures.com/",
    description: "Helping us TRANSFORM OUR IDEAS INTO ACTION.",
  }
];

export default function PartnersPage() {
  return (
    <div className="container mx-auto px-4">
      <LandingPageHeader
        title="Our Key Partner"
        description="We are proud to collaborate with ALX Africa to help transform our ideas into action."
        icon={Handshake}
      />

      <div className="flex justify-center">
        {partners.map((partner, index) => (
          <Card key={index} className="flex flex-col overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-300 max-w-sm w-full">
            <CardHeader className="p-0 bg-white">
              <div className="relative aspect-video">
                <Image
                  src={partner.logo}
                  alt={`${partner.name} Logo`}
                  fill
                  objectFit="contain"
                  className="p-4"
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
  );
}
