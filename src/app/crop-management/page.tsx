
'use client';

import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sprout, CalendarPlus, Tractor, ListTree } from 'lucide-react';
import Link from 'next/link';

export default function CropManagementPage() {
  return (
    <div>
      <PageHeader
        title="Crop Management"
        icon={Sprout}
        description="Oversee all aspects of your crop lifecycle, from planting to harvest and beyond."
      />

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <FeatureCard
          title="Planting & Harvesting Activities"
          description="Schedule, record, and track all your planting and harvesting tasks. Monitor progress and yields."
          icon={CalendarPlus}
          href="/crop-management/activities"
          cta="Manage Activities"
        />
        <FeatureCard
          title="Soil Health Monitoring"
          description="Log soil test results, track moisture levels, pH, and erosion alerts to maintain optimal soil conditions."
          icon={ListTree}
          href="/crop-management/soil-health"
          cta="Monitor Soil"
          disabled
        />
        <FeatureCard
          title="Resource Application"
          description="Record and schedule fertilization, irrigation, and pest control actions for your crops."
          icon={Tractor}
          href="/crop-management/resource-application"
          cta="Log Applications"
          disabled
        />
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">Upcoming Features</CardTitle>
          <CardDescription>
            We are continuously working to enhance your crop management experience.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="list-disc list-inside text-muted-foreground space-y-1">
            <li>Detailed crop health monitoring with image/sensor input.</li>
            <li>Advanced analytics on crop performance and yield predictions.</li>
            <li>Integration with weather data for proactive alerts.</li>
            <li>Pest and disease outbreak detection and management.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

interface FeatureCardProps {
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
  cta: string;
  disabled?: boolean;
}

function FeatureCard({ title, description, icon: Icon, href, cta, disabled }: FeatureCardProps) {
  return (
    <Card className={`shadow-md hover:shadow-lg transition-shadow ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
          <Icon className="h-7 w-7 text-primary" />
        </div>
      </CardHeader>
      <CardContent className="flex flex-col flex-grow">
        <p className="text-sm text-muted-foreground mb-4 flex-grow">{description}</p>
        <Link href={disabled ? "#" : href} passHref legacyBehavior>
          <Button className="w-full mt-auto" disabled={disabled}>
            {cta}
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
