

'use client';

import './globals.css';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import {
  SidebarProvider,
  Sidebar,
  SidebarInset,
  SidebarHeader,
  SidebarFooter,
  SidebarContent,
  SidebarTrigger,
  SidebarRail
} from '@/components/ui/sidebar';
import { AppLogo } from '@/components/layout/app-logo';
import { MainNav } from '@/components/layout/main-nav';
import { Toaster } from "@/components/ui/toaster";
import { ToastAction } from "@/components/ui/toast";
import { Button } from '@/components/ui/button';
import { UserCircle, LogOut, Loader2, AlertTriangle, Sparkles } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { useToast } from "@/hooks/use-toast";
import { UserProfileProvider, useUserProfile } from '@/contexts/user-profile-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { differenceInDays, parseISO } from 'date-fns';

function TrialNotificationBanner() {
    const { userProfile } = useUserProfile();
    const router = useRouter();
    const [isVisible, setIsVisible] = useState(false);
    const [daysLeft, setDaysLeft] = useState(0);

    useEffect(() => {
        if (userProfile?.subscription?.status === 'Trialing' && userProfile.subscription.trialEnds) {
            const endDate = parseISO(userProfile.subscription.trialEnds);
            const today = new Date();
            const remainingDays = differenceInDays(endDate, today);
            
            if (remainingDays >= 0) {
                setDaysLeft(remainingDays);
                setIsVisible(true);
            }
        } else {
            setIsVisible(false);
        }
    }, [userProfile]);

    if (!isVisible) return null;

    const handleUpgrade = () => {
        const planId = userProfile?.subscription?.planId || 'grower'; // Default to grower if something is wrong
        const cycle = userProfile?.subscription?.billingCycle || 'annually';
        router.push(`/settings/billing/checkout?plan=${planId}&cycle=${cycle}`);
    };

    return (
        <div className="bg-yellow-100 dark:bg-yellow-900/30 border-b border-yellow-300 dark:border-yellow-700 p-2 text-center text-sm text-yellow-800 dark:text-yellow-200">
            <Sparkles className="inline-block h-4 w-4 mr-2" />
            You have **{daysLeft} {daysLeft === 1 ? 'day' : 'days'}** left in your trial. 
            <Button variant="link" className="p-0 h-auto ml-1 text-yellow-800 dark:text-yellow-200 font-bold" onClick={handleUpgrade}>
                Upgrade Now
            </Button> 
            to keep access to all features.
        </div>
    );
}

