
'use client';

import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileArchive, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function RecordsManagementPage() {
  const router = useRouter();

  return (
    <div>
      <PageHeader
        title="Records Management"
        icon={FileArchive}
        description="Handle licensing, filing systems, audit trails, and document retention."
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
            This section will be the central repository for important office records.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Functionality for setting document expiration reminders, managing backups, and defining access controls will be implemented here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
