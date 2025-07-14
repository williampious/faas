
'use client';

import { Suspense, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CreditCard, Lock, CircleDollarSign, Loader2, Tag, CheckCircle } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { useUserProfile } from '@/contexts/user-profile-context';
import { initializePaystackTransaction, validatePromoCode } from './actions';
import { updateUserSubscription } from '../actions';
import { Input } from '@/components/ui/input';

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
  const [promoCode, setPromoCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [promoMessage, setPromoMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [isApplyingCode, setIsApplyingCode] = useState(false);

  const planId = searchParams.get('plan') as 'starter' | 'grower' | 'business' | 'enterprise' || 'starter';
  const cycle = searchParams.get('cycle') as 'monthly' | 'annually' || 'annually';

  const selectedPlan = pricingTiers.find(p => p.id === planId) || pricingTiers[0];
  const price = cycle === 'annually' ? selectedPlan.price.annually : selectedPlan.price.monthly;
  const finalPrice = Math.max(0, price - appliedDiscount);
  const billingCycleText = cycle === 'annually' ? 'Billed Annually' : 'Billed Monthly';
  const isFreeCheckout = finalPrice <= 0;
  
  const handleApplyPromoCode = async () => {
      if (!promoCode.trim()) {
          setPromoMessage({ type: 'error', text: 'Please enter a promotional code.' });
          return;
      }
      setIsApplyingCode(true);
      setPromoMessage(null);
      
      const result = await validatePromoCode(promoCode);

      if (result.success && result.discountAmount) {
          setAppliedDiscount(result.discountAmount);
          setPromoMessage({ type: 'success', text: result.message });
      } else {
          setAppliedDiscount(0);
          setPromoMessage({ type: 'error', text: result.message });
      }
      setIsApplyingCode(false);
  };

  const handleProceedToPayment = async () => {
    if (!userProfile) {
      toast({ title: "Error", description: "You must be logged in to proceed.", variant: "destructive" });
      return;
    }
    
    setIsProcessing(true);

    if (isFreeCheckout) {
        // Handle free activation directly
        const result = await updateUserSubscription(userProfile.userId, planId, cycle);
        if (result.success) {
            toast({ title: "Plan Activated!", description: "Your new plan is now active." });
            router.push('/dashboard');
            return; // <-- CRITICAL FIX: Stop execution here
        } else {
            toast({ title: "Activation Failed", description: result.message, variant: "destructive" });
            setIsProcessing(false);
            return; // Stop execution on failure as well
        }
    }
    
    // This code only runs if it's a paid checkout
    const amountInKobo = finalPrice * 100;
    const result = await initializePaystackTransaction(userProfile, amountInKobo, planId, cycle);
    if (result.success && result.data?.authorization_url) {
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
              <div className="space-y-2">
                <Label htmlFor="promo-code" className="flex items-center gap-2 text-sm text-muted-foreground"><Tag className="h-4 w-4" /> Have a code?</Label>
                <div className="flex gap-2">
                    <Input id="promo-code" placeholder="Enter code" value={promoCode} onChange={(e) => setPromoCode(e.target.value)} disabled={isApplyingCode}/>
                    <Button onClick={handleApplyPromoCode} disabled={isApplyingCode}>
                        {isApplyingCode && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Apply
                    </Button>
                </div>
                {promoMessage && (
                    <p className={`text-sm ${promoMessage.type === 'error' ? 'text-destructive' : 'text-green-600'}`}>
                        {promoMessage.text}
                    </p>
                )}
              </div>
              
              <Separator />

              {appliedDiscount > 0 && (
                <div className="flex justify-between items-center text-sm">
                  <span>Discount</span>
                  <span className="font-medium text-green-600">-{formatCurrency(appliedDiscount)}</span>
                </div>
              )}

              <div className="flex justify-between font-bold text-lg">
                <span>Total Due Today</span>
                <span>{formatCurrency(finalPrice)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
        <div>
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Payment Method</CardTitle>
              <CardDescription>{isFreeCheckout ? 'No payment required.' : 'Choose how you\'d like to pay.'}</CardDescription>
            </CardHeader>
            <CardContent>
              {!isFreeCheckout && (
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
              )}
              {isFreeCheckout && (
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="font-semibold text-green-700 dark:text-green-200">Your plan is free upon checkout. No payment is needed.</p>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex-col items-start gap-4">
               <Button size="lg" className="w-full" onClick={handleProceedToPayment} disabled={isProcessing}>
                  {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isFreeCheckout ? <CheckCircle className="mr-2 h-4 w-4" /> : <Lock className="mr-2 h-4 w-4" />}
                  {isProcessing ? 'Activating...' : isFreeCheckout ? 'Activate Your Plan' : `Pay ${formatCurrency(finalPrice)} via Paystack`}
               </Button>
               {!isFreeCheckout && (
                 <p className="text-xs text-muted-foreground text-center w-full">
                  You will be redirected to Paystack's secure payment page to complete your purchase.
                 </p>
               )}
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
