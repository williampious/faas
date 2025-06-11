
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
import { Button } from '@/components/ui/button';
import { UserCircle, LogOut, Loader2, AlertTriangle } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { useToast } from "@/hooks/use-toast";
import { UserProfileProvider, useUserProfile } from '@/contexts/user-profile-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { toast } = useToast();
  // userProfile can be used here for displaying name/avatar if needed in header
  // const { userProfile } = useUserProfile(); 

  const handleSignOut = async () => {
    if (!auth) {
      console.error(
        'Firebase auth instance is not available in layout.tsx. Cannot sign out. Check browser console for errors from src/lib/firebase.ts regarding Firebase initialization.'
      );
      toast({
        title: "Sign Out Error",
        description: "Firebase authentication service is not available. Please ensure Firebase is correctly configured and try again. If the issue persists, contact support.",
        variant: "destructive",
      });
      return;
    }
    try {
      await signOut(auth);
      toast({
        title: "Signed Out",
        description: "You have been successfully signed out.",
      });
      // router.push('/auth/signin'); // UserProfileProvider will detect auth change and RootLayoutContent will redirect
    } catch (error: any) {
      console.error('Error signing out:', error);
      toast({
        title: "Sign Out Failed",
        description: error.message || "An unexpected error occurred during sign out.",
        variant: "destructive",
      });
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
             <Button
                variant="ghost"
                className="w-full justify-start group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:w-auto group-data-[collapsible=icon]:aspect-square"
              >
              <UserCircle className="h-5 w-5 mr-2 group-data-[collapsible=icon]:mr-0" />
              <span className="truncate group-data-[collapsible=icon]:hidden">User Profile</span>
             </Button>
          </Link>
          <Button
            variant="ghost"
            className="w-full justify-start group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:w-auto group-data-[collapsible=icon]:aspect-square"
            onClick={handleSignOut}
          >
            <LogOut className="h-5 w-5 mr-2 group-data-[collapsible=icon]:mr-0" />
            <span className="truncate group-data-[collapsible=icon]:hidden">Sign Out</span>
          </Button>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <div className="flex flex-col h-full">
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
  const { user, isLoading, error: profileError } = useUserProfile();
  const [isClient, setIsClient] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || isLoading) return; 

    const isAuthPage = pathname.startsWith('/auth/');
    const isLandingPage = pathname === '/';

    if (user) { 
      if (isLandingPage || isAuthPage) {
        router.replace('/dashboard');
      }
    } else { 
      if (!isLandingPage && !isAuthPage) {
        router.replace('/auth/signin');
      }
    }
  }, [user, isLoading, pathname, router, isClient]);

  if (!isClient || isLoading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen p-4 text-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg text-muted-foreground">Loading application...</p>
      </div>
    );
  }
  
  if (profileError && !pathname.startsWith('/auth/') && pathname !== '/') {
    console.error("UserProfileContext error in RootLayout:", profileError);
    
    const performSignOutFromErrorPage = async () => {
      if (!auth) {
        console.error('Firebase auth instance is not available for sign out from error page.');
        toast({
          title: "Sign Out Error",
          description: "Firebase authentication service is not available.",
          variant: "destructive",
        });
        return;
      }
      try {
        await signOut(auth);
        toast({
          title: "Signed Out",
          description: "You have been successfully signed out.",
        });
        // Redirection will be handled by UserProfileProvider auth state change
      } catch (error: any) {
        console.error('Error signing out from error page:', error);
        toast({
          title: "Sign Out Failed",
          description: error.message || "An unexpected error occurred during sign out.",
          variant: "destructive",
        });
      }
    };

    return (
      <div className="flex flex-col justify-center items-center min-h-screen p-4 text-center bg-background">
        <Card className="w-full max-w-lg shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center justify-center text-xl text-destructive">
              <AlertTriangle className="mr-2 h-6 w-6" />
              Application Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-2">
              We encountered a problem loading your user profile:
            </p>
            <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-md mb-4">
              {profileError}
            </p>
            <p className="text-sm text-muted-foreground mb-1">
              This might be a temporary issue. You can try:
            </p>
            <ul className="list-disc list-inside text-sm text-muted-foreground mb-4 text-left mx-auto max-w-xs">
              <li>Refreshing the page.</li>
              <li>Signing out and signing back in.</li>
            </ul>
            <p className="text-sm text-muted-foreground mb-4">
              If the problem persists, please contact support.
            </p>
            <Button onClick={performSignOutFromErrorPage} variant="destructive">
              <LogOut className="mr-2 h-4 w-4" /> Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }


  const isAppRoute = !pathname.startsWith('/auth/') && pathname !== '/';

  if (user && isAppRoute) {
    return <AppShell>{children}</AppShell>;
  } else if (!user && (pathname.startsWith('/auth/') || pathname === '/')) {
    return <>{children}</>;
  } else if (!user && isAppRoute) {
    return (
        <div className="flex flex-col justify-center items-center min-h-screen p-4 text-center bg-background">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="mt-4 text-lg text-muted-foreground">Redirecting...</p>
        </div>
    );
  } else if (user && (pathname.startsWith('/auth/') || pathname === '/')) {
     return (
        <div className="flex flex-col justify-center items-center min-h-screen p-4 text-center bg-background">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="mt-4 text-lg text-muted-foreground">Redirecting to dashboard...</p>
        </div>
    );
  }

  return <>{children}</>;
}


export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet" />
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
