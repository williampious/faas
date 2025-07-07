
'use client';

import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Laptop, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function TechnologyManagementPage() {
  const router = useRouter();

  return (
    <div>
      <PageHeader
        title="Technology Management"
        icon={Laptop}
        description="Oversee IT assets, software subscriptions, and support costs."
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
            This section will be used to manage your office's technology assets.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Functionality for tracking IT hardware, managing software license renewals, and logging IT support costs will be implemented here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
