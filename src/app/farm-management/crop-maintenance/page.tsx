
'use client';

import { PageHeader } from '@/components/layout/page-header';
import { ShieldAlert } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function CropMaintenancePage() {
  return (
    <div>
      <PageHeader
        title="Crop Maintenance Management"
        icon={ShieldAlert}
        description="Oversee ongoing crop care including irrigation, fertilization, pest control, and weeding."
      />
      <Card>
        <CardHeader>
          <CardTitle>Crop Maintenance Activities</CardTitle>
          <CardDescription>
            Log and monitor irrigation schedules, fertilizer application, pest/disease scouting and treatment, and weeding efforts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Track all essential crop maintenance tasks here:
          </p>
          <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
            <li>Irrigation (scheduling, water usage, methods)</li>
            <li>Fertilization (types, amounts, application dates)</li>
            <li>Pest and Disease Control (scouting reports, treatments, IPM strategies)</li>
            <li>Weeding (methods, frequency, labor)</li>
            <li>Growth Monitoring (phenological stages, health assessments)</li>
          </ul>
          {/* Placeholder for future form or task list */}
        </CardContent>
      </Card>
    </div>
  );
}
