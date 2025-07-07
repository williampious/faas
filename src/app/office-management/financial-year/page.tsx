
'use client';

import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarClock, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function FinancialYearPage() {
  const router = useRouter();

  return (
    <div>
      <PageHeader
        title="Financial Year Configuration"
        icon={CalendarClock}
        description="Define and manage financial years to structure your reporting and budgeting."
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
            This section will allow you to create, edit, and manage financial years (e.g., Jan-Dec 2024).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Functionality to define financial periods, set them as active, and roll over at year-end will be implemented here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
