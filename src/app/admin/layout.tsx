
'use client';

import { useUserProfile } from '@/contexts/user-profile-context';
import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // For unauthorized message
import { AlertTriangle } from 'lucide-react';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { isAdmin, isLoading, user, error: profileError } = useUserProfile();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        // No user logged in, redirect to sign-in
        router.replace('/auth/signin?redirect=/admin/dashboard'); // Redirect back to admin after sign in
      } else if (!isAdmin) {
        // User is logged in but not an admin, redirect to dashboard
        router.replace('/dashboard');
      }
      // If user is logged in AND isAdmin is true, they can proceed.
    }
  }, [isAdmin, isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-10rem)] p-4 text-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-3 mt-4 text-lg text-muted-foreground">Verifying access rights...</p>
      </div>
    );
  }

  if (profileError) {
     return (
        <div className="container mx-auto py-10 flex justify-center">
            <Card className="w-full max-w-lg text-center shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center justify-center text-xl text-destructive">
                        <AlertTriangle className="mr-2 h-6 w-6" />
                        Access Error
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground mb-2">Could not verify your user profile due to an error:</p>
                    <p className="text-sm text-destructive bg-destructive/10 p-2 rounded-md">{profileError}</p>
                    <p className="mt-4 text-sm text-muted-foreground">Please try refreshing the page. If the issue persists, contact support.</p>
                </CardContent>
            </Card>
        </div>
     );
  }
  
  if (!user && !isLoading) { 
    // This state should be brief as useEffect will redirect.
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-10rem)] p-4 text-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-3 mt-4 text-lg text-muted-foreground">Redirecting to sign in...</p>
      </div>
    );
  }
  
  if (user && !isAdmin && !isLoading) {
    // User is logged in, not an admin, and not loading. Should be redirected by useEffect.
    // Display a more explicit unauthorized message.
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


  // If loading is false, user is present, and isAdmin is true
  return <>{children}</>;
}
