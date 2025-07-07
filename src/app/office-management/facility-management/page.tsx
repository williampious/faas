
'use client';

import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function FacilityManagementPage() {
  const router = useRouter();

  return (
    <div>
      <PageHeader
        title="Facility Management"
        icon={Building}
        description="Track rent, maintenance, insurance, and vendor contracts for your office."
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
            This section will be used to manage all aspects of your physical office space.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Functionality for logging rent payments, scheduling maintenance, and managing vendor contracts will be implemented here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
