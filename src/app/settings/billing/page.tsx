
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

// This is a simplified version of the public pricing tiers for the billing page.
const pricingTiers = [
  { id: 'starter', name: 'Starter', icon: Check, price: 'Free', description: "For individual farmers or small teams getting started." },
  { id: 'grower', name: 'Grower', icon: Star, price: '₵210/mo', description: "For growing farms and teams needing more capabilities." },
  { id: 'business', name: 'Business', icon: Gem, price: '₵450/mo', description: "For established agribusinesses requiring advanced tools." },
  { id: 'enterprise', name: 'Enterprise', icon: Rocket, price: 'Custom', description: "Custom solutions for large-scale operations." },
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
                <div className="text-sm">
                  <p><strong>Status:</strong> <Badge variant="default">{currentPlan.status}</Badge></p>
                  {currentPlan.nextBillingDate ? (
                    <p><strong>Next Billing Date:</strong> {currentPlan.nextBillingDate}</p>
                  ) : (
                    <p>This is a free plan.</p>
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
                <div key={tier.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                     <tier.icon className={cn("h-6 w-6 shrink-0", tier.id === 'starter' ? 'text-green-600' : 'text-primary')} />
                    <div>
                      <h4 className="font-semibold">{tier.name}</h4>
                      <p className="text-xs text-muted-foreground">{tier.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{tier.price}</p>
                    <Button
                      size="sm"
                      onClick={() => handlePlanAction(tier.id)}
                      disabled={currentPlan.planId === tier.id}
                      variant={currentPlan.planId === tier.id ? 'secondary' : 'default'}
                    >
                      {currentPlan.planId === tier.id ? 'Current Plan' : tier.id === 'enterprise' ? 'Contact Us' : 'Upgrade'}
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
