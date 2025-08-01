'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, LayoutList, CheckCircle, Construction, Cloud, Users, Beef, Tractor, Sparkles, Building2, Briefcase } from 'lucide-react';
import { LandingPageHeader } from '@/components/layout/landing-page-header';
import { cn } from '@/lib/utils';

export default function FeaturesPage() {
  const featureCategories = [
    {
      categoryTitle: "Platform & Collaboration",
      icon: Cloud,
      features: [
        { name: "Multi-Tenant Architecture", description: "Your farm or organization gets a secure, isolated workspace (tenant). All your data is stored centrally in the cloud, enabling real-time collaboration for your entire team." },
        { name: "Role-Based Access Control", description: "Assign specific roles (Admin, Manager, Farmer, AEO, HR) to users, ensuring they only see the features and data relevant to their job." },
        { name: "20-Day Free Trial", description: "All new accounts get a 20-day free trial of the full Business Plan, with access to every feature, no credit card required.", icon: Sparkles, iconColor: 'text-yellow-500' },
        { name: "Progressive Web App (PWA)", description: "Installable on mobile devices for an app-like experience. Includes an in-app notification when a new version is available." },
      ]
    },
    {
      categoryTitle: "Core Crop Management (All Plans)",
      icon: Tractor,
      features: [
        { name: "Dashboard Overview", description: "At-a-glance summary of farm activities, calendar events, and key alerts." },
        { name: "Centralized Costing", description: "Log costs for labor, materials, and services for any activity. All expenses automatically flow into the central financial ledger." },
        { name: "Land Preparation Tracking", description: "Log activities like clearing, ploughing, and harrowing with detailed cost tracking. (Limited to 5 records on Starter plan)" },
        { name: "Planting Records", description: "Record crop types, planting dates, and all associated costs in a central database. (Limited to 5 records on Starter plan)" },
        { name: "Crop Maintenance Logs", description: "Track irrigation, fertilization, and pest control with integrated costing. (Limited to 5 records on Starter plan)" },
        { name: "Harvesting & Post-Harvest", description: "Log yield data, quality, storage, and sales. Sales data automatically creates income records in the ledger. (Limited to 5 records on Starter plan)" },
        { name: "Plot/Field Management", description: "Define and manage individual farm plots, including size and soil type. (Limited to 1 plot on Starter plan)" },
      ]
    },
    {
      categoryTitle: "Livestock Production (Grower Plan & Up)",
      icon: Beef,
      features: [
        { name: "Housing & Infrastructure Management", description: "Log housing units (barns, pens), capacity, and track setup/maintenance costs centrally." },
        { name: "Health Care & Biosecurity", description: "Log vaccinations, health monitoring, and medication. Costs are automatically integrated with the financial ledger." },
        { name: "Feeding & Nutrition", description: "Track feed types, schedules, inventory, and dietary needs with associated costs." },
        { name: "Breeding & Incubation", description: "Manage breeding ratios, incubation, fertility, and hatch rates with cost tracking." },
      ]
    },
    {
      categoryTitle: "Office & HR Management (Business Plan)",
      icon: Building2,
      features: [
        { name: "Office Management Suite", description: "Manage office-specific costs for facilities, technology assets, safety compliance, and event planning." },
        { name: "Financial Year Management", description: "Define financial years to structure office reporting and budgeting cycles." },
        { name: "HR Management Dashboard", description: "A central hub for managing employee records and payroll processing." },
        { name: "Payroll Processing", description: "Log payroll records for employees, which automatically integrates with the main financial ledger as an expense." },
      ]
    },
    {
      categoryTitle: "Agric Extension Officer (AEO) Tools (Business Plan)",
      icon: Users,
      features: [
        { name: "AEO Dashboard", description: "Dedicated dashboard for AEOs to manage their activities and farmer interactions." },
        { name: "Farmer Directory Management", description: "AEOs can add and view profiles of farmers they manage within their assigned regions and districts." },
        { name: "Support & Communication Logs", description: "Record all interactions with farmers, from phone calls to field visits, to maintain a complete history." },
        { name: "AEO Knowledge Base", description: "Create and manage a private repository of articles, best practices, and training materials." },
      ]
    },
     {
      categoryTitle: "Planning & Financials",
      icon: CheckCircle,
      features: [
        { name: "Live Financial Dashboard", description: "Dynamic overview of total income and expenses, with charts for monthly trends and expense breakdown by category." },
        { name: "Collaborative Budgeting Tool", description: "Create and manage budgets for specific seasons or periods. Track overall budget vs. actual spending in real-time." },
        { name: "Shared Farm Calendar & Task Board", description: "Schedule events and manage tasks with your team on shared, real-time boards." },
        { name: "Centralized Resource Inventory", description: "Track stock levels of resources like seeds and fertilizers. Purchases are logged as expenses automatically." },
        { name: "AI Planting Advice", description: "Get AI-generated recommendations for planting schedules and fertilization. All advice is saved to a shared farm history." },
      ]
    },
  ];

  return (
    <div className="container mx-auto px-4">
      <LandingPageHeader
        title="AgriFAAS Connect Features"
        description="Discover the capabilities of our collaborative, cloud-based farm management platform."
        icon={LayoutList}
      />

      <div className="space-y-10">
        {featureCategories.map((category, catIndex) => (
          <Card key={catIndex} className="w-full max-w-4xl mx-auto shadow-xl">
            <CardHeader className="bg-primary/5">
              <CardTitle className="text-2xl text-primary flex items-center">
                <category.icon className="mr-3 h-6 w-6" />
                {category.categoryTitle}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {category.features.map((feature, featIndex) => (
                <div key={featIndex} className="p-3 border-b last:border-b-0">
                  <h3 className="text-lg font-semibold text-foreground/90 flex items-center">
                      {feature.icon ? (
                          <feature.icon className={cn("mr-2 h-5 w-5", feature.iconColor || 'text-green-600')} />
                      ) : (
                          <CheckCircle className="mr-2 h-5 w-5 text-green-600" />
                      )}
                      {feature.name}
                  </h3>
                  <p className="text-muted-foreground text-sm ml-7">{feature.description}</p>
                </div>
              ))
              }
            </CardContent>
          </Card>
        ))
        }
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
