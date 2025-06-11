
'use client';

import { PageHeader } from '@/components/layout/page-header';
import { Wheat } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function HarvestingPage() {
  return (
    <div>
      <PageHeader
        title="Harvesting & Post-Harvest Management"
        icon={Wheat}
        description="Manage harvest timing, gathering of crops, and post-harvest handling."
      />
      <Card>
        <CardHeader>
          <CardTitle>Harvesting Activities</CardTitle>
          <CardDescription>
            Plan and record harvest operations, yield data, and post-harvest processing steps.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            This section will cover the final stages of your crop cycle:
          </p>
          <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
            <li>Harvest Timing (maturity assessment, scheduling)</li>
            <li>Gathering (methods, labor, equipment)</li>
            <li>Yield Recording (quantity, quality grades)</li>
            <li>Post-Harvest Handling (cleaning, sorting, packing)</li>
            <li>Storage (conditions, duration)</li>
            <li>Transportation</li>
          </ul>
          {/* Placeholder for future form or task list */}
        </CardContent>
      </Card>
    </div>
  );
}
