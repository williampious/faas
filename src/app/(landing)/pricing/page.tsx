
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ArrowLeft, CheckCircle, HelpCircle, DollarSign, Award, Star, Gem, Rocket, Building, ShieldCheck, Check, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LandingPageHeader } from '@/components/layout/landing-page-header';

type BillingCycle = 'monthly' | 'annually';

interface TierFeature {
  text: string;
  included: boolean;
}

interface FeatureGroup {
    title: string;
    features: TierFeature[];
}

interface PricingTier {
  id: string;
  name: string;
  icon: React.ElementType;
  description: string;
  price: {
    monthly: number;
    annually: number;
  };
  priceDescription: string;
  featureGroups: FeatureGroup[];
  buttonText: string;
  buttonVariant?: 'default' | 'secondary' | 'outline';
  highlight?: boolean;
  badge?: string;
  href: string;
}

const pricingTiers: PricingTier[] = [
  {
    id: 'starter',
    name: 'Starter',
    icon: Award,
    description: "For individual farmers or small teams getting started.",
    price: { monthly: 0, annually: 0 },
    priceDescription: 'Free Forever',
    featureGroups: [
        {
            title: 'Core Features',
            features: [
              { text: '1 User Account', included: true },
              { text: 'Basic Dashboard & Weather', included: true },
              { text: 'Collaborative Task Board & Calendar', included: true },
              { text: 'Resource Inventory', included: true },
              { text: '1 Farm Plot', included: true },
              { text: '5 records per core module', included: true },
            ],
        },
        {
            title: 'Financials & AI',
            features: [
                { text: 'AI Planting Advice', included: true },
                { text: 'Basic Cost Tracking', included: true },
                { text: 'Community Support', included: true },
                { text: 'Animal Production Module', included: false },
                { text: 'Advanced Financial Reporting', included: false },
                { text: 'Office & HR Management', included: false },
                { text: 'AEO Tools', included: false },
            ]
        }
    ],
    buttonText: 'Get Started for Free',
    buttonVariant: 'outline',
    href: '/auth/register',
  },
  {
    id: 'grower',
    name: 'Grower',
    icon: Star,
    description: "For growing farms and teams needing more capabilities.",
    price: { monthly: 209, annually: 2099 },
    priceDescription: 'per user / month',
    featureGroups: [
        {
            title: 'Everything in Starter, plus:',
            features: [
              { text: 'Up to 5 Users', included: true },
              { text: 'Full Farm Operations Suite (Unlimited Records)', included: true },
              { text: 'Unlimited Farm Plots', included: true },
              { text: 'Animal Production Module', included: true },
              { text: 'Email & Chat Support', included: true },
            ],
        },
        {
            title: 'Financials',
            features: [
                { text: 'Full Financial Dashboard', included: true },
                { text: 'Standard Budgeting Tools', included: true },
                 { text: 'Office & HR Management', included: false },
                { text: 'AEO Tools', included: false },
            ]
        }
    ],
    buttonText: 'Start Free Trial',
    buttonVariant: 'secondary',
    href: '/auth/register',
  },
  {
    id: 'business',
    name: 'Business',
    icon: Gem,
    description: "For established agribusinesses requiring advanced tools.",
    price: { monthly: 449, annually: 4499 },
    priceDescription: 'per user / month',
    badge: 'Best Value',
    featureGroups: [
        {
            title: 'Everything in Grower, plus:',
            features: [
              { text: 'Unlimited Users', included: true },
              { text: 'HR & Office Management Modules', included: true },
              { text: 'AEO Management Tools', included: true },
              { text: 'Profitability Analysis Reports', included: true },
              { text: 'Priority Phone & Chat Support', included: true },
            ],
        }
    ],
    buttonText: 'Start Free Trial',
    buttonVariant: 'default',
    highlight: true,
    href: '/auth/register',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    icon: Rocket,
    description: "Custom solutions for large-scale operations and cooperatives.",
    price: { monthly: 0, annually: 0 },
    priceDescription: 'Custom Pricing',
    featureGroups: [
        {
            title: 'Everything in Business, plus:',
            features: [
              { text: 'Dedicated Account Manager', included: true },
              { text: 'Custom Integrations (API Access)', included: true },
              { text: 'Multi-Currency Support', included: true },
              { text: 'Custom Security & Compliance', included: true },
              { text: 'Onboarding & Training Services', included: true },
            ],
        },
    ],
    buttonText: 'Contact Sales',
    buttonVariant: 'outline',
    href: '/#contact-us', 
  },
];

