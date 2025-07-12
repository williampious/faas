
'use client';

import { Suspense, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CreditCard, Lock, CircleDollarSign, Loader2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { useUserProfile } from '@/contexts/user-profile-context';
import { initializePaystackTransaction } from './actions';


// Data can be moved to a shared file later
const pricingTiers = [
  { id: 'starter', name: 'Starter', price: { monthly: 0, annually: 0 } },
  { id: 'grower', name: 'Grower', price: { monthly: 209, annually: 2099 } },
  { id: 'business', name: 'Business', price: { monthly: 449, annually: 4499 } },
  { id: 'enterprise', name: 'Enterprise', price: { monthly: 0, annually: 0 } },
];

function CheckoutPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { userProfile } = useUserProfile();

  const [isProcessing, setIsProcessing] = useState(false);

  const planId = searchParams.get('plan') as 'starter' | 'grower' | 'business' | 'enterprise' || 'starter';
  const cycle = searchParams.get('cycle') as 'monthly' | 'annually' || 'annually';

  const selectedPlan = pricingTiers.find(p => p.id === planId) || pricingTiers[0];
  const price = cycle === 'annually' ? selectedPlan.price.annually : selectedPlan.price.monthly;
  const billingCycleText = cycle === 'annually' ? 'Billed Annually' : 'Billed Monthly';
  
  const handleProceedToPayment = async () => {
    if (!userProfile) {
      toast({ title: "Error", description: "You must be logged in to make a payment.", variant: "destructive" });
      return;
    }
    
    setIsProcessing(true);
    
    const amountInKobo = price * 100; // Convert GHS to Kobo
    const result = await initializePaystackTransaction(userProfile, amountInKobo, planId, cycle);

    if (result.success && result.data?.authorization_url) {
        // Redirect the user to Paystack's page to complete payment
        router.push(result.data.authorization_url);
    } else {
        toast({
            title: "Payment Initialization Failed",
            description: result.message || "Could not start the payment process. Please try again.",
            variant: "destructive",
        });
        setIsProcessing(false);
    }
  };
  
  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS' }).format(amount);

  return (
    <div>
      <PageHeader
        title="Checkout"
        icon={CreditCard}
        description="Review your plan and select a payment method to complete your subscription."
        action={
          <Button variant="outline" onClick={() => router.push('/settings/billing')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Billing
          </Button>
        }
      />
      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center p-4 border rounded-lg bg-muted/30">
                <div>
                  <p className="font-semibold text-lg capitalize">{selectedPlan.name} Plan</p>
                  <p className="text-sm text-muted-foreground">{billingCycleText}</p>
                </div>
                <p className="font-bold text-2xl text-primary">{formatCurrency(price)}</p>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total Due Today</span>
                <span>{formatCurrency(price)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
        <div>
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Payment Method</CardTitle>
              <CardDescription>Choose how you'd like to pay.</CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup defaultValue="momo" className="space-y-3">
                <Label className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:border-primary has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:ring-2 has-[[data-state=checked]]:ring-primary/50">
                  <RadioGroupItem value="momo" id="momo" />
                   <CircleDollarSign className="h-6 w-6 text-yellow-500" />
                  <span className="font-medium">Mobile Money</span>
                </Label>
                <Label className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:border-primary has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:ring-2 has-[[data-state=checked]]:ring-primary/50">
                  <RadioGroupItem value="card" id="card" />
                  <CreditCard className="h-6 w-6 text-blue-500" />
                  <span className="font-medium">Credit/Debit Card</span>
                </Label>
              </RadioGroup>
            </CardContent>
            <CardFooter className="flex-col items-start gap-4">
               <Button size="lg" className="w-full" onClick={handleProceedToPayment} disabled={isProcessing}>
                  {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lock className="mr-2 h-4 w-4" />}
                  {isProcessing ? 'Initializing...' : 'Proceed to Paystack'}
               </Button>
               <p className="text-xs text-muted-foreground text-center w-full">
                You will be redirected to Paystack's secure payment page to complete your purchase.
               </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}


export default function CheckoutPage() {
  return (
    <Suspense fallback={<div>Loading checkout...</div>}>
      <CheckoutPageContent />
    </Suspense>
  )
}
