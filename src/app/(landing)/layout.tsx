
import type { Metadata } from 'next';
import '../globals.css'; 

export const metadata: Metadata = {
  title: 'Welcome to AgriFAAS Connect',
  description: 'Empowering Agriculture, Connecting Futures. Farm Management Simplified.',
};

export default function LandingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // This layout applies the gradient background and basic structure for the public-facing pages.
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-background to-green-50 dark:from-slate-900 dark:to-green-900/50 py-8 sm:py-12" suppressHydrationWarning={true}>
      {children}
    </div>
  );
}
