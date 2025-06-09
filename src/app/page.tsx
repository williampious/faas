'use client';

import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, LayoutDashboard, CalendarDays, Archive, CloudSun, ListChecks, BrainCircuit } from 'lucide-react';
import Link from 'next/link';

interface SummaryCardProps {
  title: string;
  value: string;
  icon: React.ElementType;
  href: string;
  color?: string; // Tailwind color class e.g. text-green-500
}

function SummaryCard({ title, value, icon: Icon, href, color }: SummaryCardProps) {
  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-5 w-5 ${color || 'text-primary'}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <Link href={href} className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center mt-1">
          View Details <ArrowRight className="h-3 w-3 ml-1" />
        </Link>
      </CardContent>
    </Card>
  );
}


export default function DashboardPage() {
  // Mock data for summary cards
  const summaryData = [
    { title: "Upcoming Tasks", value: "5", icon: ListChecks, href: "/task-management", color: "text-blue-500" },
    { title: "Calendar Events Today", value: "2", icon: CalendarDays, href: "/farm-calendar", color: "text-purple-500" },
    { title: "Low Stock Resources", value: "3", icon: Archive, href: "/resource-inventory", color: "text-orange-500" },
    { title: "Weather Forecast", value: "Sunny", icon: CloudSun, href: "/weather-monitoring", color: "text-yellow-500" },
  ];

  return (
    <div className="container mx-auto">
      <PageHeader
        title="Dashboard"
        icon={LayoutDashboard}
        description="Welcome to AgriFAAS Connect! Here's an overview of your farm."
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {summaryData.map(card => (
          <SummaryCard key={card.title} {...card} />
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline flex items-center">
              <BrainCircuit className="h-6 w-6 mr-2 text-primary" />
              AI Planting Advice
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Get AI-powered recommendations for optimal planting schedules based on your farm's data.
            </p>
            <Link href="/planting-advice" passHref>
              <Button>
                Get Planting Advice <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/task-management#add" passHref><Button variant="outline" className="w-full justify-start">Add New Task</Button></Link>
            <Link href="/resource-inventory#add" passHref><Button variant="outline" className="w-full justify-start">Log New Resource</Button></Link>
            <Link href="/farm-calendar#add" passHref><Button variant="outline" className="w-full justify-start">Schedule Event</Button></Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
