
'use client';

import { useUserProfile } from '@/contexts/user-profile-context';
import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

export default function AeoLayout({ children }: { children: ReactNode }) {
  const { userProfile, isLoading, user } = useUserProfile();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!user) {
      router.replace('/auth/signin?redirect=/aeo/dashboard');
      return;
    }
    
    if (userProfile) {
        const hasAccess = userProfile.role?.includes('Agric Extension Officer') || userProfile.role?.includes('Admin');
        if (!hasAccess) {
            router.replace('/dashboard');
        }
    }
  }, [user, userProfile, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-10rem)] p-4 text-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-3 mt-4 text-lg text-muted-foreground">Verifying AEO access rights...</p>
      </div>
    );
  }

  const hasAccess = userProfile?.role?.includes('Agric Extension Officer') || userProfile?.role?.includes('Admin');

  if (user && !hasAccess && !isLoading) {
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
            <p className="text-lg text-muted-foreground">You do not have permission to view this AEO page.</p>
            <p className="mt-2 text-sm text-muted-foreground">Redirecting to your dashboard...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
