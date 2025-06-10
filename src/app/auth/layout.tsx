
import type { Metadata } from 'next';
import '../globals.css';

export const metadata: Metadata = {
  title: 'AgriFAAS Connect - Authentication',
  description: 'Sign in or Register for AgriFAAS Connect.',
};

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // This layout is now minimal. The root layout (src/app/layout.tsx) handles
  // <html>, <body>, UserProfileProvider etc.
  // This component will be rendered as children inside the root layout's structure
  // when the user is on an auth page and unauthenticated.
  // Specific styling for the auth pages (like gradients) should be handled
  // by the SignInPage/RegisterPage components themselves or a wrapper div here.
  return (
    <div 
      className="font-body antialiased flex items-center justify-center min-h-screen p-4" 
      suppressHydrationWarning={true}
    >
      {/* The background gradient is now applied by the individual auth page components */}
      {children}
    </div>
  );
}
