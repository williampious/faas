'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-12 bg-gradient-to-br from-background to-green-50 px-4">
      <Card className="w-full max-w-md shadow-2xl overflow-hidden transform transition-all hover:scale-105 duration-300">
        <CardHeader className="p-8 bg-primary/10 text-center">
          <div className="mx-auto mb-6 w-48 h-16 relative">
            <Image
              src="/agrifaas-logo.png" 
              alt="AgriFAAS Connect Logo"
              layout="fill"
              objectFit="contain"
            />
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight text-primary font-headline">
            Welcome to AgriFAAS Connect
          </CardTitle>
          <CardDescription className="text-muted-foreground mt-2 text-lg">
            Empowering Agriculture, Connecting Futures.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8 space-y-6">
          <p className="text-center text-foreground/80">
            Streamline your farm management, connect with resources, and unlock new opportunities with our all-in-one platform.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link href="/auth/signin" passHref>
              <Button size="lg" className="w-full text-lg py-6">
                Sign In
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/auth/register" passHref>
              <Button variant="secondary" size="lg" className="w-full text-lg py-6">
                Register
              </Button>
            </Link>
          </div>
        </CardContent>
        <CardFooter className="p-6 bg-muted/30 justify-center">
           <p className="text-xs text-muted-foreground">
            Transforming agriculture through technology.
          </p>
        </CardFooter>
      </Card>

      <div className="mt-12 text-center max-w-4xl mx-auto">
        <h2 className="text-2xl font-semibold text-foreground/90 mb-6">Why AgriFAAS Connect?</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <FeatureCard title="Smart Farming" description="Leverage AI for planting advice, weather monitoring, and resource management." />
          <FeatureCard title="Resource Hub" description="Access a comprehensive inventory and connect with suppliers." />
          <FeatureCard title="Seamless Operations" description="Manage tasks, track progress, and organize your farm calendar efficiently." />
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ title, description }: { title: string; description: string }) {
  return (
    <Card className="bg-card/80 shadow-lg hover:shadow-xl transition-shadow">
      <CardHeader>
        <CardTitle className="text-xl text-primary">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm">{description}</p>
      </CardContent>
    </Card>
  );
}