function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { toast } = useToast();
  
  const handleSignOut = async () => {
    if (!auth) {
      console.error('Firebase auth instance is not available. Cannot sign out.');
      toast({ title: "Sign Out Error", description: "Authentication service not available.", variant: "destructive" });
      return;
    }
    try {
      await signOut(auth);
      toast({ title: "Signed Out", description: "You have been successfully signed out." });
    } catch (error: any) {
      console.error('Error signing out:', error);
      toast({ title: "Sign Out Failed", description: error.message, variant: "destructive" });
    }
  };

  return (
    <SidebarProvider defaultOpen>
      <Sidebar collapsible="icon" className="border-r border-sidebar-border shadow-md">
        <SidebarRail />
        <SidebarHeader className="p-4 border-b border-sidebar-border">
          <AppLogo />
        </SidebarHeader>
        <SidebarContent className="p-2">
          <MainNav />
        </SidebarContent>
        <SidebarFooter className="p-4 mt-auto border-t border-sidebar-border space-y-2">
          <Link href="/profile" passHref>
             <Button variant="ghost" className="w-full justify-start group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:w-auto group-data-[collapsible=icon]:aspect-square">
              <UserCircle className="h-5 w-5 mr-2 group-data-[collapsible=icon]:mr-0" />
              <span className="truncate group-data-[collapsible=icon]:hidden">User Profile</span>
             </Button>
          </Link>
          <Button variant="ghost" className="w-full justify-start group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:w-auto group-data-[collapsible=icon]:aspect-square" onClick={handleSignOut}>
            <LogOut className="h-5 w-5 mr-2 group-data-[collapsible=icon]:mr-0" />
            <span className="truncate group-data-[collapsible=icon]:hidden">Sign Out</span>
          </Button>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <div className="flex flex-col h-full">
          <TrialNotificationBanner />
          <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background/95 px-4 backdrop-blur-sm md:px-6 md:justify-end">
            <div className="md:hidden">
              <SidebarTrigger />
            </div>
            <div className="hidden md:flex items-center gap-4">
              {/* <ThemeToggle /> /> */}
            </div>
          </header>
          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            {children}
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

function RootLayoutContent({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, userProfile, isLoading, error: profileError } = useUserProfile();
  const [isClient, setIsClient] = useState(false);
  const { toast } = useToast();

  const isPublicUnauthenticatedArea = [
    '/', '/faq', '/help', '/features', '/installation-guide', 
    '/pricing', '/partners', '/terms-of-service', '/privacy-policy', '/roles-permissions'
  ].includes(pathname);


  useEffect(() => {
    setIsClient(true);
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(reg => {
          console.log('[ServiceWorker] Registered successfully with scope: ', reg.scope);
        })
        .catch(error => {
          console.error('[ServiceWorker] Registration failed: ', error);
        });

      const handleControllerChange = () => {
        toast({
            title: "App Updated",
            description: "A new version of AgriFAAS Connect is available. Reload to apply the latest updates.",
            action: (
              <ToastAction altText="Reload" onClick={() => window.location.reload()}>
                Reload
              </ToastAction>
            ),
            duration: Infinity, // Keep the toast until user interacts
        });
      };
      
      navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

      return () => {
          navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
      };
    }
  }, [toast]);

  useEffect(() => {
    if (!isClient || isLoading) return; 

    const isAuthPage = pathname.startsWith('/auth/');
    const isSetupPage = pathname.startsWith('/setup');

    if (user) { // User is authenticated
      if (userProfile) { // Profile is loaded
        const isAEO = userProfile.role?.includes('Agric Extension Officer');
        const isSetUp = userProfile.farmId || isAEO;
        const userDashboardPath = isAEO ? '/aeo/dashboard' : '/dashboard';

        if (!isSetUp && !isSetupPage) {
          router.replace('/setup');
          return;
        }
        
        if (isSetUp) {
            if (isAuthPage || isSetupPage) {
                router.replace(userDashboardPath);
            }
        }

      }
    } else { // User is NOT authenticated
      if (!isAuthPage && !isPublicUnauthenticatedArea) {
        router.replace('/auth/signin');
      }
    }
  }, [user, userProfile, isLoading, pathname, router, isClient, isPublicUnauthenticatedArea]);


  if (!isClient || isLoading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen p-4 text-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg text-muted-foreground">Loading application...</p>
      </div>
    );
  }
  
  if (profileError && !pathname.startsWith('/auth/') && !isPublicUnauthenticatedArea && user) {
    const performSignOutFromErrorPage = async () => {
      if (!auth) {
        toast({ title: "Sign Out Error", description: "Firebase authentication service is not available.", variant: "destructive" });
        return;
      }
      try { await signOut(auth); toast({ title: "Signed Out" }); } 
      catch (error: any) { toast({ title: "Sign Out Failed", description: error.message, variant: "destructive" }); }
    };

    return (
      <div className="flex flex-col justify-center items-center min-h-screen p-4 text-center bg-background">
        <Card className="w-full max-w-lg shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center justify-center text-xl text-destructive"><AlertTriangle className="mr-2 h-6 w-6" /> Application Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-2">We encountered a problem loading your user profile:</p>
            <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-md mb-4">{profileError}</p>
            <p className="text-sm text-muted-foreground mb-4">Please try refreshing the page or signing out. If the problem persists, contact support.</p>
            <Button onClick={performSignOutFromErrorPage} variant="destructive"><LogOut className="mr-2 h-4 w-4" /> Sign Out</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isAuthPage = pathname.startsWith('/auth/');
  const isSetupPage = pathname.startsWith('/setup');
  
  // This logic determines whether to show the main app shell or the public/auth layouts.
  // We show the app shell ONLY if the user is logged in AND they are fully set up.
  const isSetUp = userProfile?.farmId || userProfile?.role?.includes('Agric Extension Officer');
  const showAppShell = user && isSetUp;

  if (showAppShell) {
      if(isAuthPage || isSetupPage || isPublicUnauthenticatedArea) {
          // This should be handled by the useEffect redirect, but as a fallback, show a loader.
           return (
              <div className="flex flex-col justify-center items-center min-h-screen p-4 text-center bg-background">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="mt-4 text-lg text-muted-foreground">Redirecting to your dashboard...</p>
              </div>
            );
      }
      return <AppShell>{children}</AppShell>;
  } else {
    // If not showing the app shell, render the children directly (e.g., for landing pages, auth, setup)
    return <>{children}</>;
  }
}


export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#8CC63F" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="AgriFAAS" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className="font-body antialiased" suppressHydrationWarning>
        <UserProfileProvider>
          <RootLayoutContent>{children}</RootLayoutContent>
          <Toaster />
        </UserProfileProvider>
      </body>
    </html>
  );
}
