// src/app/hr/dashboard/page.tsx
'use client';

import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Briefcase, Users, CalendarCheck, Banknote } from 'lucide-react';
import Link from 'next/link';

export default function HRDashboardPage() {
  // This is a placeholder page.
  // Future development will include actual HR data and components.

  const hrFeatures = [
    {
      title: "Employee Records",
      description: "Manage employee profiles, contracts, and personal information.",
      icon: Users,
      href: "/hr/employee-records", 
      cta: "View Records"
    },
    {
      title: "Payroll Management",
      description: "Process payroll, manage deductions, and generate payslips.",
      icon: Banknote,
      href: "/hr/payroll", 
      cta: "Manage Payroll"
    },
    {
      title: "Attendance Tracking",
      description: "Monitor employee attendance, leaves, and work hours.",
      icon: CalendarCheck,
      href: "#", 
      cta: "Track Attendance (Soon)"
    },
    // Add more HR specific cards as features are developed
  ];

  return (
    <div>
      <PageHeader
        title="HR Dashboard"
        icon={Briefcase}
        description="Oversee human resources, manage employee data, and track HR activities."
      />

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {hrFeatures.map((feature) => (
          <Link href={feature.href} key={feature.title} className={feature.href === "#" ? 'pointer-events-none' : ''}>
            <Card className={`shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col h-full ${feature.href === "#" ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:border-primary'}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold">{feature.title}</CardTitle>
                  <feature.icon className="h-7 w-7 text-primary" />
                </div>
              </CardHeader>
              <CardContent className="flex flex-col flex-grow">
                <p className="text-sm text-muted-foreground mb-4 flex-grow">{feature.description}</p>
                <div className="mt-auto text-sm font-medium text-primary hover:underline flex items-center">
                  {feature.cta}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card className="mt-8 bg-secondary/30 rounded-lg shadow">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-secondary-foreground">HR Module Status</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This HR Dashboard is expanding. Employee Records and Payroll are now active. Attendance tracking will be developed in a future iteration.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
