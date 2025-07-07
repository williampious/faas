
'use client';

import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SafetySecurityPage() {
  const router = useRouter();

  return (
    <div>
      <PageHeader
        title="Safety & Security"
        icon={Shield}
        description="Log compliance costs, manage insurance, and track security contracts."
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
            This section will be used to manage office safety and security protocols.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Functionality for scheduling inspections, logging compliance documentation, and tracking security-related expenses will be implemented here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