const faqItems = [
    {
        question: "Is there a free trial?",
        answer: "Yes! All new users automatically receive a 20-day free trial of our comprehensive Business Plan. No credit card is required to start your trial. After 20 days, you can choose a paid plan or be moved to our free Starter plan."
    },
    {
        question: "Can I change my plan later?",
        answer: "Absolutely! You can upgrade, downgrade, or switch between monthly and annual billing at any time from your account settings. Prorated charges or credits will be applied automatically."
    },
    {
        question: "Who owns my data?",
        answer: "You do. We are custodians of your data, not owners. You retain full ownership of all the data you input into AgriFAAS Connect. You can export your data at any time. For more details, please see our Privacy Policy."
    },
    {
        question: "What are the limitations of the free Starter plan?",
        answer: "The Starter plan is great for getting to know the app. It's limited to 1 farm plot and allows up to 5 records for each of the main operational modules (Land Prep, Planting, Maintenance, and Harvesting). Paid plans offer unlimited records and advanced modules."
    }
];

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('annually');
  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);

  return (
    <div className="container mx-auto px-4">
      <LandingPageHeader
        title="AgriFAAS Connect Pricing"
        description="Choose the perfect plan to grow your farm and business. Simple, transparent pricing."
        icon={DollarSign}
      />
      
      <div className="text-center mb-8 max-w-2xl mx-auto">
        <div className="inline-block bg-primary/10 text-primary font-semibold rounded-full px-4 py-2">
           <Sparkles className="inline-block h-5 w-5 mr-2" />
           All new accounts start with a 20-day free trial of the Business Plan!
        </div>
      </div>


      <div className="flex justify-center items-center space-x-4 mb-10">
        <Label htmlFor="billing-cycle" className={cn("font-medium", billingCycle === 'monthly' && 'text-primary')}>Monthly</Label>
        <Switch
          id="billing-cycle"
          checked={billingCycle === 'annually'}
          onCheckedChange={(checked) => setBillingCycle(checked ? 'annually' : 'monthly')}
        />
        <Label htmlFor="billing-cycle" className={cn("font-medium", billingCycle === 'annually' && 'text-primary')}>
          Annually <span className="text-sm font-normal text-green-600">(Save up to 17%!)</span>
        </Label>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6 lg:gap-8 items-stretch">
        {pricingTiers.map((tier) => (
          <Card 
            key={tier.id} 
            className={cn(
              "flex flex-col shadow-xl hover:shadow-2xl transition-shadow duration-300 relative overflow-hidden",
              tier.highlight && "border-primary border-2 ring-4 ring-primary/20"
            )}
          >
            {tier.badge && (
                <div className="absolute top-2 -right-10 text-center bg-accent text-accent-foreground text-xs font-semibold py-1 px-10 transform rotate-45">
                    {tier.badge}
                </div>
            )}
            <CardHeader className={cn("text-center pb-4", tier.highlight && "bg-primary/5")}>
              <tier.icon className={cn("h-12 w-12 mx-auto mb-3", tier.highlight ? "text-primary" : "text-muted-foreground")} />
              <CardTitle className="text-2xl font-semibold">{tier.name}</CardTitle>
              <CardDescription className="h-10">{tier.description}</CardDescription>
              {tier.price.monthly > 0 ? (
                <div className="mt-4">
                  <p className="text-4xl font-bold text-primary">
                    {billingCycle === 'annually' ? formatCurrency(tier.price.annually / 12) : formatCurrency(tier.price.monthly)}
                  </p>
                  <p className="text-muted-foreground text-sm">{tier.priceDescription}</p>
                   {billingCycle === 'monthly' && <p className="text-xs text-muted-foreground h-4">(Billed Monthly)</p>}
                   {billingCycle === 'annually' && <p className="text-xs text-muted-foreground h-4">(Billed as {formatCurrency(tier.price.annually)} annually)</p>}
                </div>
              ) : (
                <div className="mt-4">
                    <p className="text-4xl font-bold text-primary">{tier.id === 'enterprise' ? 'Custom' : 'Free'}</p>
                    <p className="text-muted-foreground text-sm h-8">{tier.id === 'enterprise' ? 'Tailored to your needs' : 'No cost, ever'}</p>
                </div>
              )}
            </CardHeader>
            <CardContent className="flex-grow pt-4 space-y-4">
              {tier.featureGroups.map(group => (
                  <div key={group.title}>
                    <h4 className="font-semibold text-sm mb-2 text-foreground/80">{group.title}</h4>
                    <ul className="space-y-2 text-sm">
                        {group.features.map((feature, index) => (
                        <li key={index} className={cn("flex items-start", !feature.included && "text-muted-foreground line-through opacity-60")}>
                            <Check className={cn("h-4 w-4 mr-2 mt-0.5 shrink-0", feature.included ? "text-green-600" : "text-muted-foreground/50")} />
                            <span>{feature.text}</span>
                        </li>
                        ))}
                    </ul>
                  </div>
              ))}
            </CardContent>
            <CardFooter className="mt-auto p-6">
              <Link href={tier.href} className="w-full">
                <Button size="lg" variant={tier.buttonVariant} className="w-full">
                  {tier.buttonText.includes('Trial') && <Sparkles className="mr-2 h-4 w-4" />}
                  {tier.buttonText}
                </Button>
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
      
       <div className="text-center mt-12">
        <p className="text-muted-foreground mb-4">
          All plans include multi-currency support (GHS, USD, etc.) and future access to modular add-ons.
        </p>
      </div>

       <div className="grid md:grid-cols-2 gap-8 mt-16 max-w-4xl mx-auto">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center"><ShieldCheck className="mr-2 h-6 w-6 text-primary" />Secure Payments</CardTitle>
                    <CardDescription>We offer a variety of secure payment methods to make your subscription hassle-free.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="font-semibold mb-2">Supported Payment Methods:</p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1">
                        <li>MTN Mobile Money</li>
                        <li>M-Pesa</li>
                        <li>Paystack</li>
                        <li>Flutterwave</li>
                        <li>PayPal</li>
                        <li>Credit/Debit Card (Visa, Mastercard)</li>
                    </ul>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center"><HelpCircle className="mr-2 h-6 w-6 text-primary" />Frequently Asked Questions</CardTitle>
                    <CardDescription>Quick answers to common questions about our plans.</CardDescription>
                </CardHeader>
                <CardContent>
                     <Accordion type="single" collapsible className="w-full">
                        {faqItems.map((item, index) => (
                        <AccordionItem value={`item-${index}`} key={index}>
                            <AccordionTrigger className="text-left hover:no-underline text-sm py-3">
                            <span className="font-semibold text-primary/90">{item.question}</span>
                            </AccordionTrigger>
                            <AccordionContent className="text-muted-foreground text-sm">
                            {item.answer}
                            </AccordionContent>
                        </AccordionItem>
                        ))}
                    </Accordion>
                </CardContent>
            </Card>
        </div>

      <div className="text-center mt-16">
        <Link href="/">
          <Button variant="outline" size="lg">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
