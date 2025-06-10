
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
  // This layout is now minimal. The root layout (src/app/layout.tsx) handles
  // <html>, <body>, UserProfileProvider etc.
  // This component will be rendered as children inside the root layout's structure
  // when the user is on the landing page and unauthenticated.
  // Specific styling for the landing page body (like gradients) should be handled
  // by the LandingPage component itself or a wrapper div here.
  return (
    <div className="font-body antialiased" suppressHydrationWarning={true}>
      {children}
    </div>
  );
}
