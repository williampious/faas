
'use client';

import { useUserProfile } from '@/contexts/user-profile-context';
import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function OfficeManagementLayout({ children }: { children: ReactNode }) {
  const { userProfile, isLoading, user } = useUserProfile();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) {
      return; // Wait until loading is complete
    }

    if (!user) {
      // Not logged in, redirect to sign-in
      router.replace('/auth/signin?redirect=/office-management/dashboard');
      return;
    }
    
    // User is logged in, and loading is done. Now check profile and roles.
    if (userProfile) {
      const hasAccess = userProfile.role?.some(role => 
        ['Admin', 'OfficeManager', 'FinanceManager'].includes(role)
      ) || false;

      if (!hasAccess) {
        // Profile loaded, but user lacks required role
        router.replace('/dashboard');
      }
      // User has access, so do nothing and let the page render.
    }
    
    // If userProfile is still null here, the root layout's error handler will take over.
  }, [user, userProfile, isLoading, router]);

  // The loading state is important to prevent premature rendering of children or unauthorized message
  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-10rem)] p-4 text-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-3 mt-4 text-lg text-muted-foreground">Verifying office management access...</p>
      </div>
    );
  }
  
  const hasAccess = userProfile?.role?.some(role => 
    ['Admin', 'OfficeManager', 'FinanceManager'].includes(role)
  ) || false;

  // If the user is logged in but doesn't have access, show unauthorized message
  // This might flash for a frame before useEffect redirects, which is acceptable.
  if (user && !hasAccess) {
    return (
      <div className="container mx-auto py-10 flex justify-center">
        <Card className="w-full max-w-lg text-center shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center justify-center text-xl text-destructive">
                <AlertTriangle className="mr-2 h-6 w-6" />
                Unauthorized Access
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg text-muted-foreground">You do not have permission to view this page.</p>
            <p className="mt-2 text-sm text-muted-foreground">Redirecting to your dashboard...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If all checks pass, render the children
  return <>{children}</>;
}
