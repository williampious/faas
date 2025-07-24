

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useUserProfile } from '@/contexts/user-profile-context';
import { db } from '@/lib/firebase';
import { doc, writeBatch, serverTimestamp, collection, updateDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2, Tractor, Handshake } from 'lucide-react';
import type { Farm } from '@/types/farm';
import type { UserRole } from '@/types/user';
import { cn } from '@/lib/utils';

// Schema for the Farmer setup
const farmSetupSchema = z.object({
  name: z.string().min(3, { message: "Farm name must be at least 3 characters." }),
  country: z.string().min(2, { message: "Country is required." }),
  region: z.string().min(2, { message: "Region is required." }),
  description: z.string().max(500, "Description cannot exceed 500 characters.").optional(),
});
type FarmSetupFormValues = z.infer<typeof farmSetupSchema>;

// Schema for the AEO setup
const aeoSetupSchema = z.object({
  organization: z.string().optional(),
  assignedRegion: z.string().min(2, { message: "Region is required." }),
  assignedDistrict: z.string().min(2, { message: "District is required." }),
});
type AeoSetupFormValues = z.infer<typeof aeoSetupSchema>;

type SetupType = 'farmer' | 'aeo';

export default function SetupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, isLoading: isProfileLoading, userProfile } = useUserProfile();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [setupType, setSetupType] = useState<SetupType | null>(null);

  const farmForm = useForm<FarmSetupFormValues>({
    resolver: zodResolver(farmSetupSchema),
    defaultValues: { name: '', country: 'Ghana', region: '', description: '' },
  });
  
  const aeoForm = useForm<AeoSetupFormValues>({
      resolver: zodResolver(aeoSetupSchema),
      defaultValues: { organization: '', assignedRegion: '', assignedDistrict: '' },
  });

  useEffect(() => {
    if (!isProfileLoading) {
      if (!user) {
        router.replace('/auth/signin');
        return;
      }
      
      if (userProfile && (userProfile.farmId || userProfile.role?.includes('Agric Extension Officer'))) {
        const dashboardPath = userProfile.role?.includes('Agric Extension Officer') ? '/aeo/dashboard' : '/dashboard';
        router.replace(dashboardPath);
      }
    }
  }, [user, userProfile, isProfileLoading, router]);

  const handleFarmerSubmit: SubmitHandler<FarmSetupFormValues> = async (data) => {
    if (!user || !userProfile) { 
        toast({ title: "Error", description: "User profile not available. Please try again.", variant: "destructive"});
        return;
    }
    setIsSubmitting(true);
    
    const farmRef = doc(collection(db, 'farms'));
    const userRef = doc(db, 'users', user.uid);

    const newFarm: Omit<Farm, 'id' | 'createdAt'|'updatedAt'> = {
      name: data.name, country: data.country, region: data.region,
      description: data.description || '', ownerId: user.uid, currency: 'GHS'
    };

    try {
      const batch = writeBatch(db);
      batch.set(farmRef, { ...newFarm, id: farmRef.id, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
      
      batch.update(userRef, { 
          farmId: farmRef.id, 
          role: ['Admin'] as UserRole[],
          updatedAt: serverTimestamp()
      });
      
      await batch.commit();
      
      toast({ title: "Farm Created!", description: `Welcome to ${data.name}.` });
      router.push('/dashboard');

    } catch (error: any) {
      console.error("Error creating farm:", error);
      toast({ title: "Error", description: `Failed to create farm: ${error.message}`, variant: "destructive" });
      setIsSubmitting(false);
    }
  };

  const handleAeoSubmit: SubmitHandler<AeoSetupFormValues> = async (data) => {
      if (!user) return;
      setIsSubmitting(true);
      
      const userRef = doc(db, 'users', user.uid);

      try {
          await updateDoc(userRef, {
              role: ['Agric Extension Officer'] as UserRole[],
              assignedRegion: data.assignedRegion,
              assignedDistrict: data.assignedDistrict,
              organization: data.organization || null,
              updatedAt: serverTimestamp(),
          });
          toast({ title: "Profile Set Up!", description: "Your AEO profile is complete. Redirecting to your dashboard." });
          router.push('/aeo/dashboard');

      } catch (error: any) {
          console.error("Error setting up AEO profile:", error);
          toast({ title: "Error", description: `Failed to set up profile: ${error.message}`, variant: "destructive" });
          setIsSubmitting(false);
      }
  };

  if (isProfileLoading || !userProfile) { 
    return (
        <div className="flex flex-col items-center justify-center p-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Finalizing account setup...</p>
        </div>
    );
  }

  if (userProfile.farmId || userProfile.role?.includes('Agric Extension Officer')) {
    return (
      <div className="flex flex-col items-center justify-center p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Setup complete. Redirecting...</p>
      </div>
    );
  }


  if (!setupType) {
      return (
          <Card className="w-full">
              <CardHeader>
                  <CardTitle className="text-2xl font-bold">How will you be using AgriFAAS Connect?</CardTitle>
                  <CardDescription>Select the option that best describes you to tailor your workspace.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button onClick={() => setSetupType('farmer')} className={cn("p-6 border rounded-lg text-left hover:border-primary hover:shadow-lg transition-all flex items-start gap-4")}>
                      <Tractor className="h-8 w-8 text-primary mt-1 shrink-0" />
                      <div>
                          <h3 className="font-semibold text-lg">I am a Farmer</h3>
                          <p className="text-sm text-muted-foreground mt-1">Set up your own private farm, manage operations, and invite your team.</p>
                      </div>
                  </button>
                  <button onClick={() => setSetupType('aeo')} className={cn("p-6 border rounded-lg text-left hover:border-primary hover:shadow-lg transition-all flex items-start gap-4")}>
                      <Handshake className="h-8 w-8 text-primary mt-1 shrink-0" />
                      <div>
                          <h3 className="font-semibold text-lg">I'm an Extension Officer or Cooperative Rep</h3>
                          <p className="text-sm text-muted-foreground mt-1">Set up an AEO account to add and manage farmers in your designated area.</p>
                      </div>
                  </button>
              </CardContent>
          </Card>
      );
  }

  if (setupType === 'farmer') {
      return (
          <Card className="w-full animate-in fade-in-20">
              <CardHeader>
                  <CardTitle className="text-2xl font-bold">Set Up Your Farm Profile</CardTitle>
                  <CardDescription>This information will help identify your farm workspace. You will become the administrator.</CardDescription>
              </CardHeader>
              <Form {...farmForm}>
                  <form onSubmit={farmForm.handleSubmit(handleFarmerSubmit)}>
                      <CardContent className="space-y-6">
                           <FormField control={farmForm.control} name="name" render={({ field }) => (<FormItem><FormLabel>Farm Name*</FormLabel><FormControl><Input placeholder="e.g., Green Valley Farms" {...field} /></FormControl><FormDescription>The official name of your farm or business.</FormDescription><FormMessage /></FormItem>)} />
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <FormField control={farmForm.control} name="country" render={({ field }) => (<FormItem><FormLabel>Country*</FormLabel><FormControl><Input placeholder="e.g., Ghana" {...field} /></FormControl><FormMessage /></FormItem>)} />
                              <FormField control={farmForm.control} name="region" render={({ field }) => (<FormItem><FormLabel>Region*</FormLabel><FormControl><Input placeholder="e.g., Volta Region" {...field} /></FormControl><FormMessage /></FormItem>)} />
                           </div>
                           <FormField control={farmForm.control} name="description" render={({ field }) => (<FormItem><FormLabel>Farm Description (Optional)</FormLabel><FormControl><Textarea placeholder="A brief description of your farm's focus..." {...field} /></FormControl><FormMessage /></FormItem>)} />
                      </CardContent>
                      <CardFooter className="flex justify-between">
                          <Button variant="ghost" onClick={() => setSetupType(null)}>Back</Button>
                          <Button type="submit" disabled={isSubmitting}>
                              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                              {isSubmitting ? 'Creating Farm...' : 'Finish Setup'}
                          </Button>
                      </CardFooter>
                  </form>
              </Form>
          </Card>
      );
  }
  
  if (setupType === 'aeo') {
      return (
          <Card className="w-full animate-in fade-in-20">
              <CardHeader>
                  <CardTitle className="text-2xl font-bold">Set Up Your Extension Officer / Cooperative Profile</CardTitle>
                  <CardDescription>This information will help set up your AEO workspace for managing farmers.</CardDescription>
              </CardHeader>
               <Form {...aeoForm}>
                  <form onSubmit={aeoForm.handleSubmit(handleAeoSubmit)}>
                      <CardContent className="space-y-6">
                          <FormField control={aeoForm.control} name="organization" render={({ field }) => (<FormItem><FormLabel>Organization Name (Optional)</FormLabel><FormControl><Input placeholder="e.g., Ministry of Food and Agriculture, Farmers Co-op Ltd." {...field} /></FormControl><FormDescription>The name of your organization or cooperative.</FormDescription><FormMessage /></FormItem>)} />
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <FormField control={aeoForm.control} name="assignedRegion" render={({ field }) => (<FormItem><FormLabel>Assigned Region*</FormLabel><FormControl><Input placeholder="e.g., Volta Region" {...field} /></FormControl><FormMessage /></FormItem>)} />
                              <FormField control={aeoForm.control} name="assignedDistrict" render={({ field }) => (<FormItem><FormLabel>Assigned District*</FormLabel><FormControl><Input placeholder="e.g., South Tongu" {...field} /></FormControl><FormMessage /></FormItem>)} />
                           </div>
                      </CardContent>
                      <CardFooter className="flex justify-between">
                           <Button variant="ghost" onClick={() => setSetupType(null)}>Back</Button>
                           <Button type="submit" disabled={isSubmitting}>
                              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                              {isSubmitting ? 'Saving Profile...' : 'Complete AEO Setup'}
                          </Button>
                      </CardFooter>
                  </form>
              </Form>
          </Card>
      );
  }

  return null;
}
