
'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CreditCard, Check, Star, Gem, Rocket, Mail, CircleDollarSign } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useUserProfile } from '@/contexts/user-profile-context';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import type { SubscriptionDetails } from '@/types/user';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';


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

export default function BillingPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { userProfile, isLoading: isProfileLoading } = useUserProfile();
  
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [selectedPlanForCheckout, setSelectedPlanForCheckout] = useState<PricingTier | null>(null);

  const [currentPlan, setCurrentPlan] = useState<SubscriptionDetails>({
      planId: 'starter',
      status: 'Active',
      nextBillingDate: null,
      billingCycle: 'annually',
  });

  useEffect(() => {
    // When the user profile loads, update the current plan state
    if (userProfile && userProfile.subscription) {
        setCurrentPlan(userProfile.subscription);
    }
  }, [userProfile]);
  
  const handlePlanAction = (plan: PricingTier) => {
    if (plan.id === currentPlan.planId) return;

    if (plan.isEnterprise) {
        router.push('/#contact-us');
        return;
    }
    
    setSelectedPlanForCheckout(plan);
    setIsCheckoutModalOpen(true);
  };
  
  const handleProceedToPayment = () => {
    toast({
      title: "Payment Gateway Not Implemented",
      description: "This is where the app would redirect to a secure payment processor like Paystack or Stripe.",
      variant: "default",
    });
  };

  const getButtonText = (planId: string, isEnterprise?: boolean) => {
    if (planId === currentPlan.planId) return 'Your Current Plan';
    if (isEnterprise) return 'Contact Us';
    return 'Upgrade';
  }

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);


  // Handle case where profile is still loading
  if (isProfileLoading) {
    return (
        <div>
            <PageHeader
                title="Billing & Subscriptions"
                icon={CreditCard}
                description="Loading your subscription details..."
            />
        </div>
    );
  }

  const currentPlanDetails = pricingTiers.find(p => p.id === currentPlan.planId) || pricingTiers[0];

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
      
      <Dialog open={isCheckoutModalOpen} onOpenChange={setIsCheckoutModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Your Plan Upgrade</DialogTitle>
            <DialogDescription>
              Review your selection before proceeding to payment.
            </DialogDescription>
          </DialogHeader>
          {selectedPlanForCheckout && (
            <div className="py-4 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="capitalize">{selectedPlanForCheckout.name} Plan</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{formatCurrency(selectedPlanForCheckout.price.annually)} <span className="text-sm font-normal text-muted-foreground">/ year</span></p>
                  <p className="text-sm text-muted-foreground">(Billed annually. Equivalent to {formatCurrency(selectedPlanForCheckout.price.monthly)}/month)</p>
                </CardContent>
              </Card>

              <RadioGroup defaultValue="momo" className="space-y-2">
                <Label className="font-semibold">Select Payment Method</Label>
                <div className="flex items-center space-x-2 p-3 border rounded-md">
                  <RadioGroupItem value="momo" id="momo" />
                  <Label htmlFor="momo" className="flex items-center gap-2 font-normal">
                    <CircleDollarSign className="h-5 w-5 text-yellow-500" />
                    Mobile Money (MTN, Vodafone, AirtelTigo)
                  </Label>
                </div>
                 <div className="flex items-center space-x-2 p-3 border rounded-md">
                  <RadioGroupItem value="card" id="card" />
                  <Label htmlFor="card" className="flex items-center gap-2 font-normal">
                    <CreditCard className="h-5 w-5 text-blue-500" />
                    Credit/Debit Card
                  </Label>
                </div>
              </RadioGroup>
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button onClick={handleProceedToPayment} disabled>
              Proceed to Payment (Coming Soon)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
