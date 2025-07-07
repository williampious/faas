
'use client';

import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function OfficeReportsPage() {
  const router = useRouter();

  return (
    <div>
      <PageHeader
        title="Office Reports"
        icon={BarChart}
        description="Generate financial and operational reports for the office."
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
            This section will provide detailed reports on office operations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Now that modules like Facility and Technology Management are being built, this area will be developed to generate specific reports on office spending, vendor contracts, asset depreciation, and more.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
