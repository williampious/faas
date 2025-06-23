
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { MessageCircleQuestion, ArrowLeft } from 'lucide-react';
import Image from 'next/image';

export default function FaqPage() {
  const faqItems = [
    {
      question: "What is AgriFAAS Connect?",
      answer: "AgriFAAS Connect is a comprehensive farm management platform designed to simplify agricultural operations. It helps you log and manage everything from land preparation and planting to harvesting and sales. It also includes tools for task management, inventory, budgeting, AI-powered advice, and specialized features for Agric Extension Officers (AEOs)."
    },
    {
      question: "How do I register for an account?",
      answer: "You can register by clicking the 'Register' button on the homepage. Any new user who registers through this public page is automatically assigned an 'Admin' role, giving them full access to all features, including User Management."
    },
    {
      question: "How do I add my team members?",
      answer: "Once you are registered as an Admin, you can navigate to the 'Admin' section and use the 'User Management' dashboard. Click the 'Add New User' button to invite team members via a secure link. This allows you to assign specific roles (like Manager, Farmer, or Farm Staff) to them before they complete their registration."
    },
    {
      question: "Can I use AgriFAAS Connect on my mobile device?",
      answer: "Yes, AgriFAAS Connect is designed as a Progressive Web App (PWA). It's fully responsive and can be 'installed' on your smartphone or tablet's home screen for an app-like experience with offline access to cached assets."
    },
    {
      question: "How is my data stored and secured?",
      answer: "User profile data is stored securely in Firebase Firestore. Operational data logged within specific modules (like Land Prep, Planting, Tasks, Inventory) is currently stored in your browser's local storage. This allows for offline accessibility on the device you use to enter the data. We prioritize data security and use Firebase's robust infrastructure."
    },
    {
        question: "What if I forget my password?",
        answer: "The 'Forgot your password?' link on the Sign In page is a placeholder for a planned feature. Full password reset functionality will be implemented in a future update."
    },
    {
        question: "What do the AEO (Agric Extension Officer) tools do?",
        answer: "The AEO module provides specialized tools for extension officers. It includes a dedicated dashboard, a Farmer Directory to manage and view profiles of farmers in their region, and detailed profile views to track farmer-specific information, challenges, and needs."
    },
    {
        question: "How do I get AI Planting Advice?",
        answer: "Navigate to the 'AI Advice' section from your dashboard. You'll need to provide details about your farm's weather data, soil conditions, and the crop you intend to plant. The system will then generate tailored advice using Genkit."
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
            <MessageCircleQuestion className="mr-3 h-10 w-10" /> Frequently Asked Questions
          </h1>
          <p className="mt-3 text-lg sm:text-xl text-foreground/80 max-w-2xl mx-auto">
            Find quick answers to common questions about AgriFAAS Connect.
          </p>
        </header>

        <Card className="w-full max-w-3xl mx-auto shadow-xl mb-12">
          <CardHeader>
            <CardTitle className="text-2xl">Common Questions</CardTitle>
            <CardDescription>
              If you don't find your answer here, please visit our Help Center or contact support.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {faqItems.map((item, index) => (
                <AccordionItem value={`item-${index}`} key={index}>
                  <AccordionTrigger className="text-left hover:no-underline">
                    <span className="font-semibold text-primary/90">{item.question}</span>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground whitespace-pre-line">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        <div className="text-center">
            <p className="text-muted-foreground mb-4">Still have questions?</p>
            <Link href="/help" passHref>
                <Button variant="outline" className="mr-2">Visit our Help Center</Button>
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
