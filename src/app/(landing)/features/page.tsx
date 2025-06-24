
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, LayoutList, CheckCircle, Construction } from 'lucide-react';
import Image from 'next/image';

export default function FeaturesPage() {
  const featureCategories = [
    {
      categoryTitle: "Core Farm Management",
      features: [
        { name: "Dashboard Overview", description: "At-a-glance summary of farm activities, calendar events, and key alerts." },
        { name: "Land Preparation Tracking", description: "Log activities like clearing, ploughing, and harrowing, with detailed cost tracking per activity." },
        { name: "Planting Records", description: "Record crop types, varieties, planting dates, areas, methods, and all associated costs." },
        { name: "Crop Maintenance Logs", description: "Track irrigation, fertilization, pest/disease control, and other maintenance activities with integrated costing." },
        { name: "Harvesting & Post-Harvest", description: "Log yield data, quality, storage, sales, and harvest-related costs. Sales data automatically feeds into the financial dashboard as income." },
        { name: "Plot/Field Management", description: "Define and manage individual farm plots or fields, including size, soil type, and location." },
        { name: "Soil & Water Management", description: "Log and visualize soil test results, manage water sources, and optimize irrigation. (Coming Soon)", comingSoon: true },
      ]
    },
    {
      categoryTitle: "Livestock Production (Iterative Rollout)",
      features: [
        { name: "Livestock Focus Setup", description: "Define primary animal type (e.g., Poultry, Cattle) and management system (Extensive, Intensive)." },
        { name: "Housing & Infrastructure Management", description: "Log housing units (barns, pens), capacity, and track setup/maintenance costs." },
        { name: "Health Care & Biosecurity", description: "Log vaccinations, health monitoring, medication, and track related costs which are integrated with the financial ledger." },
        { name: "Feeding & Nutrition", description: "Track feed types, schedules, inventory, and dietary needs. (Coming Soon)", comingSoon: true },
        { name: "Breeding & Incubation", description: "Manage breeding ratios, incubation, fertility, and hatch rates. (Coming Soon)", comingSoon: true },
      ]
    },
    {
      categoryTitle: "Planning & Support Tools",
      features: [
        { name: "Farm Calendar", description: "Schedule and view tasks and important events on a monthly calendar." },
        { name: "Task Management", description: "Kanban-style board to manage tasks through To Do, In Progress, and Done stages with drag-and-drop functionality." },
        { name: "Resource Inventory", description: "Track stock levels of resources like seeds, fertilizers, and fuel. Log purchases and costs." },
        { name: "Weather Monitoring", description: "View mock weather data for a specified location to aid in planning." },
        { name: "AI Planting Advice", description: "Get AI-generated recommendations for planting schedules and fertilization (powered by Genkit)." },
      ]
    },
    {
      categoryTitle: "User & System Management",
      features: [
        { name: "User Profile Management", description: "Users can view and update their personal and contact information." },
        { name: "Role-Based Access Control", description: "Navigation and features adapt based on assigned user roles (Admin, Manager, Farmer, AEO, etc.)." },
        { name: "Admin User Management", description: "Admins can view all users, manage roles, and add new users via a secure invitation link system." },
        { name: "Admin Dashboard", description: "Central hub for administrators to oversee application users and settings." },
      ]
    },
    {
        categoryTitle: "Agric Extension Officer (AEO) Tools",
        features: [
            { name: "AEO Dashboard", description: "Dedicated dashboard for AEOs to manage their activities." },
            { name: "Farmer Directory Management", description: "AEOs can add and view profiles of farmers they manage within their assigned regions and districts." },
            { name: "Detailed Farmer Profile View", description: "View comprehensive details of individual farmers, including farm details, challenges, and needs." },
        ]
    },
    {
        categoryTitle: "Financial & Reporting",
        features: [
            { name: "Financial Dashboard (Live)", description: "Dynamic overview of total income and expenses, with charts for monthly trends and expense breakdown by category." },
            { name: "Budgeting Tool", description: "Create and manage budgets for specific seasons or periods. Define expense categories and track overall budget vs. actual spending." },
        ]
    },
    {
      categoryTitle: "Platform & User Experience",
      features: [
        { name: "Progressive Web App (PWA)", description: "Installable on mobile devices for an app-like experience with offline capabilities for cached assets." },
        { name: "Responsive Design", description: "Accessible on various devices, including desktops, tablets, and smartphones." },
        { name: "Help & FAQ Pages", description: "Dedicated sections for user assistance and common questions." },
      ]
    }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-background to-green-50 dark:from-slate-900 dark:to-green-900/50 py-8 sm:py-12">
      <div className="container mx-auto px-4">
        <header className="mb-10 text-center">
          <Link href="/">
            <Image
              src="/agrifaas-logo.png"
              alt="AgriFAAS Connect Logo"
              width={200}
              height={67}
              objectFit="contain"
            />
          </Link>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-primary font-headline flex items-center justify-center">
            <LayoutList className="mr-3 h-10 w-10" /> AgriFAAS Connect Features
          </h1>
          <p className="mt-3 text-lg sm:text-xl text-foreground/80 max-w-2xl mx-auto">
            Discover the capabilities of our farm management platform.
          </p>
        </header>

        <div className="space-y-10">
          {featureCategories.map((category, catIndex) => (
            <Card key={catIndex} className="w-full max-w-4xl mx-auto shadow-xl">
              <CardHeader className="bg-primary/5">
                <CardTitle className="text-2xl text-primary">{category.categoryTitle}</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                {category.features.map((feature, featIndex) => (
                  <div key={featIndex} className="p-3 border-b last:border-b-0">
                    <h3 className="text-lg font-semibold text-foreground/90 flex items-center">
                        {feature.comingSoon ? (
                            <Construction className="mr-2 h-5 w-5 text-amber-600" />
                        ) : (
                            <CheckCircle className="mr-2 h-5 w-5 text-green-600" />
                        )}
                        {feature.name}
                    </h3>
                    <p className="text-muted-foreground text-sm ml-7">{feature.description}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
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
    </div>
  );
}
