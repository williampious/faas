
'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, AlertTriangle, ArrowLeft } from 'lucide-react';
import { useUserProfile } from '@/contexts/user-profile-context';
import { verifyPaystackTransaction } from './actions';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

function VerificationPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { userProfile } = useUserProfile();
  const { toast } = useToast();

  const [status, setStatus] = useState<'processing' | 'success' | 'failed'>('processing');
  const [message, setMessage] = useState('Verifying your payment, please wait...');

  useEffect(() => {
    const reference = searchParams.get('reference');

    if (!reference) {
      setStatus('failed');
      setMessage("Transaction reference is missing from the URL. Unable to verify payment.");
      return;
    }
    
    // We can show a processing state even before the user profile is loaded.
    const verifyPayment = async () => {
      const result = await verifyPaystackTransaction({ reference });

      if (result.success) {
        setStatus('success');
        setMessage(result.message);
        toast({
            title: "Payment Confirmed!",
            description: "Your subscription details will be updated shortly via our server."
        });
      } else {
        setStatus('failed');
        setMessage(result.message);
        toast({
            title: "Payment Verification Failed",
            description: result.message,
            variant: "destructive"
        });
      }
    };

    verifyPayment();
  }, [searchParams, toast]);

  return (
    <div>
      <PageHeader
        title="Payment Verification"
        icon={status === 'processing' ? Loader2 : status === 'success' ? CheckCircle : AlertTriangle}
        description="We are confirming your transaction with the payment provider."
      />
      <Card className="max-w-md mx-auto shadow-lg">
        <CardHeader className="text-center">
          {status === 'processing' && <Loader2 className="mx-auto h-12 w-12 text-primary animate-spin" />}
          {status === 'success' && <CheckCircle className="mx-auto h-12 w-12 text-green-500" />}
          {status === 'failed' && <AlertTriangle className="mx-auto h-12 w-12 text-destructive" />}
          <CardTitle className="mt-4">
            {status === 'processing' && "Processing Payment"}
            {status === 'success' && "Payment Successful!"}
            {status === 'failed' && "Verification Failed"}
          </CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
        <CardContent>
          {(status === 'success' || status === 'failed') && (
             <Link href="/settings/billing" className="w-full">
                <Button variant="outline" className="w-full">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Go to Billing Page
                </Button>
            </Link>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


export default function VerificationPage() {
    return (
        <Suspense fallback={<div>Loading verification...</div>}>
            <VerificationPageContent />
        </Suspense>
    )
}
