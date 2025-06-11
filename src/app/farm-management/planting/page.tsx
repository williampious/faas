
'use client';

import { PageHeader } from '@/components/layout/page-header';
import { Seedling } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function PlantingPage() {
  return (
    <div>
      <PageHeader
        title="Planting Management"
        icon={Seedling}
        description="Schedule, record, and track all planting activities."
      />
      <Card>
        <CardHeader>
          <CardTitle>Planting Activities</CardTitle>
          <CardDescription>
            Manage seed selection, sowing or transplanting, and plant spacing.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            This section will allow you to manage all aspects of planting:
          </p>
          <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
            <li>Seed Selection (tracking varieties, sources, germination rates)</li>
            <li>Sowing or Transplanting (logging dates, methods, quantities)</li>
            <li>Plant Spacing (recording planned vs actual spacing)</li>
            <li>Resource Allocation (seeds, labor, equipment used)</li>
          </ul>
          {/* Placeholder for future form or task list */}
        </CardContent>
      </Card>
    </div>
  );
}
