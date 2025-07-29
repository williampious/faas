
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { MessageCircleQuestion, ArrowLeft } from 'lucide-react';
import { LandingPageHeader } from '@/components/layout/landing-page-header';

export default function FaqPage() {
  const faqItems = [
    {
      question: "What is AgriFAAS Connect?",
      answer: "AgriFAAS Connect is a comprehensive, cloud-based management platform designed for modern agribusiness. It uses a multi-tenant architecture to provide secure, isolated workspaces (called tenants) for individual farms, cooperatives, or other agricultural organizations. It helps teams log and manage every aspect of their operation—from land preparation and planting to harvesting, sales, office administration, and HR."
    },
    {
      question: "How do I get an account?",
      answer: "You can sign up directly from our website. During the setup process, you will choose your role (e.g., as a Farm Admin, an Extension Officer, or a Cooperative Manager). All new accounts automatically receive a 20-day free trial of our full-featured Business Plan—no credit card required upfront."
    },
    {
      question: "What happens after my 20-day trial ends?",
      answer: "During your trial, you'll see a reminder banner. If your farm's Admin does not subscribe to a paid plan before the trial ends, your tenant account will be moved to our free 'Starter' plan. You'll retain access to your data and core features, but advanced modules and record limits will apply."
    },
    {
      question: "What are the limitations of the free 'Starter' plan?",
      answer: "The Starter plan is great for getting to know the app. It includes core features like the dashboard, task board, and calendar. However, it is limited to 1 farm plot and allows up to 5 records for each of the main operational modules (Land Prep, Planting, Maintenance, and Harvesting). Paid plans offer unlimited records and advanced modules like Animal Production and Office Management."
    },
    {
      question: "How is my data stored and secured?",
      answer: "Your organization's data is stored in its own isolated tenant workspace in Firebase Firestore. Access is controlled by multi-tenant security rules, ensuring that only authenticated members of your tenant can access your information. This means your farm's data is kept completely separate and secure from other farms on the platform."
    },
    {
      question: "Can I use AgriFAAS Connect on my mobile device?",
      answer: "Yes, AgriFAAS Connect is a Progressive Web App (PWA). It's fully responsive and can be 'installed' on your smartphone or tablet's home screen for an app-like experience. The app will also notify you when updates are available so you can reload to get the latest version."
    },
    {
        question: "What do the AEO (Agric Extension Officer) tools do?",
        answer: "The AEO module, available on the Business plan, provides a dedicated dashboard for extension officers. It allows AEOs to manage a directory of farmers, log support interactions, share knowledge articles, and generate reports on their activities within their assigned region."
    },
    {
        question: "How does User Management work for an Admin?",
        answer: "Users with the 'Admin' role have access to a User Management dashboard for their tenant (farm/co-op). From there, they can invite new users by generating a secure, one-time registration link, and manage roles for all users within their tenant. The number of users you can invite depends on your subscription plan."
    }
  ];

  return (
    <div className="container mx-auto px-4">
      <LandingPageHeader
        title="Frequently Asked Questions"
        description="Find quick answers to common questions about AgriFAAS Connect."
        icon={MessageCircleQuestion}
      />

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
          <Link href="/help">
              <Button variant="outline" className="mr-2">Visit our Help Center</Button>
          </Link>
           <Link href="/">
              <Button>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
              </Button>
          </Link>
      </div>
    </div>
  );
}
