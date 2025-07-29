
'use client';

import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldHalf, UsersRound, Settings, TicketPercent, ExternalLink, Info, Building, Building2 } from 'lucide-react';
import Link from 'next/link';
import { useUserProfile } from '@/contexts/user-profile-context';
import { CreateTenantDialog } from '../create-tenant-dialog';

export default function AdminDashboardPage() {
  const { userProfile } = useUserProfile();
  const isSuperAdmin = userProfile?.role.includes('Super Admin');

  return (
    <div>
      <PageHeader
        title={isSuperAdmin ? "Super Admin Dashboard" : "Admin Dashboard"}
        icon={ShieldHalf}
        description={isSuperAdmin ? "Oversee and manage the entire AgriFAAS Connect platform." : "Manage your farm's settings and users."}
      />

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {isSuperAdmin && (
           <>
            <CreateTenantDialog>
              <Card className="shadow-lg hover:shadow-xl transition-shadow cursor-pointer hover:border-primary border-primary/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-lg font-medium text-primary">Create New Tenant</CardTitle>
                  <Building className="h-6 w-6 text-primary" />
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Onboard a new farm, co-operative, or business onto the platform.
                  </p>
                </CardContent>
              </Card>
            </CreateTenantDialog>

            <Link href="/admin/tenants" passHref>
              <Card className="shadow-lg hover:shadow-xl transition-shadow cursor-pointer hover:border-primary border-primary/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-lg font-medium text-primary">Tenant Management</CardTitle>
                  <Building2 className="h-6 w-6 text-primary" />
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    View and manage all tenants (farms) across the entire platform.
                  </p>
                </CardContent>
              </Card>
            </Link>
           </>
        )}

        <Link href="/admin/users" passHref>
          <Card className="shadow-lg hover:shadow-xl transition-shadow cursor-pointer hover:border-primary">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-medium">User Management</CardTitle>
              <UsersRound className="h-6 w-6 text-primary" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                View, add, and manage users within your farm.
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
                <CardTitle className="text-lg font-medium text-accent">Promo Codes</CardTitle>
                <TicketPercent className="h-6 w-6 text-accent" />
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Manage platform-wide subscription promotional codes.
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
            <p>This Admin Dashboard is for managing your application's day-to-day business logic (like managing user roles).</p>
            <p>For backend management, such as viewing raw database records, managing user authentication credentials, or updating security rules, you will need to use the Google Firebase Console directly.</p>
            <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-primary hover:underline font-semibold">
                Go to Firebase Console <ExternalLink className="ml-1 h-3 w-3" />
            </a>
        </CardContent>
      </Card>
    </div>
  );
}
