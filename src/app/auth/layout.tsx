
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
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased bg-gradient-to-br from-background to-green-50 flex items-center justify-center min-h-screen p-4" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
