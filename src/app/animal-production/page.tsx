
'use client';

import { useState, useEffect } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription as DialogModalDescription, DialogFooter, DialogClose } from '@/components/ui/dialog'; // Aliased DialogDescription
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form'; // Added FormDescription
import { Beef, Settings, PlusCircle, Edit, Info, Home as HomeIcon, Utensils, ShieldCheck, BarChartBig, LinkIcon, Construction } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { LivestockProductionFocus, AnimalType, ManagementSystem } from '@/types/livestock';
import { animalTypes, managementSystems } from '@/types/livestock';
import { format } from 'date-fns';
import Link from 'next/link';


const focusFormSchema = z.object({
  projectName: z.string().max(100).optional(),
  animalType: z.enum(animalTypes, { required_error: "Animal type is required." }),
  managementSystem: z.enum(managementSystems, { required_error: "Management system is required." }),
});

type FocusFormValues = z.infer<typeof focusFormSchema>;

const LOCAL_STORAGE_KEY_LIVESTOCK_FOCUS = 'livestockProductionFocus_v1';
const FOCUS_FORM_ID = 'livestock-focus-form';

interface ModuleCardProps {
  title: string;
  description: string;
  icon: React.ElementType;
  href?: string;
  disabled?: boolean;
}

function ModuleCard({ title, description, icon: Icon, href, disabled }: ModuleCardProps) {
  const cardContent = (
    <Card className={`shadow-md hover:shadow-lg transition-shadow flex flex-col h-full ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
          <Icon className="h-7 w-7 text-primary" />
        </div>
      </CardHeader>
      <CardContent className="flex flex-col flex-grow">
        <p className="text-sm text-muted-foreground mb-4 flex-grow">{description}</p>
        <Button variant="outline" className="w-full mt-auto" disabled={disabled}>
          {disabled ? 'Coming Soon' : 'Manage'}
        </Button>
      </CardContent>
    </Card>
  );

  if (disabled || !href) {
    return cardContent;
  }

  return <Link href={href}>{cardContent}</Link>;
}


export default function AnimalProductionPage() {
  const [currentFocus, setCurrentFocus] = useState<LivestockProductionFocus | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();
  const [isMounted, setIsMounted] = useState(false);

  const form = useForm<FocusFormValues>({
    resolver: zodResolver(focusFormSchema),
    defaultValues: {
      projectName: '',
      animalType: undefined,
      managementSystem: undefined,
    },
  });

  useEffect(() => {
    setIsMounted(true);
    const storedFocus = localStorage.getItem(LOCAL_STORAGE_KEY_LIVESTOCK_FOCUS);
    if (storedFocus) {
      setCurrentFocus(JSON.parse(storedFocus));
    }
  }, []);

  useEffect(() => {
    if (isMounted && currentFocus) {
      localStorage.setItem(LOCAL_STORAGE_KEY_LIVESTOCK_FOCUS, JSON.stringify(currentFocus));
    } else if (isMounted && !currentFocus) {
      localStorage.removeItem(LOCAL_STORAGE_KEY_LIVESTOCK_FOCUS);
    }
  }, [currentFocus, isMounted]);

  const handleOpenModal = () => {
    if (currentFocus) {
      form.reset({
        projectName: currentFocus.projectName || '',
        animalType: currentFocus.animalType,
        managementSystem: currentFocus.managementSystem,
      });
    } else {
      form.reset({
        projectName: '',
        animalType: undefined,
        managementSystem: undefined,
      });
    }
    setIsModalOpen(true);
  };

  const onSubmit: SubmitHandler<FocusFormValues> = (data) => {
    const newFocus: LivestockProductionFocus = {
      id: currentFocus?.id || crypto.randomUUID(), 
      projectName: data.projectName || `${data.animalType} - ${data.managementSystem}`,
      animalType: data.animalType,
      managementSystem: data.managementSystem,
      lastUpdatedAt: new Date().toISOString(),
    };
    setCurrentFocus(newFocus);
    toast({ title: "Livestock Focus Updated", description: `Production focus set to ${newFocus.projectName}.` });
    setIsModalOpen(false);
  };
  
  const animalProductionModules: ModuleCardProps[] = [
    { title: "Housing & Infrastructure", description: "Manage barns, pens, cages, capacity, ventilation, and biosecurity.", icon: HomeIcon, href: "/animal-production/housing" },
    { title: "Health Care & Biosecurity", description: "Log vaccinations, health monitoring, medication, and quarantine protocols.", icon: ShieldCheck, href: "/animal-production/health" },
    { title: "Feeding & Nutrition", description: "Track feed types, schedules, inventory, and specific dietary needs.", icon: Utensils, disabled: true },
    { title: "Production Management", description: "Track species-specific outputs like egg collection or weight gain.", icon: BarChartBig, disabled: true },
    { title: "Breeding & Incubation", description: "Manage breeding ratios, incubation, fertility, and hatch rates.", icon: Construction, href: "/animal-production/breeding", disabled: true }, // Placeholder for breeding
    { title: "Record Keeping & Marketing", description: "Log activities, generate reports, and track sales.", icon: LinkIcon, disabled: true }, // Combined for brevity
  ];


  if (!isMounted) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-12rem)]">
        <Beef className="h-12 w-12 text-primary animate-pulse" />
        <p className="ml-3 text-lg text-muted-foreground">Loading Animal Production Module...</p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Animal Production Management"
        icon={Beef}
        description="Define your livestock focus to tailor management modules for housing, feeding, health, and more."
        action={
          <Button onClick={handleOpenModal}>
            {currentFocus ? <Edit className="mr-2 h-4 w-4" /> : <PlusCircle className="mr-2 h-4 w-4" />}
            {currentFocus ? 'Change Livestock Focus' : 'Set Up Livestock Focus'}
          </Button>
        }
      />

      <Dialog open={isModalOpen} onOpenChange={(isOpen) => {
        setIsModalOpen(isOpen);
        if (!isOpen) { form.reset(); }
      }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{currentFocus ? 'Change Livestock Focus' : 'Set Up Livestock Production Focus'}</DialogTitle>
            <DialogModalDescription>
              Select the primary animal type and management system for your current operation. This will tailor the available modules.
            </DialogModalDescription>
          </DialogHeader>
          <Form {...form}>
            <form id={FOCUS_FORM_ID} onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
              <FormField control={form.control} name="projectName" render={({ field }) => (
                <FormItem><FormLabel>Production Name (Optional)</FormLabel><FormControl><Input placeholder="e.g., Broiler Batch Q3, Dairy Herd Alpha" {...field} /></FormControl>
                <FormDescription>Give this production cycle a memorable name.</FormDescription><FormMessage /></FormItem>)}
              />
              <FormField control={form.control} name="animalType" render={({ field }) => (
                <FormItem><FormLabel>Animal Type*</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select animal type" /></SelectTrigger></FormControl>
                    <SelectContent>{animalTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent>
                  </Select><FormMessage />
                </FormItem>)}
              />
              <FormField control={form.control} name="managementSystem" render={({ field }) => (
                <FormItem><FormLabel>Management System*</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select management system" /></SelectTrigger></FormControl>
                    <SelectContent>{managementSystems.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent>
                  </Select><FormMessage />
                </FormItem>)}
              />
            </form>
          </Form>
          <DialogFooter>
            <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
            <Button type="submit" form={FOCUS_FORM_ID}>Save Focus</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {currentFocus ? (
        <Card className="mb-8 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center"><Settings className="mr-2 h-5 w-5 text-primary" /> Current Livestock Focus</CardTitle>
            <CardDescription>
              Current settings for your animal production operations. Last updated: {format(new Date(currentFocus.lastUpdatedAt), "PPpp")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-lg"><strong>Production Name:</strong> {currentFocus.projectName}</div>
            <div><strong>Animal Type:</strong> <span className="font-semibold text-primary">{currentFocus.animalType}</span></div>
            <div><strong>Management System:</strong> <span className="font-semibold text-primary">{currentFocus.managementSystem}</span></div>
            <Button variant="link" onClick={handleOpenModal} className="p-0 h-auto text-sm">Change Focus Settings</Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="mb-8 shadow-lg border-dashed border-primary/50">
          <CardHeader className="text-center">
             <Beef className="mx-auto h-16 w-16 text-primary/70 mb-3" />
            <CardTitle>No Livestock Focus Set</CardTitle>
            <CardDescription>
              Click the "Set Up Livestock Focus" button to define your primary animal type and management system.
              This will tailor the available modules for housing, feeding, health, and more.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={handleOpenModal} size="lg">
              <PlusCircle className="mr-2 h-5 w-5" /> Set Up Livestock Focus
            </Button>
          </CardContent>
        </Card>
      )}
      
      {currentFocus && (
        <div>
          <h2 className="text-2xl font-semibold mb-4 font-headline">Management Modules</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {animalProductionModules.map(module => <ModuleCard key={module.title} {...module} />)}
          </div>
        </div>
      )}
    </div>
  );
}

