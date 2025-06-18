
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, LayoutList, CheckCircle } from 'lucide-react';
import Image from 'next/image';

export default function FeaturesPage() {
  // Placeholder for feature categories and items
  // In a real app, this might come from a CMS or a structured data file
  const featureCategories = [
    {
      categoryTitle: "Core Farm Management",
      features: [
        { name: "Dashboard Overview", description: "At-a-glance summary of farm activities and alerts." },
        { name: "Land Preparation Tracking", description: "Log activities like clearing, ploughing, and associated costs." },
        { name: "Planting Records", description: "Record crop types, varieties, planting dates, areas, and costs." },
        { name: "Crop Maintenance Logs", description: "Track irrigation, fertilization, pest/disease control, and maintenance costs." },
        { name: "Harvesting & Post-Harvest", description: "Log yield data, quality, storage, sales, and harvest-related costs." },
        { name: "Plot/Field Management", description: "Define and manage individual farm plots or fields, including size, soil type, and location." },
        { name: "Soil & Water Management (Basic)", description: "Placeholder for future detailed soil test and water usage tracking." },
      ]
    },
    {
      categoryTitle: "Livestock Production (Iterative Rollout)",
      features: [
        { name: "Livestock Focus Setup", description: "Define primary animal type (e.g., Poultry, Cattle) and management system (Extensive, Intensive)." },
        { name: "Housing & Infrastructure Management", description: "Log housing units (barns, pens), capacity, and setup/maintenance costs." },
        { name: "Feeding & Nutrition (Coming Soon)", description: "Track feed types, schedules, inventory, and dietary needs." },
        { name: "Health Care & Biosecurity (Coming Soon)", description: "Log vaccinations, health monitoring, medication, and quarantine protocols." },
      ]
    },
    {
      categoryTitle: "Planning & Support Tools",
      features: [
        { name: "Farm Calendar", description: "Schedule and view tasks and events on a monthly calendar." },
        { name: "Task Management", description: "Kanban-style board to manage tasks through To Do, In Progress, and Done stages." },
        { name: "Resource Inventory (Basic)", description: "Placeholder for detailed inventory tracking." },
        { name: "Weather Monitoring", description: "View mock weather data for a specified location." },
        { name: "AI Planting Advice", description: "Get AI-generated recommendations for planting schedules (uses Genkit)." },
      ]
    },
    {
      categoryTitle: "User & System Management",
      features: [
        { name: "User Profile Management", description: "Users can view and update their personal and contact information." },
        { name: "Role-Based Access Control", description: "Navigation and features adapt based on assigned user roles (Admin, Manager, Farmer, etc.)." },
        { name: "Admin User Management", description: "Admins can view all users, assign roles, and manage account statuses (add new users)." },
        { name: "Admin Dashboard", description: "Central hub for administrators to oversee application aspects." },
      ]
    },
    {
        categoryTitle: "Agric Extension Officer (AEO) Tools",
        features: [
            { name: "AEO Dashboard", description: "Dedicated dashboard for AEOs to manage their activities." },
            { name: "Farmer Directory Management", description: "AEOs can add and view profiles of farmers they manage." },
            { name: "Detailed Farmer Profile View", description: "View comprehensive details of individual farmers." },
        ]
    },
    {
        categoryTitle: "Financial & Reporting",
        features: [
            { name: "Financial Dashboard (Summary)", description: "High-level overview of total income and expenses from logged activities." },
            { name: "Budgeting Tool", description: "Create and manage budgets with categories for farm operations." },
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
          <Link href="/" className="inline-block mb-4">
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
                        <CheckCircle className="mr-2 h-5 w-5 text-green-600" />
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
            <Link href="/" passHref>
                <Button size="lg">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
                </Button>
            </Link>
        </div>
      </div>
    </div>
  );
}
