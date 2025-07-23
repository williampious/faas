

'use client';

import { Suspense, useState, useRef, useEffect } from 'react';
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
import { createPayPalOrder, capturePayPalOrder } from './paypal_actions';
import { updateUserSubscription } from '../actions';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { PayPalScriptProvider, PayPalButtons, usePayPalScriptReducer, type OnApproveData, type OnApproveActions } from '@paypal/react-paypal-js';


// Data can be moved to a shared file later
const pricingTiers = [
  { id: 'starter', name: 'Starter', price: { monthly: 0, annually: 0 } },
  { id: 'grower', name: 'Grower', price: { monthly: 209, annually: 2099 } },
  { id: 'business', name: 'Business', price: { monthly: 449, annually: 4499 } },
  { id: 'enterprise', name: 'Enterprise', price: { monthly: 0, annually: 0 } },
];

function PayPalButtonWrapper({ finalPrice, planId, cycle }: { finalPrice: number, planId: string, cycle: string }) {
    const [{ isPending }] = usePayPalScriptReducer();
    const { toast } = useToast();
    const { userProfile } = useUserProfile();
    const router = useRouter();
    const [isProcessing, setIsProcessing] = useState(false);

    if (isPending) {
        return <div className="flex justify-center items-center h-20"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <PayPalButtons
            style={{ layout: "vertical", color: 'blue', shape: 'rect', label: 'pay' }}
            disabled={isProcessing}
            createOrder={async (data, actions) => {
                setIsProcessing(true);
                const amountInUSD = (finalPrice / 15).toFixed(2); // Example conversion
                const res = await createPayPalOrder(amountInUSD, planId, cycle);
                if (res.success && res.orderId) {
                    return res.orderId;
                } else {
                    toast({ title: "PayPal Error", description: res.message, variant: "destructive" });
                    setIsProcessing(false);
                    return '';
                }
            }}
            onApprove={async (data: OnApproveData, actions: OnApproveActions) => {
               if (!userProfile) return;
               const captureResult = await capturePayPalOrder(data.orderID);
               if (captureResult.success) {
                   const subResult = await updateUserSubscription(userProfile.userId, planId as any, cycle as any);
                   if (subResult.success) {
                       toast({ title: "Payment Successful!", description: "Your plan has been upgraded."});
                       router.push('/dashboard');
                   } else {
                       toast({ title: "Subscription Update Failed", description: subResult.message, variant: 'destructive'});
                   }
               } else {
                   toast({ title: "Payment Capture Failed", description: captureResult.message, variant: 'destructive'});
               }
               setIsProcessing(false);
            }}
            onError={(err) => {
                toast({ title: "PayPal Error", description: `An unexpected error occurred: ${err}`, variant: 'destructive' });
                setIsProcessing(false);
            }}
            onCancel={() => {
                setIsProcessing(false);
            }}
        />
    );
}

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
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'momo' | 'card' | 'paypal' | 'stripe'>('momo');

  const planId = searchParams.get('plan') as 'starter' | 'grower' | 'business' | 'enterprise' || 'starter';
  const cycle = searchParams.get('cycle') as 'monthly' | 'annually' || 'annually';

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

      const result = await initializePaystackTransaction(userInfo, amountInKobo, planId, cycle);
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
    const newPlanId = (isFullDiscount || appliedPercentage > 0) ? 'business' : planId;
    const newCycle = (isFullDiscount || appliedPercentage > 0) ? 'annually' : cycle;
    const result = await updateUserSubscription(userProfile.userId, newPlanId, newCycle);
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
    
    if (selectedPaymentMethod === 'momo' || selectedPaymentMethod === 'card') {
      await handlePaystackPayment();
    } else {
        toast({
            title: "Coming Soon",
            description: `Payment with ${selectedPaymentMethod.charAt(0).toUpperCase() + selectedPaymentMethod.slice(1)} is not yet available.`,
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
                  <p className="font-semibold text-lg capitalize">{isFullDiscount ? 'Business' : selectedPlan.name} Plan</p>
                  <p className="text-sm text-muted-foreground">{isFullDiscount ? 'Billed Annually (Free Year)' : billingCycleText}</p>
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
                <RadioGroup 
                  value={selectedPaymentMethod} 
                  onValueChange={(value) => setSelectedPaymentMethod(value as 'momo' | 'card' | 'paypal' | 'stripe')} 
                  className="space-y-3"
                >
                  <Label className={cn("flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-colors", selectedPaymentMethod === 'momo' ? "border-primary ring-2 ring-primary/50" : "hover:border-primary/50")}>
                    <RadioGroupItem value="momo" id="momo" />
                    <CircleDollarSign className="h-6 w-6 text-yellow-500" />
                    <span className="font-medium">Mobile Money</span>
                  </Label>
                  <Label className={cn("flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-colors", selectedPaymentMethod === 'card' ? "border-primary ring-2 ring-primary/50" : "hover:border-primary/50")}>
                    <RadioGroupItem value="card" id="card" />
                    <CreditCard className="h-6 w-6 text-blue-500" />
                    <span className="font-medium">Credit/Debit Card</span>
                  </Label>
                   <Label className={cn("flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-colors", selectedPaymentMethod === 'paypal' ? "border-primary ring-2 ring-primary/50" : "hover:border-primary/50")}>
                    <RadioGroupItem value="paypal" id="paypal" />
                     <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 fill-[#00457C]"><path d="M7.722 17.584c.323.018.631-.077.893-.243.633-.399 1.011-1.11 1.229-1.933.05-.192.083-.392.11-.598.159-1.229.096-2.5-.203-3.718-.219-.877-.577-1.693-1.045-2.422-.448-.693-.99-1.28-1.6-1.745-.631-.482-1.341-.796-2.09-.92-.097-.015-.195-.022-.293-.022H2.213C1.293 6 1 6.33 1 6.837c0 .416.03.627.09.832.062.208.156.463.273.75.295.72.675 1.402 1.132 2.015.488.653 1.056 1.22 1.688 1.68.706.517 1.488.89 2.321 1.096.313.076.633.127.954.153l-.001.001zm8.384-11.233c-.15-.002-.303.01-.453.036-.883.155-1.637.6-2.222 1.228-.582.625-.97 1.41-1.144 2.292-.128.65-.16 1.32-.1 1.98.05.57.215 1.12.474 1.63.264.52.628.97 1.065 1.32.44.35.952.59 1.499.7.545.11 1.104.1 1.65-.01.55-.11 1.08-.34 1.54-.66.45-.32.84-.73 1.14-1.2.3-.47.51-.99.62-1.54.11-.55.12-1.11.02-1.67-.1-.56-.3-1.1-.6-1.58-.3-.48-.69-.88-1.14-1.2-.45-.31-.96-.54-1.5-.66-.18-.04-.36-.06-.54-.06h-.01zm2.34 9.453c-.312.3-.68.53-1.085.68-.4.15-.82.21-1.24.18-.42-.03-.83-.15-1.21-.35-.38-.2-.72-.48-1-.83-.28-.34-.5-.73-.66-1.16-.16-.43-.25-.88-.26-1.34 0-.46.07-.91.22-1.34.15-.43.37-.84.66-1.2.29-.36.64-.67.04-.98l.6-.01c.32-.23.68-.4 1.06-.5.4-.1.8-.13 1.2-.08.4.05.78.18 1.14.38.36.2.68.46.95.78.27.32.48.69.62 1.08.14.4.22.8.23 1.21.01.4-.05.8-.18 1.18-.13.38-.33.74-.58 1.05z"/></svg>
                    <span className="font-medium">PayPal (USD)</span>
                  </Label>
                  <Label className={cn("flex items-center space-x-3 p-4 border rounded-lg cursor-not-allowed opacity-50", selectedPaymentMethod === 'stripe' ? "border-primary ring-2 ring-primary/50" : "")}>
                    <RadioGroupItem value="stripe" id="stripe" disabled />
                     <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 fill-[#635BFF]"><path d="M19.34.463c.427.26.68.746.643 1.252l-.337 2.13L15.352 12l4.294 8.155c.322.61.275 1.336-.125 1.895-.4.558-1.076.84-1.745.72l-15.37-2.69C1.134 20.02.136 18.96 0 17.72L.336 1.85C.373 1.343.627.858 1.054.598c.427-.26 1.01-.26 1.437 0l16.85 10.326L4.256 2.763c-.427-.26-1.01-.26-1.437 0C2.392 3.024 2.14 3.51 2.176 4.016l.247 1.564L17.447 12 2.423 18.42c-.322.61-.275 1.336.125 1.895.4.558 1.076.84 1.745.72l15.097-2.643L4.364 4.583z"/></svg>
                    <span className="font-medium">Stripe (Coming Soon)</span>
                  </Label>
                  
                </RadioGroup>
              ) : (
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="font-semibold text-green-700 dark:text-green-200">Your plan is free upon checkout. No payment is needed.</p>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex-col items-start gap-4">
               {selectedPaymentMethod === 'paypal' && !isFreeCheckout ? (
                    <PayPalButtonWrapper finalPrice={finalPrice} planId={planId} cycle={cycle} />
               ) : (
                    <Button size="lg" className="w-full" onClick={handleProceedToPayment} disabled={isProcessing}>
                        {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isFreeCheckout ? <CheckCircle className="mr-2 h-4 w-4" /> : <Lock className="mr-2 h-4 w-4" />}
                        {isProcessing ? 'Processing...' : isFreeCheckout ? 'Activate Your Plan' : `Pay ${formatCurrency(finalPrice)}`}
                    </Button>
               )}

               {!isFreeCheckout && (selectedPaymentMethod === 'momo' || selectedPaymentMethod === 'card') && (
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
  const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

  if (!PAYPAL_CLIENT_ID) {
    console.warn("PayPal Client ID not found. Disabling PayPal payment option.");
  }

  return (
    <Suspense fallback={<div>Loading checkout...</div>}>
      <PayPalScriptProvider options={{ clientId: PAYPAL_CLIENT_ID || "sb", components: "buttons", currency: 'USD' }}>
        <CheckoutPageContent />
      </PayPalScriptProvider>
    </Suspense>
  )
}
