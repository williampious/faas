
'use client';

import { useUserProfile } from '@/contexts/user-profile-context';
import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { Loader2, AlertTriangle, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function OfficeManagementLayout({ children }: { children: ReactNode }) {
  const { user, userProfile, isLoading, access } = useUserProfile();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace('/auth/signin?redirect=/office-management/dashboard');
      return;
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-10rem)] p-4 text-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-3 mt-4 text-lg text-muted-foreground">Verifying office management access...</p>
      </div>
    );
  }
  
  if (!userProfile) {
    return (
        <div className="container mx-auto py-10 flex justify-center">
          <Card className="w-full max-w-lg text-center shadow-lg">
            <CardHeader><CardTitle className="flex items-center justify-center text-xl text-destructive"><AlertTriangle className="mr-2 h-6 w-6" /> Profile Error</CardTitle></CardHeader>
            <CardContent><p className="text-lg text-muted-foreground">Could not load your user profile.</p></CardContent>
          </Card>
        </div>
    );
  }
  
  if (!access.canAccessOfficeOps) {
    const plan = userProfile.farmProfile?.subscription?.planId || 'starter';
    return (
      <div className="container mx-auto py-10 flex justify-center">
        <Card className="w-full max-w-lg text-center shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center justify-center text-xl text-primary">
                <Sparkles className="mr-2 h-6 w-6" />
                Upgrade to Access This Feature
            </CardTitle>
             <CardDescription>
                The Office Management module is available on the Business plan and higher.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Your current plan is <span className="font-semibold capitalize text-primary">{plan}</span>. Please upgrade your subscription to unlock this and other advanced features for managing your office operations.
            </p>
            <Link href="/settings/billing">
                <Button>Upgrade Your Plan</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If all checks pass, render the children
  return <>{children}</>;
}
