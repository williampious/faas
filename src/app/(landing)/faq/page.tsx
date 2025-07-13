
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
      answer: "AgriFAAS Connect is a comprehensive, cloud-based farm management platform designed for collaboration. It helps you and your team log and manage every aspect of your operation—from land preparation and planting to harvesting and sales. It features real-time data synchronization, robust user management with specific roles, task management, inventory, budgeting, AI-powered advice, and specialized tools for Agric Extension Officers (AEOs)."
    },
    {
      question: "How do I get an account?",
      answer: "You can sign up directly from our website. All new users who register for a paid plan (Grower or Business) automatically receive a 14-day free trial with full access to all features of that plan—no credit card required upfront. You can also be invited to join an existing farm by an administrator."
    },
    {
      question: "What happens after my 14-day trial ends?",
      answer: "During your trial, you'll see a reminder banner. If you don't subscribe before the trial ends, your account will be placed on our free 'Starter' plan. You'll retain access to your data and core features, but advanced modules and record limits will apply."
    },
    {
      question: "What are the limitations of the free 'Starter' plan?",
      answer: "The Starter plan is great for getting to know the app. It includes core features like the dashboard, task board, and calendar. However, it is limited to 1 farm plot and allows up to 5 records for each of the main operational modules (Land Prep, Planting, Maintenance, and Harvesting). Paid plans offer unlimited records and advanced modules like Animal Production and Office Management."
    },
    {
      question: "How is my data stored and secured?",
      answer: "All your farm's data is stored centrally and securely in Firebase Firestore, a robust cloud database. This allows for real-time collaboration, meaning any update made by a team member is instantly visible to others. Access to data is controlled by multi-tenant security rules, ensuring that only authenticated members of your farm can access your information."
    },
    {
      question: "Can I use AgriFAAS Connect on my mobile device?",
      answer: "Yes, AgriFAAS Connect is designed as a Progressive Web App (PWA). It's fully responsive and can be 'installed' on your smartphone or tablet's home screen for an app-like experience. The app will also notify you when updates are available so you can reload to get the latest version."
    },
    {
        question: "What do the AEO (Agric Extension Officer) tools do?",
        answer: "The AEO module, available on the Business plan, provides a dedicated dashboard for extension officers. It includes a 'Farmer Directory' which allows them to add new farmers, view detailed profiles of farmers they manage, and track farmer-specific information, challenges, and needs within their assigned region."
    },
    {
        question: "How does User Management work for a farm Admin?",
        answer: "Users with the 'Admin' role have access to a User Management dashboard for their farm. From there, they can view all users on their specific farm, manage their roles (e.g., promote a Farmer to a Manager), and invite new users by generating a secure, one-time registration link. The number of users you can invite depends on your subscription plan."
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
