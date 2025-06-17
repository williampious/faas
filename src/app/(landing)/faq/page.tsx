
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ArrowLeft, HelpCircle, MessageCircleQuestion } from 'lucide-react';
import Image from 'next/image';

export default function FaqPage() {
  const faqItems = [
    {
      question: "What is AgriFAAS Connect?",
      answer: "AgriFAAS Connect is a comprehensive farm management platform designed to simplify agricultural operations, from planning and planting to harvesting and marketing. It leverages AI and data to help users make smarter decisions and boost productivity."
    },
    {
      question: "How do I register for an account?",
      answer: "You can register by clicking the 'Register' button on the homepage and filling out the required information. The first user to register will automatically be assigned an 'Admin' role."
    },
    {
      question: "Can I use AgriFAAS Connect on my mobile device?",
      answer: "Yes, AgriFAAS Connect is designed to be responsive and accessible on various devices, including smartphones and tablets. We also offer PWA (Progressive Web App) features for an app-like experience on mobile."
    },
    {
      question: "How is my data stored and secured?",
      answer: "User profile data is stored securely in Firebase Firestore. Operational data logged within specific modules (like Land Prep, Planting, Tasks, Calendar) is currently stored in your browser's local storage for offline accessibility. We prioritize data security and use Firebase's robust infrastructure."
    },
    {
      question: "What if I forget my password?",
      answer: "You can use the 'Forgot your password?' link on the Sign In page to initiate a password reset process. Instructions will be sent to your registered email address."
    },
    {
        question: "How do I get AI Planting Advice?",
        answer: "Navigate to the 'AI Advice' section from your dashboard. You'll need to provide details about your farm's weather data, soil conditions, and the crop you intend to plant. The system will then generate tailored advice."
    },
    {
        question: "Who can see my farm data?",
        answer: "Your specific farm data is private to your account. If you are part of an organization or group within AgriFAAS Connect (a feature planned for the future), data sharing might be configured based on roles and permissions set by your administrator."
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
