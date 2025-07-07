
'use client';

import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function EventPlanningPage() {
  const router = useRouter();

  return (
    <div>
      <PageHeader
        title="Event Planning"
        icon={Calendar}
        description="Manage event budgets, vendor payments, and schedules for office events."
        action={
          <Button variant="outline" onClick={() => router.push('/office-management/dashboard')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Office Dashboard
          </Button>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle>Feature Under Construction</CardTitle>
          <CardDescription>
            This section will be used for planning and tracking office events.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Functionality to create events, assign budgets, and log expenses for catering, venues, and travel will be implemented here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
