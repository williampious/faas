
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, DownloadCloud, Smartphone, Compass, Share, SquareArrowUp, PlusSquare, MonitorSmartphone } from 'lucide-react';
import Image from 'next/image';

// Mock Apple icon as lucide-react doesn't have it directly.
// In a real scenario, you might use a dedicated icon library or SVG.
const AppleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20.94c1.5 0 2.75 1.06 4 1.06 3 0 6-8 6-12.22A4.91 4.91 0 0 0 17 5c-2.22 0-4 1.44-5 2-1-.56-2.78-2-5-2a4.9 4.9 0 0 0-5 4.78C2 14 5 22 8 22c1.25 0 2.5-1.06 4-1.06Z"/>
    <path d="M10 2c1 .5 2 2 2 5"/>
  </svg>
);

// Mock Chrome icon
const ChromeIcon = () => (
 <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <circle cx="12" cy="12" r="4"/>
    <line x1="21.17" y1="8" x2="12" y2="8"/>
    <line x1="3.95" y1="6.06" x2="8.54" y2="14"/>
    <line x1="10.88" y1="21.94" x2="15.46" y2="14"/>
  </svg>
);


export default function InstallationGuidePage() {
  const installationSteps = [
    {
      platform: "Desktop (Chrome/Edge)",
      icon: MonitorSmartphone,
      steps: [
        "Open AgriFAAS Connect in your Chrome or Microsoft Edge browser.",
        "Look for an install icon in the address bar. It usually looks like a computer screen with a downward arrow, or a plus icon in a circle.",
        "Click the install icon.",
        "A prompt will appear. Click 'Install' or 'Add' to confirm.",
        "AgriFAAS Connect will be added to your desktop or applications list and can be launched like any other app."
      ]
    },
    {
      platform: "Android (Chrome)",
      icon: ChromeIcon,
      steps: [
        "Open AgriFAAS Connect in the Chrome browser on your Android device.",
        "Tap the three-dot menu icon (⋮) in the top-right corner of Chrome.",
        "From the menu, select 'Install app' or 'Add to Home screen'. The wording may vary slightly.",
        "Follow the on-screen prompts to confirm the installation.",
        "The AgriFAAS Connect icon will appear on your device's home screen."
      ]
    },
    {
      platform: "iOS (Safari)",
      icon: AppleIcon,
      steps: [
        "Open AgriFAAS Connect in the Safari browser on your iPhone or iPad.",
        "Tap the 'Share' icon at the bottom of the screen (it looks like a square with an arrow pointing upwards).",
        "In the Share Sheet, scroll down and tap on 'Add to Home Screen'.",
        "You can customize the name for the app icon if you wish.",
        "Tap 'Add' in the top-right corner.",
        "The AgriFAAS Connect icon will appear on your device's home screen."
      ]
    }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-background to-green-50 dark:from-slate-900 dark:to-green-900/50 py-8 sm:py-12">
      <div className="container mx-auto px-4">
        <header className="mb-10 text-center">
          <Link href="/" className="inline-block mb-4">
            <Image
              src="/agrifaas-logo.png"
              alt="AgriFAAS Connect Logo"
              width={200}
              height={67}
              objectFit="contain"
            />
          </Link>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-primary font-headline flex items-center justify-center">
            <DownloadCloud className="mr-3 h-10 w-10" /> Installing AgriFAAS Connect
          </h1>
          <p className="mt-3 text-lg sm:text-xl text-foreground/80 max-w-2xl mx-auto">
            Follow these simple steps to install AgriFAAS Connect on your device for easy access.
          </p>
        </header>

        <div className="space-y-8">
          {installationSteps.map((section, index) => (
            <Card key={index} className="w-full max-w-3xl mx-auto shadow-xl">
              <CardHeader className="bg-primary/5">
                <CardTitle className="text-2xl text-primary flex items-center">
                  <section.icon className="mr-3 h-7 w-7" />
                  Install on {section.platform}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <ol className="list-decimal list-outside space-y-3 pl-5 text-muted-foreground">
                  {section.steps.map((step, stepIndex) => (
                    <li key={stepIndex} className="pl-2">{step}</li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="text-center mt-12">
            <p className="text-muted-foreground mb-2">Having trouble?</p>
            <p className="text-sm text-muted-foreground mb-4 max-w-xl mx-auto">
              Ensure your browser is up-to-date. PWA installation features are standard in modern versions of Chrome, Edge, and Safari.
              The availability of the 'Install' option can sometimes depend on how frequently you visit the site or specific browser criteria.
            </p>
            <Link href="/help" passHref>
                <Button variant="outline" className="mr-2">Visit Help Center</Button>
            </Link>
             <Link href="/" passHref>
                <Button>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
                </Button>
            </Link>
        </div>
      </div>
    </div>
  );
}

