
'use client';

import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LayoutGrid, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function PlotFieldManagementPage() {
  const router = useRouter();

  return (
    <div>
      <PageHeader
        title="Plot/Field Management"
        icon={LayoutGrid}
        description="Define, map, and manage individual farm plots or fields. Track history, soil types, and specific activities per plot."
        action={
          <Button variant="outline" onClick={() => router.push('/farm-management')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Farm Management
          </Button>
        }
      />

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Plot & Field Details</CardTitle>
          <CardDescription>This section will allow you to manage detailed information about each plot or field on your farm.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-10">
            <LayoutGrid className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">Plot/Field Management features are under development.</p>
            <p className="text-sm text-muted-foreground">
              Future capabilities will include:
            </p>
            <ul className="text-sm text-muted-foreground list-disc list-inside inline-block text-left mt-2">
              <li>Creating and mapping farm plots.</li>
              <li>Logging plot-specific history (crops, treatments).</li>
              <li>Viewing soil test results per plot.</li>
              <li>Assigning tasks and resources to specific plots.</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
