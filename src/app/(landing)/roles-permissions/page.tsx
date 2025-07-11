
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, UserCog, ShieldHalf, Tractor, Briefcase, Compass, Users, DollarSign, FileText } from 'lucide-react';
import { LandingPageHeader } from '@/components/layout/landing-page-header';

interface RoleCardProps {
  title: string;
  description: string;
  icon: React.ElementType;
}

function RoleCard({ title, description, icon: Icon }: RoleCardProps) {
  return (
    <Card className="flex flex-col shadow-lg hover:shadow-xl transition-shadow duration-300 h-full">
      <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-3">
        <div className="p-2 bg-primary/10 rounded-md">
          <Icon className="h-7 w-7 text-primary" />
        </div>
        <CardTitle className="text-xl text-primary font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

export default function RolesAndPermissionsPage() {
  const roles = [
    {
      title: "Admin",
      icon: ShieldHalf,
      description: "The highest level of access. Admins can manage farm settings, invite and manage all users and their roles, access all operational and financial modules, and view AEO dashboards. The user who creates a farm automatically becomes the Admin."
    },
    {
      title: "Manager",
      icon: Tractor,
      description: "A high-level operational role. Managers have full access to farm and animal production modules, task management, inventory, and reporting tools. They can oversee day-to-day operations and delegate tasks."
    },
    {
      title: "Agric Extension Officer (AEO)",
      icon: Compass,
      description: "A specialized role for extension services. AEOs have their own dashboard to manage a directory of farmers, log support interactions, share knowledge base articles, and generate reports for their assigned region."
    },
    {
      title: "HR Manager",
      icon: Briefcase,
      description: "Responsible for human resources. This role has access to the HR dashboard to manage employee records and process payroll, which integrates with the farm's financial ledger."
    },
    {
      title: "Office Manager",
      icon: Briefcase,
      description: "Oversees administrative functions. Office Managers can manage office-specific modules like facility management, event planning, and technology assets, with all costs feeding into the financial dashboard."
    },
    {
      title: "Finance Manager",
      icon: DollarSign,
      description: "Focused on the financial health of the farm. Finance Managers have full access to financial reports, budgeting tools, and the transaction ledger. They can oversee both farm and office financial data."
    },
    {
      title: "Field Officer",
      icon: Users,
      description: "A role focused on data collection and task execution in the field. Field Officers have limited access, primarily to update task statuses and input data for specific operational modules they are assigned to."
    },
    {
      title: "Farmer",
      icon: Users,
      description: "The general role for standard farm operations. A Farmer can log and view data related to their assigned tasks and operational modules like planting, maintenance, and harvesting."
    },
    {
      title: "Farm Staff",
      icon: Users,
      description: "A general-purpose role for farm workers with basic access to view their assigned tasks and relevant operational information. Permissions are more restricted than the Farmer role."
    },
    {
      title: "Investor",
      icon: FileText,
      description: "A read-only role designed for stakeholders who need to monitor the farm's performance. Investors have access to the financial dashboard and profitability reports but cannot alter any operational data."
    }
  ];

  return (
    <div className="container mx-auto px-4">
      <LandingPageHeader
        title="Roles & Permissions"
        description="Understand the different user roles available in AgriFAAS Connect."
        icon={UserCog}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {roles.map((role, index) => (
          <RoleCard key={index} title={role.title} description={role.description} icon={role.icon} />
        ))}
      </div>
      
      <div className="text-center mt-12">
          <Link href="/">
              <Button size="lg">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
              </Button>
          </Link>
      </div>
    </div>
  );
}
