
'use client'; 

import './globals.css';
import Link from 'next/link';
import { useRouter } from 'next/navigation'; 
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
import { UserCircle, LogOut } from 'lucide-react'; 
import { auth } from '@/lib/firebase'; 
import { signOut } from 'firebase/auth'; 
import { useToast } from "@/hooks/use-toast";
import { UserProfileProvider } from '@/contexts/user-profile-context';


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const { toast } = useToast(); 

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
      router.push('/'); 
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
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased" suppressHydrationWarning>
        <UserProfileProvider>
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
          <Toaster />
        </UserProfileProvider>
      </body>
    </html>
  );
}
