
'use client';

import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tractor, Shovel, Sprout, ShieldAlert, Wheat, LayoutGrid, Layers } from 'lucide-react'; 
import Link from 'next/link';

export default function FarmManagementPage() {
  return (
    <div>
      <PageHeader
        title="Farm Management"
        icon={Tractor}
        description="Oversee and manage all stages of your farming operations, from land preparation to post-harvest."
      />

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <FeatureCard
          title="Land Preparation"
          description="Tasks including field clearing, weeding, ploughing/tilling, harrowing, and levelling the land for planting."
          icon={Shovel}
          href="/farm-management/land-preparation"
          cta="Manage Land Preparation"
        />
        <FeatureCard
          title="Planting"
          description="Activities such as seed selection, sowing or transplanting seedlings, and ensuring correct plant spacing."
          icon={Sprout}
          href="/farm-management/planting"
          cta="Manage Planting"
        />
        <FeatureCard
          title="Crop Management & Maintenance"
          description="Ongoing care including irrigation, fertilization, pest and disease control, and regular weeding throughout the growing season."
          icon={ShieldAlert}
          href="/farm-management/crop-maintenance"
          cta="Manage Crop Maintenance"
        />
        <FeatureCard
          title="Harvesting & Post-Harvest"
          description="Determining harvest timing, gathering mature crops, and handling post-harvest processes like cleaning, packing, and storage."
          icon={Wheat}
          href="/farm-management/harvesting"
          cta="Manage Harvesting"
        />
        <FeatureCard
          title="Plot/Field Management"
          description="Define, map, and manage individual farm plots or fields. Track history, soil types, and specific activities per plot."
          icon={LayoutGrid}
          href="/farm-management/plot-field-management"
          cta="Manage Plots/Fields"
        />
        <FeatureCard
          title="Soil & Water Management"
          description="Track soil test results, plan amendments, manage water sources, and optimize irrigation strategies."
          icon={Layers}
          href="/farm-management/soil-water-management"
          cta="Manage Soil & Water"
          disabled={true}
        />
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">Future Enhancements</CardTitle>
          <CardDescription>
            We are continuously working to enhance your farm management experience.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="list-disc list-inside text-muted-foreground space-y-1">
            <li>Deeper integration between inventory, tasks, and operational activities.</li>
            <li>Advanced analytics on stage performance and costs per plot.</li>
            <li>Photo and sensor data integration for monitoring.</li>
            <li>Full build-out of Soil & Water management features.</li>
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
  const cardContent = (
    <Card className={`shadow-md hover:shadow-lg transition-shadow flex flex-col ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:border-primary'}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
          <Icon className="h-7 w-7 text-primary" />
        </div>
      </CardHeader>
      <CardContent className="flex flex-col flex-grow">
        <p className="text-sm text-muted-foreground mb-4 flex-grow">{description}</p>
        <Button className="w-full mt-auto" disabled={disabled}>
          {disabled ? 'Coming Soon' : cta}
        </Button>
      </CardContent>
    </Card>
  );

  if (disabled) {
      return cardContent;
  }
  
  return <Link href={href}>{cardContent}</Link>;
}
