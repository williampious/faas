
'use client';

import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Layers, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SoilWaterManagementPage() {
  const router = useRouter();

  return (
    <div>
      <PageHeader
        title="Advanced Soil & Water Management"
        icon={Layers}
        description="Track soil test results, plan amendments, manage water sources, and optimize irrigation strategies."
        action={
          <Button variant="outline" onClick={() => router.push('/farm-management')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Farm Management
          </Button>
        }
      />

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Soil & Water Insights</CardTitle>
          <CardDescription>This section will provide tools for managing soil health and water usage effectively.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-10">
            <Layers className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">Soil & Water Management features are under development.</p>
            <p className="text-sm text-muted-foreground">
              Future capabilities will include:
            </p>
            <ul className="text-sm text-muted-foreground list-disc list-inside inline-block text-left mt-2">
              <li>Logging and visualizing soil test results over time.</li>
              <li>Tools for planning soil amendment applications.</li>
              <li>Managing water sources and tracking usage.</li>
              <li>Optimizing irrigation schedules based on data.</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
