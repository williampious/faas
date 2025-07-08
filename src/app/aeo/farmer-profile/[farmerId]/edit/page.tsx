
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { useUserProfile } from '@/contexts/user-profile-context';
import { db, isFirebaseClientConfigured } from '@/lib/firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Loader2, AlertTriangle, User, ArrowLeft, Save, XCircle, CalendarIcon } from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';
import { cn } from '@/lib/utils';
import type { AgriFAASUserProfile, Gender } from '@/types/user';

const genderOptions: Gender[] = ['Male', 'Female', 'Other', 'PreferNotToSay'];

const farmerEditSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters."),
  phoneNumber: z.string().optional().or(z.literal('')),
  emailAddress: z.string().email({ message: "Invalid email address." }).optional().or(z.literal('')),
  dateOfBirth: z.date().optional(),
  gender: z.enum([...genderOptions, ""] as [string, ...string[]]).optional(),
  
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    community: z.string().min(1, "Community is required."),
  }).optional(),

  gpsCoordinates: z.object({
    latitude: z.preprocess(
      (val) => (val === "" || val === null || val === undefined ? undefined : parseFloat(String(val))),
      z.number().min(-90).max(90).optional()
    ),
    longitude: z.preprocess(
      (val) => (val === "" || val === null || val === undefined ? undefined : parseFloat(String(val))),
      z.number().min(-180).max(180).optional()
    ),
  }).optional(),

  farmDetails: z.object({
      allocatedLandSizeAcres: z.preprocess(
        (val) => (val === "" || val === null || val === undefined ? undefined : parseFloat(String(val))),
        z.number().min(0).optional()
      ),
      cropTypesBeingGrown: z.string().optional(),
      soilType: z.string().optional(),
      irrigationAccess: z.boolean().optional(),
      farmingTechniquesUsed: z.string().optional(),
  }).optional(),

  farmChallenges: z.string().optional(),
  farmerNeeds: z.string().optional(),
});

type FarmerEditFormValues = z.infer<typeof farmerEditSchema>;


