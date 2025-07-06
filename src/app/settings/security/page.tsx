
'use client';

import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock, ArrowLeft, Send } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SecuritySettingsPage() {
  const router = useRouter();

  return (
    <div>
      <PageHeader
        title="Sign-in & Security"
        icon={Lock}
        description="Manage your account security settings."
        action={
          <Button variant="outline" onClick={() => router.push('/settings')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Settings
          </Button>
        }
      />

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Change Your Password</CardTitle>
          <CardDescription>
            For your security, password changes are handled through our secure password reset process.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            To change your password, please use the "Forgot Password" link. This will send a secure link to your registered email address, allowing you to set a new password. You can do this even if you are currently logged in.
          </p>
          <Link href="/auth/forgot-password">
            <Button>
              <Send className="mr-2 h-4 w-4" /> Go to Password Reset Page
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
