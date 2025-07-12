'use client';

import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldHalf, UsersRound, Settings, TicketPercent } from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboardPage() {
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

         <Link href="/admin/promo-codes" passHref>
          <Card className="shadow-lg hover:shadow-xl transition-shadow cursor-pointer hover:border-primary">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-medium">Promo Codes</CardTitle>
              <TicketPercent className="h-6 w-6 text-primary" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Create and manage promotional codes for user subscriptions.
              </p>
            </CardContent>
          </Card>
        </Link>

        {/* Add more admin-specific cards here as features are developed */}
      </div>

      <div className="mt-8 p-4 bg-secondary/30 rounded-lg">
        <h3 className="text-lg font-semibold text-secondary-foreground mb-2">Admin Notes:</h3>
        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
          <li>Full user editing capabilities (roles, status) will be implemented in the User Management section.</li>
          <li>Assigning users to farm plots or specific tasks is a planned feature.</li>
          <li>More detailed analytics and reporting will be added to this dashboard.</li>
        </ul>
      </div>
    </div>
  );
}
