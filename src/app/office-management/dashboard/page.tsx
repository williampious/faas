
'use client';

import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  Briefcase,
  CalendarClock,
  Banknote,
  Building,
  Calendar,
  Shield,
  FileArchive,
  Laptop,
  BarChart,
} from 'lucide-react';

interface ModuleCardProps {
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
  disabled?: boolean;
}

function ModuleCard({ title, description, icon: Icon, href, disabled }: ModuleCardProps) {
  const cardContent = (
    <Card className={`shadow-md hover:shadow-lg transition-shadow flex flex-col h-full ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
          <Icon className="h-7 w-7 text-primary" />
        </div>
      </CardHeader>
      <CardContent className="flex flex-col flex-grow">
        <p className="text-sm text-muted-foreground mb-4 flex-grow">{description}</p>
        <Button variant="outline" className="w-full mt-auto" disabled={disabled}>
          {disabled ? 'Coming Soon' : 'Manage'}
        </Button>
      </CardContent>
    </Card>
  );

  if (disabled) {
    return cardContent;
  }

  return <Link href={href}>{cardContent}</Link>;
}

export default function OfficeManagementDashboardPage() {
  const modules = [
    { title: 'Financial Year', description: 'Define and manage financial years, the core of all office reporting.', icon: CalendarClock, href: '/office-management/financial-year' },
    { title: 'Budgeting & Cash Flow', description: 'Set budgets per category, track spending, and forecast cash flow.', icon: Banknote, href: '/reports/budgeting' },
    { title: 'Facility Management', description: 'Track rent, maintenance schedules, and vendor contracts.', icon: Building, href: '/office-management/facility-management' },
    { title: 'Event Planning', description: 'Manage event budgets, vendor payments, and schedules.', icon: Calendar, href: '/office-management/event-planning', disabled: true },
    { title: 'Safety & Security', description: 'Log compliance costs, insurance, and security contracts.', icon: Shield, href: '/office-management/safety-security', disabled: true },
    { title: 'Records Management', description: 'Handle licensing, filing systems, and audit trails.', icon: FileArchive, href: '/office-management/records-management', disabled: true },
    { title: 'Technology Management', description: 'Oversee IT assets, software subscriptions, and support costs.', icon: Laptop, href: '/office-management/technology-management' },
    { title: 'Office Reports', description: 'Generate financial and operational reports for the office.', icon: BarChart, href: '/office-management/reports' },
  ];

  return (
    <div>
      <PageHeader
        title="Office Management"
        icon={Briefcase}
        description="A central hub for managing all administrative and operational aspects of your office."
      />
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {modules.map((module) => (
          <ModuleCard key={module.title} {...module} />
        ))}
      </div>
    </div>
  );
}
