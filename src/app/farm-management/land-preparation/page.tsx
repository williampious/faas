
'use client';

import { PageHeader } from '@/components/layout/page-header';
import { Shovel } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function LandPreparationPage() {
  return (
    <div>
      <PageHeader
        title="Land Preparation Management"
        icon={Shovel}
        description="Manage and track all activities related to preparing your land for planting."
      />
      <Card>
        <CardHeader>
          <CardTitle>Land Preparation Activities</CardTitle>
          <CardDescription>
            Log and monitor tasks such as field clearing, weeding, ploughing, harrowing, and levelling.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Detailed activity logging for land preparation will be available here.
            You'll be able to record dates, resources used, assign tasks, and track progress for:
          </p>
          <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
            <li>Field Clearing (removing debris, rocks)</li>
            <li>Weeding (initial and ongoing)</li>
            <li>Ploughing or Tilling</li>
            <li>Harrowing</li>
            <li>Levelling</li>
          </ul>
          {/* Placeholder for future form or task list */}
        </CardContent>
      </Card>
    </div>
  );
}
