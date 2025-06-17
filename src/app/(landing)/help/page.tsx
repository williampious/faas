
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, BookOpen, LifeBuoy } from 'lucide-react';
import Image from 'next/image';

export default function HelpPage() {
  const helpTopics = [
    {
      title: "Getting Started with AgriFAAS Connect",
      description: "Learn how to register, set up your profile, and navigate the dashboard.",
      link: "#getting-started"
    },
    {
      title: "Managing Your Farm Operations",
      description: "Guides on land preparation, planting, crop maintenance, and harvesting.",
      link: "#farm-operations"
    },
    {
      title: "Understanding AI Planting Advice",
      description: "How to input data and interpret the AI-generated planting recommendations.",
      link: "#ai-advice"
    },
    {
      title: "Using the Farm Calendar and Task Manager",
      description: "Tips for effectively planning your activities and managing tasks.",
      link: "#planning-tools"
    },
    {
      title: "Account & Profile Settings",
      description: "How to update your personal information, password, and notification preferences.",
      link: "#account-settings"
    },
    {
      title: "Troubleshooting Common Issues",
      description: "Solutions for frequent problems or error messages.",
      link: "#troubleshooting"
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
            <LifeBuoy className="mr-3 h-10 w-10" /> AgriFAAS Connect Help Center
          </h1>
          <p className="mt-3 text-lg sm:text-xl text-foreground/80 max-w-2xl mx-auto">
            Find answers and guidance on using our platform effectively.
          </p>
        </header>

        <Card className="w-full max-w-3xl mx-auto shadow-xl mb-12">
          <CardHeader>
            <CardTitle className="text-2xl">Help Topics</CardTitle>
            <CardDescription>
              Browse through our help topics to find the information you need.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {helpTopics.map((topic, index) => (
              <div key={index} id={topic.link.substring(1)} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                <h3 className="text-xl font-semibold text-primary mb-1">{topic.title}</h3>
                <p className="text-muted-foreground text-sm mb-3">{topic.description}</p>
                <Button variant="link" className="p-0 h-auto text-primary">
                  Learn more (Coming Soon) <BookOpen className="ml-2 h-4 w-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
        
        <div className="text-center">
            <p className="text-muted-foreground mb-4">Can't find what you're looking for?</p>
            <Link href="/faq" passHref>
                <Button variant="outline" className="mr-2">Visit our FAQ Page</Button>
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
