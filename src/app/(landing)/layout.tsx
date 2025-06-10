
import type { Metadata } from 'next';
import '../globals.css'; // Adjusted path to globals.css

export const metadata: Metadata = {
  title: 'Welcome to AgriFAAS Connect',
  description: 'Empowering Agriculture, Connecting Futures. Farm Management Simplified.',
};

export default function LandingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="font-body antialiased" suppressHydrationWarning={true}>
      {children}
    </div>
  );
}
