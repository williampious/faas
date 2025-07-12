
'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CreditCard, Check, Star, Gem, Rocket } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useUserProfile } from '@/contexts/user-profile-context';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';


interface TierFeature {
  text: string;
}

interface FeatureGroup {
    title: string;
    features: TierFeature[];
}

interface PricingTier {
  id: string;
  name: string;
  icon: React.ElementType;
  price: string;
  description: string;
  featureGroups: FeatureGroup[];
}


// This is a simplified version of the public pricing tiers for the billing page.
const pricingTiers: PricingTier[] = [
  { 
    id: 'starter', 
    name: 'Starter', 
    icon: Check, 
    price: 'Free', 
    description: "For individual farmers or small teams getting started.",
    featureGroups: [
        {
            title: 'Core Features',
            features: [
              { text: '1 User Account' },
              { text: 'Basic Dashboard' },
              { text: 'Limited Task Management' },
              { text: '1 Farm Plot' },
              { text: 'Community Support' },
            ],
        },
    ],
  },
  { 
    id: 'grower', 
    name: 'Grower', 
    icon: Star, 
    price: '₵210/mo', 
    description: "For growing farms and teams needing more capabilities.",
    featureGroups: [
        {
            title: 'Everything in Starter, plus:',
            features: [
              { text: 'Up to 5 Users' },
              { text: 'Full Farm Operations Suite' },
              { text: 'Full Task & Calendar Tools' },
              { text: 'Resource Inventory' },
            ],
        },
        {
            title: 'Financials',
            features: [
                { text: 'AI Planting Advice (Standard)' },
                { text: 'Basic Financial Dashboard' },
                { text: 'Standard Budgeting Tools' },
            ]
        }
    ],
  },
  { 
    id: 'business', 
    name: 'Business', 
    icon: Gem, 
    price: '₵450/mo', 
    description: "For established agribusinesses requiring advanced tools.",
    featureGroups: [
        {
            title: 'Everything in Grower, plus:',
            features: [
              { text: 'Unlimited Users' },
              { text: 'HR & Office Management Modules' },
              { text: 'AEO Management Tools' },
              { text: 'Priority Phone & Chat Support' },
            ],
        },
        {
            title: 'Financials & Reporting',
            features: [
                { text: 'Advanced AI Tools & History' },
                { text: 'Full Financial Reporting Suite' },
                { text: 'Profitability Analysis' },
            ]
        }
    ],
  },
  { 
    id: 'enterprise', 
    name: 'Enterprise', 
    icon: Rocket, 
    price: 'Custom', 
    description: "Custom solutions for large-scale operations.",
    featureGroups: [
        {
            title: 'Everything in Business, plus:',
            features: [
              { text: 'Dedicated Account Manager' },
              { text: 'Custom Integrations (API Access)' },
              { text: 'Onboarding & Training Services' },
              { text: 'Custom Security & Compliance' },
            ],
        },
    ],
  },
];

export default function BillingPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { userProfile } = useUserProfile();
  
  // In a real app, this would be fetched from the user's subscription data in Firestore.
  // For now, we'll mock it.
  const [currentPlan, setCurrentPlan] = useState({
      planId: 'starter', // Default to free plan
      status: 'Active',
      nextBillingDate: null,
      billingCycle: 'annually',
  });
  
  const handlePlanAction = (planId: string) => {
    if (planId === currentPlan.planId) return; // Do nothing if it's the current plan
    
    // In a real implementation, this would trigger the payment gateway flow.
    toast({
      title: "Billing System Under Construction",
      description: `The checkout process for the '${planId}' plan is not yet implemented.`,
    });
  };

  return (
    <div>
      <PageHeader
        title="Billing & Subscriptions"
        icon={CreditCard}
        description="Manage your subscription plan, view invoices, and update payment methods."
        action={
          <Button variant="outline" onClick={() => router.push('/settings')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Settings
          </Button>
        }
      />

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card className="shadow-lg h-full">
            <CardHeader>
              <CardTitle>Your Current Plan</CardTitle>
              <CardDescription>Details about your active subscription.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-primary/10 rounded-lg text-center">
                  <p className="text-sm text-primary font-semibold">You are on the</p>
                  <p className="text-3xl font-bold text-primary capitalize">{currentPlan.planId}</p>
                  <p className="text-sm text-primary">Plan</p>
                </div>
                <div className="text-sm space-y-2">
                  <div className="flex items-center gap-2">
                    <strong>Status:</strong> <Badge variant="default">{currentPlan.status}</Badge>
                  </div>
                  {currentPlan.nextBillingDate ? (
                     <div className="flex items-center gap-2"><strong>Next Billing Date:</strong> <span>{currentPlan.nextBillingDate}</span></div>
                  ) : (
                    <div>This is a free plan.</div>
                  )}
                </div>
                <Button variant="outline" className="w-full" disabled>
                  Manage Payment Method (Coming Soon)
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Available Plans</CardTitle>
              <CardDescription>Choose the plan that best fits your farm's needs. Upgrade at any time.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {pricingTiers.map((tier) => (
                <Card key={tier.id} className={cn("flex flex-col", currentPlan.planId === tier.id && "border-2 border-primary")}>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <tier.icon className={cn("h-6 w-6 shrink-0", tier.id === 'starter' ? 'text-green-600' : 'text-primary')} />
                                <div>
                                    <h4 className="font-semibold text-lg">{tier.name}</h4>
                                    <p className="text-xs text-muted-foreground">{tier.description}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-lg">{tier.price}</p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-grow space-y-4">
                        <Separator />
                        {tier.featureGroups.map(group => (
                            <div key={group.title}>
                                <h5 className="font-semibold text-sm mb-2">{group.title}</h5>
                                <ul className="space-y-2 text-sm text-muted-foreground">
                                    {group.features.map(feature => (
                                        <li key={feature.text} className="flex items-start">
                                            <Check className="h-4 w-4 mr-2 mt-0.5 text-green-600 shrink-0" />
                                            <span>{feature.text}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </CardContent>
                    <CardFooter>
                       <Button
                            onClick={() => handlePlanAction(tier.id)}
                            disabled={currentPlan.planId === tier.id}
                            variant={currentPlan.planId === tier.id ? 'secondary' : 'default'}
                            className="w-full"
                        >
                            {currentPlan.planId === tier.id ? 'Your Current Plan' : tier.id === 'enterprise' ? 'Contact Us' : 'Upgrade'}
                        </Button>
                    </CardFooter>
                </Card>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
