
import type { Metadata } from 'next';
import '../globals.css'; // Adjusted path

export const metadata: Metadata = {
  title: 'AgriFAAS Connect - Authentication',
  description: 'Sign in or Register for AgriFAAS Connect.',
};

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div 
      className="font-body antialiased bg-gradient-to-br from-background to-green-50 flex items-center justify-center min-h-screen p-4" 
      suppressHydrationWarning={true}
    >
      {children}
    </div>
  );
}
