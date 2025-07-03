
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
      answer: "There are two main ways to get an account:\n1.  **Invited to a Farm:** An existing Administrator of a farm account can invite you to join their team. They will generate a secure, one-time registration link for you to complete your setup and join their workspace.\n2.  **New Registration:** If you are the first person from your organization, you can use the public 'Register' button. After registering, you will be guided through a setup process."
    },
    {
        question: "I'm the first person registering. What's the process?",
        answer: "When you register for the first time via the public 'Register' button, you will be taken to a setup page where you must choose your path:\n• **Set up a Farm:** If you select this, you will create a new, isolated farm workspace. You will automatically be assigned the 'Admin' role, giving you the ability to manage the farm and invite your team members.\n• **Set up as an AEO:** If you are an Agric Extension Officer or a Cooperative Representative, you can set up an AEO profile to manage farmers in your assigned region."
    },
    {
      question: "How is my data stored and secured?",
      answer: "All your farm's data is stored centrally and securely in Firebase Firestore, a robust cloud database. This allows for real-time collaboration, meaning any update made by a team member is instantly visible to others. Access to data is controlled by multi-tenant security rules, ensuring that only authenticated members of your farm can access your information."
    },
    {
        question: "Are collaborative tools like the Calendar and Task Board shared?",
        answer: "Yes. Unlike early versions, the Farm Calendar and the Kanban-style Task Management board are now fully cloud-based. Any event added to the calendar or any task created or moved on the board is instantly synchronized and visible to all members of your farm, enabling true team collaboration."
    },
    {
      question: "Can I use AgriFAAS Connect on my mobile device?",
      answer: "Yes, AgriFAAS Connect is designed as a Progressive Web App (PWA). It's fully responsive and can be 'installed' on your smartphone or tablet's home screen for an app-like experience. The app will also notify you when updates are available so you can reload to get the latest version."
    },
    {
        question: "What do the AEO (Agric Extension Officer) tools do?",
        answer: "The AEO module provides a dedicated dashboard for extension officers. It includes a 'Farmer Directory' which allows them to add new farmers, view detailed profiles of farmers they manage, and track farmer-specific information, challenges, and needs within their assigned region."
    },
    {
        question: "How does User Management work for a farm Admin?",
        answer: "Users with the 'Admin' role have access to a User Management dashboard for their farm. From there, they can view all users on their specific farm, manage their roles (e.g., promote a Farmer to a Manager), and invite new users by generating a secure, one-time registration link."
    },
    {
        question: "How do I get AI Planting Advice?",
        answer: "Navigate to the 'AI Advice' section from your dashboard. You'll need to provide details about your farm's weather data, soil conditions, and the crop you intend to plant. The system will then generate tailored advice using Google's AI models and save it to your farm's history for future reference."
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
