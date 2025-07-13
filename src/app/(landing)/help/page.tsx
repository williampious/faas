
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, BookOpen, LifeBuoy, DownloadCloud } from 'lucide-react';
import { LandingPageHeader } from '@/components/layout/landing-page-header';

export default function HelpPage() {
  const helpTopics = [
    {
      title: "Getting Started Guide",
      description: "Learn how to register for a 14-day free trial, choose your role (Farm Admin or AEO), set up your workspace, and invite team members.",
      link: "#getting-started"
    },
    {
      title: "Admin: User Management",
      description: "A guide for Farm Admins on how to use the User Management dashboard to invite new users and manage roles within their farm.",
      link: "#user-management"
    },
    {
      title: "Managing Farm Operations",
      description: "Detailed guides on using the cloud-based modules for Land Preparation, Planting, Crop Maintenance, and Harvesting.",
      link: "#farm-operations"
    },
    {
      title: "Managing Livestock Operations",
      description: "Learn how to log and manage livestock housing and health records in the central database.",
      link: "#livestock-operations"
    },
    {
      title: "Using Collaborative Tools",
      description: "Tips for using the shared Farm Calendar and team-based Task Management board. All data is synced in real-time.",
      link: "#planning-tools"
    },
    {
      title: "Financials & Budgeting",
      description: "Understand the live Financial Dashboard, track income/expenses, and create collaborative budgets for your farm.",
      link: "#financials"
    },
    {
      title: "Using AEO Tools",
      description: "A guide for Agric Extension Officers on managing their Farmer Directory, adding new farmers, and viewing their profiles.",
      link: "#aeo-tools"
    },
    {
      title: "Installation & App Updates",
      description: "Learn how to install AgriFAAS Connect on your mobile or desktop device and how app updates work.",
      link: "/installation-guide",
      isExternal: true,
    }
  ];

  return (
    <div className="container mx-auto px-4">
      <LandingPageHeader
        title="AgriFAAS Connect Help Center"
        description="Find answers and guidance on using our platform effectively."
        icon={LifeBuoy}
      />

      <Card className="w-full max-w-3xl mx-auto shadow-xl mb-12">
        <CardHeader>
          <CardTitle className="text-2xl">Help Topics</CardTitle>
          <CardDescription>
            Browse through our help topics to find the information you need. Detailed guides are coming soon.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {helpTopics.map((topic, index) => (
            <div key={index} id={topic.link.substring(1)} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
              <h3 className="text-xl font-semibold text-primary mb-1">{topic.title}</h3>
              <p className="text-muted-foreground text-sm mb-3">{topic.description}</p>
              {topic.isExternal ? (
                  <Link href={topic.link}>
                      <Button variant="link" className="p-0 h-auto text-primary">
                          View Installation Guide <DownloadCloud className="ml-2 h-4 w-4" />
                      </Button>
                  </Link>
              ) : (
                  <Button variant="link" className="p-0 h-auto text-primary">
                      Learn more (Coming Soon) <BookOpen className="ml-2 h-4 w-4" />
                  </Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
      
      <div className="text-center">
          <p className="text-muted-foreground mb-4">Can't find what you're looking for?</p>
          <Link href="/faq">
              <Button variant="outline" className="mr-2">Visit our FAQ Page</Button>
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