export default function EditFarmerProfilePage() {
  const params = useParams();
  const router = useRouter();
  const farmerId = params.farmerId as string;
  const { toast } = useToast();
  const { userProfile: aeoProfile, isLoading: isAeoProfileLoading } = useUserProfile();
  const [farmer, setFarmer] = useState<AgriFAASUserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FarmerEditFormValues>({
    resolver: zodResolver(farmerEditSchema),
    defaultValues: {},
  });

  useEffect(() => {
    if (!farmerId) {
      setError("Farmer ID is missing from the URL.");
      setIsLoading(false);
      return;
    }
    if (isAeoProfileLoading) return;

    if (!aeoProfile) {
      setError("Your AEO profile is not loaded. Cannot verify permissions.");
      setIsLoading(false);
      return;
    }

    const fetchFarmer = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const farmerDocRef = doc(db, 'users', farmerId);
        const docSnap = await getDoc(farmerDocRef);

        if (docSnap.exists()) {
          const farmerData = { userId: docSnap.id, ...docSnap.data() } as AgriFAASUserProfile;
          if (farmerData.managedByAEO !== aeoProfile.userId) {
            setError("You are not authorized to edit this farmer's profile.");
            setFarmer(null);
          } else {
            setFarmer(farmerData);
            form.reset({
              fullName: farmerData.fullName,
              phoneNumber: farmerData.phoneNumber || '',
              emailAddress: farmerData.emailAddress || '',
              dateOfBirth: farmerData.dateOfBirth && isValid(parseISO(farmerData.dateOfBirth)) ? parseISO(farmerData.dateOfBirth) : undefined,
              gender: farmerData.gender || '',
              address: {
                street: farmerData.address?.street || '',
                city: farmerData.address?.city || '',
                community: farmerData.address?.community || '',
              },
              gpsCoordinates: {
                latitude: farmerData.gpsCoordinates?.latitude,
                longitude: farmerData.gpsCoordinates?.longitude,
              },
              farmDetails: {
                allocatedLandSizeAcres: farmerData.farmDetails?.allocatedLandSizeAcres,
                cropTypesBeingGrown: farmerData.farmDetails?.cropTypesBeingGrown?.join('\n') || '',
                soilType: farmerData.farmDetails?.soilType || '',
                irrigationAccess: farmerData.farmDetails?.irrigationAccess || false,
                farmingTechniquesUsed: farmerData.farmDetails?.farmingTechniquesUsed?.join('\n') || '',
              },
              farmChallenges: farmerData.farmChallenges?.join('\n') || '',
              farmerNeeds: farmerData.farmerNeeds?.join('\n') || '',
            });
          }
        } else {
          setError("Farmer profile not found.");
        }
      } catch (err: any) {
        console.error("Error fetching farmer profile for edit:", err);
        setError(`Failed to fetch profile: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFarmer();
  }, [farmerId, aeoProfile, isAeoProfileLoading, form]);

  const onSubmit: SubmitHandler<FarmerEditFormValues> = async (data) => {
    if (!farmerId) {
      toast({ title: "Error", description: "Farmer ID is missing.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      const dataToUpdate: Partial<AgriFAASUserProfile> = {
        ...data,
        dateOfBirth: data.dateOfBirth ? format(data.dateOfBirth, 'yyyy-MM-dd') : undefined,
        farmDetails: {
          ...farmer?.farmDetails,
          ...data.farmDetails,
          cropTypesBeingGrown: data.farmDetails?.cropTypesBeingGrown?.split('\n').filter(Boolean) || [],
          farmingTechniquesUsed: data.farmDetails?.farmingTechniquesUsed?.split('\n').filter(Boolean) || [],
        },
        farmChallenges: data.farmChallenges?.split('\n').filter(Boolean) || [],
        farmerNeeds: data.farmerNeeds?.split('\n').filter(Boolean) || [],
        updatedAt: serverTimestamp(),
      };
      
      const userDocRef = doc(db, 'users', farmerId);
      await updateDoc(userDocRef, dataToUpdate);
      toast({ title: "Profile Updated", description: `${data.fullName}'s profile has been successfully updated.` });
      router.push(`/aeo/farmer-profile/${farmerId}`);
    } catch (err: any) {
      console.error("Error updating farmer profile:", err);
      toast({ title: "Update Failed", description: err.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || isAeoProfileLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="ml-3 text-lg text-muted-foreground">Loading farmer data for editing...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-10">
        <Card className="max-w-xl mx-auto"><CardHeader><CardTitle className="flex items-center text-destructive"><AlertTriangle className="mr-2"/>Error</CardTitle></CardHeader><CardContent><p>{error}</p></CardContent></Card>
      </div>
    );
  }
  
  if (!farmer) {
      return (
          <div className="container mx-auto py-10 text-center">
              <User className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-xl text-muted-foreground">Farmer profile could not be loaded for editing.</p>
          </div>
      );
  }


  return (
    <div>
      <PageHeader
        title={`Edit Profile: ${farmer.fullName}`}
        icon={User}
        description="Update the farmer's information as needed."
        action={
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Cancel
            </Button>
        }
      />
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <Card>
                <CardHeader><CardTitle>Personal Information</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                     <FormField control={form.control} name="fullName" render={({ field }) => (<FormItem><FormLabel>Full Name*</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                     <FormField control={form.control} name="phoneNumber" render={({ field }) => (<FormItem><FormLabel>Phone</FormLabel><FormControl><Input type="tel" {...field} /></FormControl><FormMessage /></FormItem>)} />
                     <FormField control={form.control} name="emailAddress" render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>)} />
                     <FormField control={form.control} name="dateOfBirth" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>Date of Birth</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant="outline" className={cn("w-[240px] pl-3 text-left font-normal",!field.value && "text-muted-foreground")}>{field.value ? format(field.value, "PPP"): <span>Pick a date</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date > new Date() || date < new Date("1900-01-01")} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>)} />
                     <FormField control={form.control} name="gender" render={({ field }) => (<FormItem><FormLabel>Gender</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger></FormControl><SelectContent>{genderOptions.map(option => <SelectItem key={option} value={option}>{option}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                </CardContent>
            </Card>

            <Card>
                 <CardHeader><CardTitle>Location Details</CardTitle></CardHeader>
                 <CardContent className="space-y-4">
                    <FormField control={form.control} name="address.community" render={({ field }) => (<FormItem><FormLabel>Community*</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="address.city" render={({ field }) => (<FormItem><FormLabel>City/Town</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="address.street" render={({ field }) => (<FormItem><FormLabel>Street Address</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <div className="grid grid-cols-2 gap-4">
                         <FormField control={form.control} name="gpsCoordinates.latitude" render={({ field }) => (<FormItem><FormLabel>GPS Latitude</FormLabel><FormControl><Input type="number" step="any" {...field} /></FormControl><FormMessage /></FormItem>)} />
                         <FormField control={form.control} name="gpsCoordinates.longitude" render={({ field }) => (<FormItem><FormLabel>GPS Longitude</FormLabel><FormControl><Input type="number" step="any" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    </div>
                 </CardContent>
            </Card>
            
            <Card>
                <CardHeader><CardTitle>Farming Details</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                     <FormField control={form.control} name="farmDetails.allocatedLandSizeAcres" render={({ field }) => (<FormItem><FormLabel>Land Size (Acres)</FormLabel><FormControl><Input type="number" step="any" {...field} /></FormControl><FormMessage /></FormItem>)} />
                     <FormField control={form.control} name="farmDetails.soilType" render={({ field }) => (<FormItem><FormLabel>Soil Type</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                     <FormField control={form.control} name="farmDetails.cropTypesBeingGrown" render={({ field }) => (<FormItem><FormLabel>Crops Grown</FormLabel><FormControl><Textarea placeholder="List each crop on a new line" {...field} /></FormControl><FormDescription>One crop per line.</FormDescription><FormMessage /></FormItem>)} />
                     <FormField control={form.control} name="farmDetails.farmingTechniquesUsed" render={({ field }) => (<FormItem><FormLabel>Farming Techniques</FormLabel><FormControl><Textarea placeholder="List each technique on a new line" {...field} /></FormControl><FormDescription>e.g., No-till, Crop Rotation. One per line.</FormDescription><FormMessage /></FormItem>)} />
                     <FormField control={form.control} name="farmDetails.irrigationAccess" render={({ field }) => (<FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><div className="space-y-1 leading-none"><FormLabel>Has Irrigation Access</FormLabel></div></FormItem>)} />
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle>Challenges & Needs</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <FormField control={form.control} name="farmChallenges" render={({ field }) => (<FormItem><FormLabel>Farm Challenges</FormLabel><FormControl><Textarea placeholder="List each challenge on a new line" {...field} /></FormControl><FormDescription>One challenge per line.</FormDescription><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="farmerNeeds" render={({ field }) => (<FormItem><FormLabel>Farmer Needs</FormLabel><FormControl><Textarea placeholder="List each need on a new line" {...field} /></FormControl><FormDescription>One need per line.</FormDescription><FormMessage /></FormItem>)} />
                </CardContent>
            </Card>

            <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="ghost" onClick={() => router.back()} disabled={isSubmitting}>
                  <XCircle className="mr-2 h-4 w-4" /> Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save Changes
                </Button>
            </div>
        </form>
      </Form>
    </div>
  );
}
