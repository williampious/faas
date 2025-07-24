
'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CreditCard, Check, Star, Gem, Rocket, Mail, Loader2, Tag, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useUserProfile } from '@/contexts/user-profile-context';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import type { SubscriptionDetails } from '@/types/user';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { validatePromoCode } from './checkout/actions';
import { format, parseISO, differenceInDays } from 'date-fns';
import Link from 'next/link';


interface TierFeature {
  text: string;
}

interface FeatureGroup {
    title: string;
    features: TierFeature[];
}

interface PricingTier {
  id: 'starter' | 'grower' | 'business' | 'enterprise';
  name: string;
  icon: React.ElementType;
  price: { monthly: number; annually: number };
  description: string;
  featureGroups: FeatureGroup[];
  isEnterprise?: boolean; 
}


const pricingTiers: PricingTier[] = [
  { 
    id: 'starter', 
    name: 'Starter', 
    icon: Check, 
    price: { monthly: 0, annually: 0 }, 
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
    price: { monthly: 209, annually: 2099 }, 
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
    price: { monthly: 449, annually: 4499 }, 
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
    price: { monthly: 0, annually: 0 }, 
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
    isEnterprise: true,
  },
];

function PromoCodeCard() {
    const { toast } = useToast();
    const [promoCode, setPromoCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleApplyCode = async () => {
        if (!promoCode.trim()) {
            toast({ title: 'Error', description: 'Please enter a promotional code.', variant: 'destructive' });
            return;
        }
        setIsLoading(true);
        const result = await validatePromoCode(promoCode);
        if (result.success) {
            toast({ title: 'Success!', description: result.message });
        } else {
            toast({ title: 'Invalid Code', description: result.message, variant: 'destructive' });
        }
        setIsLoading(false);
    };

    return (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="flex items-center"><Tag className="mr-2 h-5 w-5 text-primary" /> Apply Promotional Code</CardTitle>
            </CardHeader>
            <CardContent>
                <CardDescription className="mb-4">
                    Have a promo code? Apply it here to add a discount to your next bill.
                </CardDescription>
                <div className="flex gap-2">
                    <Input 
                        placeholder="Enter your code" 
                        value={promoCode} 
                        onChange={(e) => setPromoCode(e.target.value)}
                        disabled={isLoading}
                    />
                    <Button onClick={handleApplyCode} disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Apply
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

function TrialStatusCard({ trialEnds }: { trialEnds: string | null }) {
    if (!trialEnds) return null;

    const endDate = parseISO(trialEnds);
    const today = new Date();
    const daysLeft = differenceInDays(endDate, today);

    if (daysLeft < 0) return null; // Trial has ended

    return (
        <Card className="shadow-lg bg-yellow-50 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700">
            <CardHeader>
                <CardTitle className="flex items-center text-yellow-800 dark:text-yellow-200">
                    <Sparkles className="mr-2 h-5 w-5" /> Trial Period Active
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-lg font-bold text-yellow-900 dark:text-yellow-100">
                    {daysLeft} {daysLeft === 1 ? 'day' : 'days'} left
                </p>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                    Your free trial of the Business plan ends on {format(endDate, 'PP')}.
                </p>
            </CardContent>
        </Card>
    );
}

export default function BillingPage() {
  const router = useRouter();
  const { userProfile, isLoading: isProfileLoading } = useUserProfile();
  
  const currentPlan: SubscriptionDetails = userProfile?.subscription || {
    planId: 'starter',
    status: 'Active',
    billingCycle: 'annually',
    trialEnds: null,
    nextBillingDate: null
  };
  
  const handlePlanAction = (plan: PricingTier) => {
    if (plan.id === currentPlan?.planId) return;

    if (plan.isEnterprise) {
        router.push('/#contact-us');
        return;
    }
    
    const cycle = currentPlan?.billingCycle || 'annually';
    router.push(`/settings/billing/checkout?plan=${plan.id}&cycle=${cycle}`);
  };

  const getButtonText = (planId: string, isEnterprise?: boolean) => {
    if (currentPlan && planId === currentPlan.planId) return 'Your Current Plan';
    if (isEnterprise) return 'Contact Us';
    return 'Upgrade';
  }

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);

  if (isProfileLoading || !userProfile) {
    return (
        <div>
            <PageHeader
                title="Billing & Subscriptions"
                icon={CreditCard}
                description="Loading your subscription details..."
            />
            <div className="flex justify-center items-center py-20">
              <Loader2 className="h-12 w-12 text-primary animate-spin" />
            </div>
        </div>
    );
  }

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

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
            <Card className="shadow-lg h-full">
                <CardHeader>
                <CardTitle>Your Current Plan</CardTitle>
                <CardDescription>Details about your active subscription.</CardDescription>
                </CardHeader>
                <CardContent>
                <div className="space-y-4">
                    <div className="p-4 bg-primary/10 rounded-lg text-center">
                    <div className="text-sm text-primary font-semibold">You are on the</div>
                    <div className="text-3xl font-bold text-primary capitalize">{currentPlan.planId}</div>
                    <div className="text-sm text-primary">Plan</div>
                    </div>
                    <div className="text-sm space-y-2">
                    <div className="flex items-center gap-2">
                        <strong>Status:</strong> <Badge variant="default">{currentPlan.status}</Badge>
                    </div>
                    {currentPlan.nextBillingDate ? (
                        <div className="flex items-center gap-2"><strong>Next Billing Date:</strong> <span>{currentPlan.nextBillingDate}</span></div>
                    ) : currentPlan.planId !== 'starter' ? null : (
                        <div>This is a free plan.</div>
                    )}
                    </div>
                    <Button variant="outline" className="w-full" disabled>
                    Manage Payment Method (Coming Soon)
                    </Button>
                </div>
                </CardContent>
            </Card>
            {currentPlan.status === 'Trialing' && <TrialStatusCard trialEnds={currentPlan.trialEnds} />}
            <PromoCodeCard />
        </div>

        <div className="lg:col-span-2">
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
                                    <div className="text-xs text-muted-foreground">{tier.description}</div>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-lg">{tier.isEnterprise ? 'Custom' : `${formatCurrency(tier.price.monthly)}/mo`}</p>
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
                            onClick={() => handlePlanAction(tier)}
                            disabled={currentPlan.planId === tier.id}
                            variant={currentPlan.planId === tier.id ? 'secondary' : 'default'}
                            className="w-full"
                        >
                           {getButtonText(tier.id, tier.isEnterprise)}
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
