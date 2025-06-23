
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useUserProfile } from '@/contexts/user-profile-context';
import { db } from '@/lib/firebase';
import { doc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import type { Farm } from '@/types/farm';

const farmSetupSchema = z.object({
  name: z.string().min(3, { message: "Farm name must be at least 3 characters." }),
  country: z.string().min(2, { message: "Country is required." }),
  region: z.string().min(2, { message: "Region is required." }),
  description: z.string().max(500, "Description cannot exceed 500 characters.").optional(),
});
type FarmSetupFormValues = z.infer<typeof farmSetupSchema>;

export default function SetupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, isLoading: isProfileLoading, userProfile } = useUserProfile();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FarmSetupFormValues>({
    resolver: zodResolver(farmSetupSchema),
    defaultValues: {
      name: '', country: 'Ghana', region: '', description: '',
    },
  });
  
  // Redirect if user is not logged in or already has a farm
  useEffect(() => {
    if (!isProfileLoading) {
      if (!user) {
        router.replace('/auth/signin');
      }
      if (user && userProfile?.farmId) {
        router.replace('/dashboard');
      }
    }
  }, [user, userProfile, isProfileLoading, router]);

  const onSubmit: SubmitHandler<FarmSetupFormValues> = async (data) => {
    if (!user || !db) {
      toast({ title: "Authentication Error", description: "You must be logged in to create a farm.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    
    // Generate a new ID for the farm client-side
    const farmRef = doc(db, 'farms', doc(db, 'farms', 'dummy-id-to-get-ref').id);
    const userRef = doc(db, 'users', user.uid);

    const newFarm: Omit<Farm, 'createdAt'|'updatedAt'> = {
      id: farmRef.id,
      name: data.name,
      country: data.country,
      region: data.region,
      description: data.description || '',
      ownerId: user.uid,
    };

    try {
      const batch = writeBatch(db);

      // 1. Create the new farm document
      batch.set(farmRef, {
        ...newFarm,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      
      // 2. Update the user's profile with the new farmId
      batch.update(userRef, { farmId: farmRef.id });

      await batch.commit();
      
      toast({ title: "Farm Created!", description: `Welcome to ${data.name}. Redirecting you to the dashboard.` });
      
    } catch (error: any) {
      console.error("Error creating farm:", error);
      toast({ title: "Error", description: `Failed to create farm: ${error.message}`, variant: "destructive" });
      setIsSubmitting(false);
    } 
    // No finally block for setIsSubmitting, as successful submission triggers a redirect.
  };

  if (isProfileLoading || !user) {
    return (
        <div className="flex flex-col items-center justify-center p-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Verifying account...</p>
        </div>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Welcome to AgriFAAS Connect!</CardTitle>
        <CardDescription>Let's set up your farm profile. This information will help tailor the application to your needs. All fields can be updated later.</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>Farm Name*</FormLabel>
                <FormControl><Input placeholder="e.g., Green Valley Farms" {...field} /></FormControl>
                <FormDescription>The official or common name of your farm or agricultural business.</FormDescription>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField control={form.control} name="country" render={({ field }) => (
                <FormItem>
                  <FormLabel>Country*</FormLabel>
                  <FormControl><Input placeholder="e.g., Ghana" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="region" render={({ field }) => (
                <FormItem>
                  <FormLabel>Region*</FormLabel>
                  <FormControl><Input placeholder="e.g., Volta Region" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel>Farm Description (Optional)</FormLabel>
                <FormControl><Textarea placeholder="A brief description of your farm's focus, e.g., 'Specializing in organic maize and poultry.'" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSubmitting} className="w-full md:w-auto">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? 'Saving...' : 'Finish Setup'}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
