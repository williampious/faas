
'use client';

import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Banknote, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function OfficeBudgetingPage() {
  const router = useRouter();

  return (
    <div>
      <PageHeader
        title="Office Budgeting & Cash Flow"
        icon={Banknote}
        description="Set budgets, track expenses, and forecast cash flow for office operations."
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
            This section will be the hub for managing office-specific budgets.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Functionality to set budgets for categories like rent, utilities, and salaries, and to view cash flow projections will be implemented here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
