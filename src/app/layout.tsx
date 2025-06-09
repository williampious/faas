import type { Metadata } from 'next';
import './globals.css';
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
import { Button } from '@/components/ui/button'; // For potential future use
import { UserCircle } from 'lucide-react'; // Example for user icon

export const metadata: Metadata = {
  title: 'AgriFAAS Connect',
  description: 'Farm Management Simplified',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <SidebarProvider defaultOpen>
          <Sidebar collapsible="icon" className="border-r border-sidebar-border shadow-md">
            <SidebarRail />
            <SidebarHeader className="p-4 border-b border-sidebar-border">
              <AppLogo />
            </SidebarHeader>
            <SidebarContent className="p-2">
              <MainNav />
            </SidebarContent>
            <SidebarFooter className="p-4 mt-auto border-t border-sidebar-border">
              {/* Example User Profile Link/Button - Placeholder */}
               <Button variant="ghost" className="w-full justify-start group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:w-auto group-data-[collapsible=icon]:aspect-square">
                 <UserCircle className="h-5 w-5 mr-2 group-data-[collapsible=icon]:mr-0" />
                 <span className="truncate group-data-[collapsible=icon]:hidden">User Profile</span>
               </Button>
            </SidebarFooter>
          </Sidebar>
          <SidebarInset>
            <div className="flex flex-col h-full">
              <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background/95 px-4 backdrop-blur-sm md:px-6 md:justify-end">
                <div className="md:hidden">
                  <SidebarTrigger />
                </div>
                {/* Placeholder for potential global actions like search or theme toggle */}
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
      </body>
    </html>
  );
}
