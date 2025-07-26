

'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CreditCard, Lock, CircleDollarSign, Loader2, Tag, CheckCircle, AlertTriangle } from 'lucide-react';
import { Label } from '@/components/ui/label';
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
] as const;

type PlanId = typeof pricingTiers[number]['id'];
type BillingCycle = 'monthly' | 'annually';

function CheckoutPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { userProfile } = useUserProfile();

  const [isProcessing, setIsProcessing] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [appliedPercentage, setAppliedPercentage] = useState(0);
  const [isFullDiscount, setIsFullDiscount] = useState(false);
  const [promoMessage, setPromoMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [isApplyingCode, setIsApplyingCode] = useState(false);
  
  const planId = searchParams.get('plan') as PlanId || 'starter';
  const cycle = searchParams.get('cycle') as BillingCycle || 'annually';

  const selectedPlan = pricingTiers.find(p => p.id === planId) || pricingTiers[0];
  const price = cycle === 'annually' ? selectedPlan.price.annually : selectedPlan.price.monthly;

  // Calculate final price based on any applied discount
  const priceAfterPercentage = price * (1 - appliedPercentage / 100);
  const finalPrice = isFullDiscount ? 0 : Math.max(0, priceAfterPercentage - appliedDiscount);
  
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

      if (result.success) {
          setIsFullDiscount(result.isFullDiscount || false);
          setAppliedDiscount(result.discountAmount || 0);
          setAppliedPercentage(result.discountPercentage || 0);
          setPromoMessage({ type: 'success', text: result.message });
      } else {
          setIsFullDiscount(false);
          setAppliedDiscount(0);
          setAppliedPercentage(0);
          setPromoMessage({ type: 'error', text: result.message });
      }
      setIsApplyingCode(false);
  };

  const handlePaystackPayment = async () => {
      if (!userProfile) return;
      const amountInKobo = finalPrice * 100;

      const userInfo = {
        userId: userProfile.userId,
        email: userProfile.emailAddress || '',
        fullName: userProfile.fullName,
      };

      const result = await initializePaystackTransaction(userInfo, amountInKobo, planId, cycle, promoCode);
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
  
  const handleFreeCheckout = async () => {
    if (!userProfile) return;
    const result = await updateUserSubscription(userProfile.userId, planId, cycle);
    if (result.success) {
        toast({ title: "Plan Activated!", description: "Your new plan is now active." });
        router.push('/dashboard');
    } else {
        toast({ title: "Activation Failed", description: result.message, variant: "destructive" });
        setIsProcessing(false);
    }
  };

  const handleProceedToPayment = async () => {
    if (!userProfile) {
      toast({ title: "Error", description: "You must be logged in to proceed.", variant: "destructive" });
      return;
    }
    
    setIsProcessing(true);

    if (isFreeCheckout) {
        await handleFreeCheckout();
        return; 
    }
    
    await handlePaystackPayment();
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
                        {isApplyingCode && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Apply
                    </Button>
                </div>
                {promoMessage && (
                    <p className={`text-sm ${promoMessage.type === 'error' ? 'text-destructive' : 'text-green-600'}`}>
                        {promoMessage.text}
                    </p>
                )}
              </div>
              
              <Separator />

              {appliedPercentage > 0 && !isFullDiscount && (
                <div className="flex justify-between items-center text-sm">
                  <span>Promotional Discount ({appliedPercentage}%)</span>
                  <span className="font-medium text-green-600">-{formatCurrency(price * appliedPercentage / 100)}</span>
                </div>
              )}

              {appliedDiscount > 0 && !isFullDiscount && (
                <div className="flex justify-between items-center text-sm">
                  <span>Discount</span>
                  <span className="font-medium text-green-600">-{formatCurrency(appliedDiscount)}</span>
                </div>
              )}
               {isFullDiscount && (
                <div className="flex justify-between items-center text-sm">
                  <span>Promotional Discount</span>
                  <span className="font-medium text-green-600">-{formatCurrency(price)}</span>
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
              {!isFreeCheckout ? (
                <div className="space-y-3">
                  <p className="text-sm font-medium">Pay with Paystack:</p>
                  <div className="p-4 border rounded-lg bg-muted/20">
                     <div className="flex items-center space-x-3">
                        <CircleDollarSign className="h-6 w-6 text-yellow-500" />
                        <span className="font-medium">Mobile Money & Card</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="font-semibold text-green-700 dark:text-green-200">Your plan will be activated for free upon checkout.</p>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex-col items-start gap-4">
               <Button size="lg" className="w-full" onClick={handleProceedToPayment} disabled={isProcessing}>
                    {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isFreeCheckout ? <CheckCircle className="mr-2 h-4 w-4" /> : <Lock className="mr-2 h-4 w-4" />}
                    {isProcessing ? 'Processing...' : isFreeCheckout ? 'Activate Your Plan' : `Pay ${formatCurrency(finalPrice)}`}
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
    // The Suspense boundary is a good pattern for pages that rely on search params.
    return (
        <Suspense fallback={<div className="flex justify-center items-center h-screen"><Loader2 className="h-12 w-12 animate-spin text-primary"/></div>}>
            <CheckoutPageContent />
        </Suspense>
    )
}
