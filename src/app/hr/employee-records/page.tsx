
// src/app/hr/employee-records/page.tsx
'use client';

import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function HREmployeeRecordsPage() {
  const router = useRouter();
  // This is a placeholder page.
  // Future development will include listing, adding, and editing employee records.

  return (
    <div>
      <PageHeader
        title="Employee Records"
        icon={Users}
        description="Manage all employee profiles, contracts, and details."
        action={
            <Button variant="outline" onClick={() => router.push('/hr/dashboard')}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to HR Dashboard
            </Button>
        }
      />

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Employee List</CardTitle>
          <CardDescription>This section will display a list of all employees.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-10">
            <Users className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">Employee records management is under development.</p>
            <p className="text-sm text-muted-foreground">
              Features will include adding new employees, editing profiles, managing contracts, and tracking employment history.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
