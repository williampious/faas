
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Zap, Leaf, BarChart } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-background to-green-50 dark:from-slate-900 dark:to-green-900/50 py-8 sm:py-12">
      <div className="container mx-auto px-4">
        <header className="mb-12 text-center">
          <Link href="/" className="inline-block mb-4">
            <Image
              src="/agrifaas-logo.png"
              alt="AgriFAAS Connect Logo"
              width={280}
              height={93}
              objectFit="contain"
              priority
            />
          </Link>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-primary font-headline">
            Welcome to AgriFAAS Connect
          </h1>
          <p className="mt-3 text-lg sm:text-xl text-foreground/80 max-w-2xl mx-auto">
            Empowering Agriculture, Connecting Futures. Farm Management, Simplified.
          </p>
        </header>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center mb-16">
          <div className="flex justify-center lg:order-last">
            <Image
              src="https://placehold.co/400x700.png"
              alt="AgriFAAS Connect App on a phone"
              width={400}
              height={700}
              className="rounded-xl shadow-2xl object-cover transform transition-all hover:scale-105 duration-300"
              data-ai-hint="app phone"
              priority
            />
          </div>

          <Card className="w-full max-w-lg mx-auto shadow-2xl overflow-hidden transform transition-all hover:shadow-3xl duration-300 lg:order-first">
            <CardHeader className="p-6 sm:p-8 text-center">
              <CardTitle className="text-2xl sm:text-3xl font-semibold tracking-tight text-primary">
                Get Started
              </CardTitle>
              <CardDescription className="text-muted-foreground mt-2 text-base sm:text-lg">
                Join our platform to revolutionize your farming.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 sm:p-8 space-y-6">
              <p className="text-center text-foreground/80">
                Streamline operations, access resources, and unlock new opportunities with our all-in-one solution.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link href="/auth/signin" passHref>
                  <Button size="lg" className="w-full text-lg py-3 sm:py-4">
                    Sign In
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/auth/register" passHref>
                  <Button variant="secondary" size="lg" className="w-full text-lg py-3 sm:py-4">
                    Register
                  </Button>
                </Link>
              </div>
            </CardContent>
            <CardFooter className="p-6 sm:p-8 justify-center">
              <p className="text-xs text-muted-foreground">
                Transforming agriculture through technology.
              </p>
            </CardFooter>
          </Card>
        </div>

        <div className="text-center max-w-4xl mx-auto">
          <h2 className="text-3xl font-semibold text-foreground/90 mb-8 font-headline">Why AgriFAAS Connect?</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <FeatureCard 
              icon={Zap}
              title="Smart Farming" 
              description="Leverage AI for planting advice, weather monitoring, and resource management." />
            <FeatureCard 
              icon={Leaf}
              title="Resource Hub" 
              description="Access a comprehensive inventory and connect with suppliers." />
            <FeatureCard 
              icon={BarChart}
              title="Seamless Operations" 
              description="Manage tasks, track progress, and organize your farm calendar efficiently." />
          </div>
        </div>
      </div>
    </div>
  );
}

interface FeatureCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
}

function FeatureCard({ icon: Icon, title, description }: FeatureCardProps) {
  return (
    <Card className="bg-card/80 dark:bg-card/50 shadow-lg hover:shadow-xl transition-shadow duration-300 p-6 text-center">
      <div className="mb-4 flex justify-center">
        <div className="p-3 bg-primary/10 rounded-full">
          <Icon className="h-8 w-8 text-primary" />
        </div>
      </div>
      <CardTitle className="text-xl text-primary mb-2">{title}</CardTitle>
      <CardContent className="p-0">
        <p className="text-muted-foreground text-sm">{description}</p>
      </CardContent>
    </Card>
  );
}
