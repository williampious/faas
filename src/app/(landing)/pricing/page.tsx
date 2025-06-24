
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { ArrowLeft, CheckCircle, Zap, DollarSign, Award, Star, Gem, Rocket } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface TierFeature {
  text: string;
  included: boolean;
}

interface PricingTier {
  id: string;
  name: string;
  icon: React.ElementType;
  price: string;
  priceDescription: string;
  features: TierFeature[];
  buttonText: string;
  buttonVariant?: 'default' | 'secondary' | 'outline';
  highlight?: boolean;
  href: string;
}

const pricingTiers: PricingTier[] = [
  {
    id: 'free',
    name: 'Free',
    icon: Award,
    price: 'GHS 0',
    priceDescription: 'per month',
    features: [
      { text: 'Basic Dashboard Overview', included: true },
      { text: '1 Farm Plot Management', included: true },
      { text: 'Limited Task Management (5 Tasks)', included: true },
      { text: 'Community Support', included: true },
      { text: 'Weather Monitoring (Mock Data)', included: false },
      { text: 'AI Planting Advice (Limited)', included: false },
    ],
    buttonText: 'Get Started for Free',
    buttonVariant: 'outline',
    href: '/auth/register?plan=free',
  },
  {
    id: 'basic',
    name: 'Basic Farmer',
    icon: Star,
    price: 'GHS 50',
    priceDescription: 'per month',
    features: [
      { text: 'All Free features, plus:', included: true },
      { text: 'Up to 5 Farm Plots', included: true },
      { text: 'Full Task Management', included: true },
      { text: 'Basic Resource Inventory', included: true },
      { text: 'Weather Monitoring (Basic)', included: true },
      { text: 'Email Support', included: true },
      { text: 'AI Planting Advice (Limited)', included: false },
    ],
    buttonText: 'Choose Basic',
    buttonVariant: 'secondary',
    href: '/auth/register?plan=basic',
  },
  {
    id: 'premium',
    name: 'Premium Grower',
    icon: Gem,
    price: 'GHS 150',
    priceDescription: 'per month',
    features: [
      { text: 'All Basic features, plus:', included: true },
      { text: 'Up to 20 Farm Plots', included: true },
      { text: 'Advanced Weather Monitoring', included: true },
      { text: 'AI Planting Advice (Standard)', included: true },
      { text: 'Basic Financial Reporting', included: true },
      { text: 'Priority Email & Chat Support', included: true },
      { text: 'User Roles (up to 3 staff)', included: false },
    ],
    buttonText: 'Go Premium',
    buttonVariant: 'default',
    highlight: true,
    href: '/auth/register?plan=premium',
  },
  {
    id: 'pro',
    name: 'Pro AgriBusiness',
    icon: Rocket,
    price: 'GHS 300',
    priceDescription: 'per month',
    features: [
      { text: 'All Premium features, plus:', included: true },
      { text: 'Unlimited Farm Plots', included: true },
      { text: 'Advanced AI Planting Advice & Tools', included: true },
      { text: 'Full Financial Reporting & Analytics', included: true },
      { text: 'User Roles & Permissions (Unlimited staff)', included: true },
      { text: 'Dedicated Phone Support & Account Manager', included: true },
      { text: 'API Access (Future)', included: true },
    ],
    buttonText: 'Contact Sales',
    buttonVariant: 'outline',
    href: '/#contact-us', 
  },
];

export default function PricingPage() {
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
            <DollarSign className="mr-3 h-10 w-10" /> AgriFAAS Connect Pricing
          </h1>
          <p className="mt-3 text-lg sm:text-xl text-foreground/80 max-w-2xl mx-auto">
            Choose the perfect plan to grow your farm and business. Simple, transparent pricing.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 items-stretch">
          {pricingTiers.map((tier) => (
            <Card 
              key={tier.id} 
              className={cn(
                "flex flex-col shadow-xl hover:shadow-2xl transition-shadow duration-300",
                tier.highlight && "border-primary border-2 ring-4 ring-primary/20"
              )}
            >
              <CardHeader className={cn("text-center pb-4", tier.highlight && "bg-primary/5")}>
                <tier.icon className={cn("h-12 w-12 mx-auto mb-3", tier.highlight ? "text-primary" : "text-muted-foreground")} />
                <CardTitle className="text-2xl font-semibold">{tier.name}</CardTitle>
                <p className="text-3xl font-bold text-primary mt-2">{tier.price}</p>
                <CardDescription>{tier.priceDescription}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow pt-4 space-y-3">
                <ul className="space-y-2 text-sm">
                  {tier.features.map((feature, index) => (
                    <li key={index} className={cn("flex items-start", !feature.included && "text-muted-foreground line-through")}>
                      <CheckCircle className={cn("h-4 w-4 mr-2 mt-0.5 shrink-0", feature.included ? "text-green-600" : "text-muted-foreground/50")} />
                      <span>{feature.text}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="mt-auto p-6">
                <Link href={tier.href} className="w-full">
                  <Button size="lg" variant={tier.buttonVariant} className="w-full">
                    {tier.buttonText}
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
        
        <div className="text-center mt-12">
          <p className="text-muted-foreground mb-4">
            Need a custom solution or have questions? <Link href="/#contact-us" className="text-primary hover:underline">Contact us</Link>.
          </p>
          <Link href="/">
            <Button variant="outline" size="lg">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
