
'use client';

import Link from 'next/link';
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
  },
  {
    name: "NOVAC",
    logo: "/novac-logo.png", // Path to the logo in the /public directory
    website: "https://curetechnologies.org/novac/",
    description: "A transformative Farming-as-a-Service (FaaS) investment model that allows individuals to earn passive income through agriculture. No farming experience needed – our expert team handles everything from land preparation to harvesting and sales. Secure, scalable, and impact-driven – supporting job creation, food security, and economic growth, Powered By Cure Technologies",
  }
];

export default function PartnersPage() {
  return (
    <div className="container mx-auto px-4">
      <LandingPageHeader
        title="Our Key Partners"
        description="We are proud to collaborate with our partners to help transform our ideas into action."
        icon={Handshake}
      />

      <div className="grid md:grid-cols-2 gap-8 justify-center">
        {partners.map((partner, index) => (
          <Card key={index} className="flex flex-col overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-300 max-w-sm w-full mx-auto">
            <CardHeader className="p-0 bg-white flex justify-center items-center h-48">
              <img
                src={partner.logo}
                alt={`${partner.name} Logo`}
                className="max-h-full max-w-full object-contain p-4"
              />
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
