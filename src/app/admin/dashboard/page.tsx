
'use client';

import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ShieldHalf, UsersRound, Settings, TicketPercent, ExternalLink, Info } from 'lucide-react';
import Link from 'next/link';
import { useUserProfile } from '@/contexts/user-profile-context';

export default function AdminDashboardPage() {
  const { userProfile } = useUserProfile();
  // A Super Admin is an Admin who can manage promo codes.
  const isSuperAdmin = userProfile?.role.includes('Super Admin');

  return (
    <div>
      <PageHeader
        title="Admin Dashboard"
        icon={ShieldHalf}
        description="Oversee and manage AgriFAAS Connect application."
      />

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link href="/admin/users" passHref>
          <Card className="shadow-lg hover:shadow-xl transition-shadow cursor-pointer hover:border-primary">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-medium">User Management</CardTitle>
              <UsersRound className="h-6 w-6 text-primary" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                View, add, and modify user accounts and roles.
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/farm-settings" passHref>
          <Card className="shadow-lg hover:shadow-xl transition-shadow cursor-pointer hover:border-primary">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-medium">Farm Settings</CardTitle>
              <Settings className="h-6 w-6 text-primary" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Update your farm's name, contact details, and other settings.
              </p>
            </CardContent>
          </Card>
        </Link>
        
        {isSuperAdmin && (
          <Link href="/admin/promo-codes" passHref>
            <Card className="shadow-lg hover:shadow-xl transition-shadow cursor-pointer hover:border-primary border-accent/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-medium">Promo Codes</CardTitle>
                <TicketPercent className="h-6 w-6 text-accent" />
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Create and manage subscription promotional codes. (Super Admin)
                </p>
              </CardContent>
            </Card>
          </Link>
        )}
      </div>

      <Card className="mt-8 bg-muted/30 p-4">
        <CardHeader className="p-0 pb-2">
            <CardTitle className="text-base font-semibold text-muted-foreground flex items-center">
                <Info className="mr-2 h-5 w-5"/> How to Manage Your App
            </CardTitle>
        </CardHeader>
        <CardContent className="p-0 text-xs text-muted-foreground space-y-2">
            <p>This Admin Dashboard is for managing your application's day-to-day business logic (like creating promo codes or managing user roles).</p>
            <p>For backend management, such as viewing raw database records, managing user authentication credentials, or updating security rules, you will need to use the Google Firebase Console directly.</p>
            <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-primary hover:underline font-semibold">
                Go to Firebase Console <ExternalLink className="ml-1 h-3 w-3" />
            </a>
        </CardContent>
      </Card>
    </div>
  );
}
