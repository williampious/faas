'use client';

import { useState, useEffect } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Settings, Loader2, AlertTriangle, Save, ArrowLeft } from 'lucide-react';
import { useUserProfile } from '@/contexts/user-profile-context';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import type { Farm } from '@/types/farm';
import { useRouter } from 'next/navigation';
import { Separator } from '@/components/ui/separator';

const farmSettingsSchema = z.object({
  name: z.string().min(3, { message: "Farm name must be at least 3 characters." }),
  description: z.string().max(500, "Description cannot exceed 500 characters.").optional(),
  country: z.string().min(2, { message: "Country is required." }),
  region: z.string().min(2, { message: "Region is required." }),
  city: z.string().optional(),
  farmEmail: z.string().email({ message: "Invalid email address." }).optional().or(z.literal('')),
  farmPhone: z.string().optional(),
  farmWebsite: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
});

type FarmSettingsFormValues = z.infer<typeof farmSettingsSchema>;

export default function FarmSettingsPage() {
  const { userProfile, isLoading: isProfileLoading } = useUserProfile();
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<FarmSettingsFormValues>({
    resolver: zodResolver(farmSettingsSchema),
    defaultValues: {
      name: '', description: '', country: '', region: '', city: '',
      farmEmail: '', farmPhone: '', farmWebsite: '',
    },
  });

  useEffect(() => {
    if (isProfileLoading) return;
    if (!userProfile?.farmId) {
      setError("You are not associated with a farm or you don't have permission to view this page.");
      setIsLoading(false);
      return;
    }

    const fetchFarmData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const farmDocRef = doc(db, 'farms', userProfile.farmId);
        const farmDocSnap = await getDoc(farmDocRef);
        if (farmDocSnap.exists()) {
          const farmData = farmDocSnap.data() as Farm;
          form.reset({
            name: farmData.name || '',
            description: farmData.description || '',
            country: farmData.country || '',
            region: farmData.region || '',
            city: farmData.city || '',
            farmEmail: farmData.farmEmail || '',
            farmPhone: farmData.farmPhone || '',
            farmWebsite: farmData.farmWebsite || '',
          });
        } else {
          setError("Farm profile not found. It might have been deleted.");
        }
      } catch (err: any) {
        console.error("Error fetching farm settings:", err);
        setError(`Failed to load farm settings: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchFarmData();
  }, [userProfile, isProfileLoading, form]);

  const onSubmit: SubmitHandler<FarmSettingsFormValues> = async (data) => {
    if (!userProfile?.farmId) {
      toast({ title: "Error", description: "Farm ID is missing.", variant: "destructive" });
      return;
    }
    
    setIsSubmitting(true);
    try {
      const farmDocRef = doc(db, 'farms', userProfile.farmId);
      await updateDoc(farmDocRef, {
        ...data,
        updatedAt: serverTimestamp(),
      });
      toast({ title: "Farm Settings Updated", description: "Your farm's details have been successfully saved." });
    } catch (err: any) {
      console.error("Error updating farm settings:", err);
      toast({ title: "Update Failed", description: err.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isProfileLoading || isLoading) {
    return (
      <div className="flex justify-center items-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">Loading farm settings...</p>
      </div>
    );
  }

  if (error) {
     return (
        <div className="container mx-auto py-10">
          <Card className="w-full max-w-lg mx-auto text-center shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center justify-center text-xl text-destructive">
                <AlertTriangle className="mr-2 h-6 w-6" /> Error
              </CardTitle>
            </CardHeader>
            <CardContent><p className="text-muted-foreground">{error}</p></CardContent>
          </Card>
        </div>
     );
  }

  return (
    <div>
      <PageHeader
        title="Farm Settings"
        icon={Settings}
        description="Update your farm's general information and contact details."
        action={
            <Button variant="outline" onClick={() => router.push('/admin/dashboard')}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Admin Dashboard
            </Button>
        }
      />
      
      <Card className="shadow-lg">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardHeader>
              <CardTitle>Farm Information</CardTitle>
              <CardDescription>This information is displayed publicly and used for communication.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Farm Name*</FormLabel>
                    <FormControl><Input placeholder="Your farm's name" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl><Textarea placeholder="A brief overview of your farm's operations" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Separator />
              <h3 className="text-lg font-medium text-foreground">Location & Contact</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField control={form.control} name="country" render={({ field }) => (<FormItem><FormLabel>Country*</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="region" render={({ field }) => (<FormItem><FormLabel>Region*</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="city" render={({ field }) => (<FormItem><FormLabel>City/Town (Optional)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="farmPhone" render={({ field }) => (<FormItem><FormLabel>Farm Phone (Optional)</FormLabel><FormControl><Input type="tel" {...field} /></FormControl><FormMessage /></FormItem>)} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField control={form.control} name="farmEmail" render={({ field }) => (<FormItem><FormLabel>Farm Email (Optional)</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="farmWebsite" render={({ field }) => (<FormItem><FormLabel>Farm Website (Optional)</FormLabel><FormControl><Input placeholder="https://..." {...field} /></FormControl><FormMessage /></FormItem>)} />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
