
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
import { Beef, Settings, PlusCircle, Edit, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { LivestockProductionFocus, AnimalType, ManagementSystem } from '@/types/livestock';
import { animalTypes, managementSystems } from '@/types/livestock';
import { format } from 'date-fns';

const focusFormSchema = z.object({
  projectName: z.string().max(100).optional(),
  animalType: z.enum(animalTypes, { required_error: "Animal type is required." }),
  managementSystem: z.enum(managementSystems, { required_error: "Management system is required." }),
});

type FocusFormValues = z.infer<typeof focusFormSchema>;

const LOCAL_STORAGE_KEY_LIVESTOCK_FOCUS = 'livestockProductionFocus_v1';
const FOCUS_FORM_ID = 'livestock-focus-form';

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
      id: currentFocus?.id || 'default_focus', // Keep a consistent ID if only one focus is managed
      projectName: data.projectName || `${data.animalType} - ${data.managementSystem}`,
      animalType: data.animalType,
      managementSystem: data.managementSystem,
      lastUpdatedAt: new Date().toISOString(),
    };
    setCurrentFocus(newFocus);
    toast({ title: "Livestock Focus Updated", description: `Production focus set to ${newFocus.projectName}.` });
    setIsModalOpen(false);
  };

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
        description="Define your livestock focus to tailor management modules."
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
              Select the primary animal type and management system for your current operation.
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
        <Card className="shadow-lg">
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
        <Card className="shadow-lg border-dashed border-primary/50">
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

      <Card className="mt-6 bg-secondary/30 p-4">
        <CardHeader className="p-0 pb-2">
            <CardTitle className="text-lg font-semibold text-secondary-foreground flex items-center">
                <Info className="mr-2 h-5 w-5"/> Next Steps & Future Modules
            </CardTitle>
        </CardHeader>
        <CardContent className="p-0 text-sm text-muted-foreground space-y-1">
            <p>&bull; Based on your selected "Livestock Focus" above, subsequent modules will become available here.</p>
            <p>&bull; Future modules will include: Housing & Infrastructure, Feeding & Nutrition, Health Care & Biosecurity, Production Management (e.g., Egg/Meat specific logs), Breeding, Record Keeping, Marketing, and Compliance.</p>
            <p>&bull; The system will eventually provide tailored recommendations for space, feed, and care based on your selections.</p>
        </CardContent>
      </Card>
    </div>
  );
}
