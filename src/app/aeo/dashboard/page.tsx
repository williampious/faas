
'use client';

import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Compass, Users, MessageSquareText, BarChart3, BookOpenCheck, Settings2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface AEOFeatureCardProps {
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
  cta: string;
  disabled?: boolean;
}

function AEOFeatureCard({ title, description, icon: Icon, href, cta, disabled }: AEOFeatureCardProps) {
  return (
    <Link href={disabled ? "#" : href} className={disabled ? 'pointer-events-none' : ''}>
      <Card className={`shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col h-full ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:border-primary'}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">{title}</CardTitle>
            <Icon className="h-7 w-7 text-primary" />
          </div>
        </CardHeader>
        <CardContent className="flex flex-col flex-grow">
          <p className="text-sm text-muted-foreground mb-4 flex-grow">{description}</p>
          <div className="mt-auto text-sm font-medium text-primary hover:underline flex items-center">
            {cta}
            {!disabled && <ArrowRight className="ml-2 h-4 w-4" />}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}


export default function AEODashboardPage() {
  const aeoFeatures = [
    {
      title: "Farmer Directory",
      description: "Manage and view farmer profiles, track assignments, and organize contact information within your region.",
      icon: Users,
      href: "/aeo/farmer-directory",
      cta: "Access Directory"
    },
    {
      title: "Support & Communication Logs",
      description: "Log interactions, advice provided, and track follow-up visits with farmers for comprehensive support.",
      icon: MessageSquareText,
      href: "/aeo/support-communication",
      cta: "View Logs",
      disabled: true
    },
    {
      title: "Monitoring & Reports",
      description: "Access farmer-level dashboards, generate regional summaries, and track key performance indicators.",
      icon: BarChart3,
      href: "/aeo/reports",
      cta: "View Reports"
    },
    {
      title: "Knowledge Base",
      description: "Share training materials, guides, and best practices with farmers. Log training sessions and field demos.",
      icon: BookOpenCheck,
      href: "/aeo/knowledge-transfer",
      cta: "Access Resources",
    },
     {
      title: "AEO Profile & Settings",
      description: "Manage your assigned region, district, and other personal settings. (Links to main profile for now)",
      icon: Settings2,
      href: "/profile", // For now, links to main profile
      cta: "Manage Settings"
    },
    // Add more AEO specific cards as features are developed
  ];

  return (
    <div>
      <PageHeader
        title="AEO Dashboard"
        icon={Compass}
        description="Welcome, Extension Officer! Oversee your regional activities and manage farmer support effectively."
      />

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {aeoFeatures.map((feature) => (
          <AEOFeatureCard 
            key={feature.title}
            title={feature.title}
            description={feature.description}
            icon={feature.icon}
            href={feature.href}
            cta={feature.cta}
            disabled={feature.disabled}
          />
        ))}
      </div>

      <Card className="mt-8 bg-secondary/30 rounded-lg shadow">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-secondary-foreground">AEO Workflow Guidance</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2">
            <li><strong>Initial Setup:</strong> If this is your first time, please ensure your assigned region and district are correctly set in your <Link href="/profile" className="text-primary hover:underline font-medium">User Profile</Link>.</li>
            <li><strong>Farmer Management:</strong> Use the 'Farmer Directory' to add new farmers, search existing ones, and manage their detailed profiles.</li>
            <li><strong>Support Activities:</strong> Log all farmer interactions, advice given, and resources shared via the 'Support & Communication Logs'.</li>
            <li><strong>Track Progress:</strong> Utilize 'Monitoring & Reports' to view impact and generate summaries for your region.</li>
            <li><strong>Share Knowledge:</strong> Disseminate information and log training events through the 'Knowledge Base'.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
