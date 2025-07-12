
'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription as ShadcnAlertDescription } from '@/components/ui/alert';
import { Wand2, ArrowLeft, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { migrateUsersToStarterPlan } from './actions';

export default function MigrateUsersPage() {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; processedCount?: number } | null>(null);

  const handleMigration = async () => {
    setIsProcessing(true);
    setResult(null);
    const migrationResult = await migrateUsersToStarterPlan();
    setResult(migrationResult);
    setIsProcessing(false);
  };

  return (
    <div>
      <PageHeader
        title="User Subscription Migration"
        icon={Wand2}
        description="A one-time utility to ensure all existing users have a default subscription plan."
        action={
          <Button variant="outline" onClick={() => router.push('/admin/dashboard')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Admin Dashboard
          </Button>
        }
      />
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Migrate Users to Starter Plan</CardTitle>
          <CardDescription>
            This tool will find all users who do not have a `subscription` field in their profile and assign them to the free **Starter** plan. This is a safe operation and will not affect users who already have a subscription.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Warning</AlertTitle>
            <ShadcnAlertDescription>
              This is a one-time operation. Please run it only once after deploying the new subscription features. Running it again will have no effect on already migrated users.
            </ShadcnAlertDescription>
          </Alert>

          <Button onClick={handleMigration} disabled={isProcessing} className="w-full sm:w-auto" size="lg">
            {isProcessing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Wand2 className="mr-2 h-4 w-4" />
            )}
            {isProcessing ? 'Migrating Users...' : 'Run Migration Now'}
          </Button>

          {result && (
            <Alert variant={result.success ? 'default' : 'destructive'} className="mt-4 animate-in fade-in-50">
              {result.success ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
              <AlertTitle>{result.success ? 'Migration Complete' : 'Migration Error'}</AlertTitle>
              <ShadcnAlertDescription>
                {result.message}
              </ShadcnAlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
