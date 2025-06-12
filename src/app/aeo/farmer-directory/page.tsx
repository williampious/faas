
'use client';

import { useState, useEffect } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Users, PlusCircle, Loader2, AlertTriangle, ListFilter, UserPlus, Edit, Eye } from 'lucide-react';
import type { AgriFAASUserProfile, Gender } from '@/types/user';
import { db, isFirebaseClientConfigured } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs, orderBy, doc, setDoc } from 'firebase/firestore';
import { useUserProfile } from '@/contexts/user-profile-context';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription as ShadcnAlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from '@/components/ui/table';
import Link from 'next/link';

const genderOptions: Gender[] = ['Male', 'Female', 'Other', 'PreferNotToSay'];
const usersCollectionName = 'users';

const farmerFormSchema = z.object({
  fullName: z.string().min(2, { message: "Full name must be at least 2 characters." }),
  phoneNumber: z.string().optional().or(z.literal('')),
  emailAddress: z.string().email({ message: "Invalid email address." }).optional().or(z.literal('')),
  gender: z.enum([...genderOptions, ""] as [string, ...string[]]).optional(),
  addressStreet: z.string().optional(),
  addressCity: z.string().optional(),
  addressCommunity: z.string().min(1, { message: "Community is required." }),
  gpsLatitude: z.preprocess(
    (val) => (val === "" ? undefined : parseFloat(String(val))),
    z.number().min(-90).max(90).optional()
  ),
  gpsLongitude: z.preprocess(
    (val) => (val === "" ? undefined : parseFloat(String(val))),
    z.number().min(-180).max(180).optional()
  ),
});

type FarmerFormValues = z.infer<typeof farmerFormSchema>;

export default function FarmerDirectoryPage() {
  const { userProfile: aeoProfile, isLoading: isAeoProfileLoading } = useUserProfile();
  const { toast } = useToast();
  const [farmers, setFarmers] = useState<AgriFAASUserProfile[]>([]);
  const [isLoadingFarmers, setIsLoadingFarmers] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddFarmerModalOpen, setIsAddFarmerModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FarmerFormValues>({
    resolver: zodResolver(farmerFormSchema),
    defaultValues: {
      fullName: '',
      phoneNumber: '',
      emailAddress: '',
      gender: '',
      addressStreet: '',
      addressCity: '',
      addressCommunity: '',
      gpsLatitude: undefined,
      gpsLongitude: undefined,
    },
  });

  useEffect(() => {
    const fetchFarmers = async () => {
      if (isAeoProfileLoading || !aeoProfile || !aeoProfile.userId) {
        // Wait for AEO profile to load or if AEO is not defined, do nothing.
        if(!isAeoProfileLoading && !aeoProfile) setError("AEO profile not found. Cannot fetch farmers.");
        setIsLoadingFarmers(false);
        return;
      }
      if (!db) {
        setError("Firestore database is not available.");
        setIsLoadingFarmers(false);
        return;
      }

      setIsLoadingFarmers(true);
      setError(null);
      try {
        // Query for farmers managed by this AEO OR in the AEO's region/district
        // For simplicity, starting with managedByAEO
        const q = query(
          collection(db, usersCollectionName),
          where('managedByAEO', '==', aeoProfile.userId),
          orderBy('fullName')
        );
        const querySnapshot = await getDocs(q);
        const fetchedFarmers = querySnapshot.docs.map(doc => ({ userId: doc.id, ...doc.data() } as AgriFAASUserProfile));
        setFarmers(fetchedFarmers);
      } catch (err: any) {
        console.error("Error fetching farmers:", err);
        setError(`Failed to fetch farmers: ${err.message}`);
      } finally {
        setIsLoadingFarmers(false);
      }
    };

    fetchFarmers();
  }, [aeoProfile, isAeoProfileLoading]);

  const onSubmit: SubmitHandler<FarmerFormValues> = async (data) => {
    if (!aeoProfile || !aeoProfile.userId || !aeoProfile.assignedRegion || !aeoProfile.assignedDistrict) {
      toast({ title: "Error", description: "AEO profile data is incomplete (missing ID, region, or district). Cannot add farmer.", variant: "destructive" });
      return;
    }
    if (!db) {
      toast({ title: "Error", description: "Database not available.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    const farmerId = crypto.randomUUID();

    const newFarmerProfile: AgriFAASUserProfile = {
      userId: farmerId,
      firebaseUid: farmerId, // Placeholder until actual auth user is created
      fullName: data.fullName,
      phoneNumber: data.phoneNumber || undefined,
      emailAddress: data.emailAddress || undefined,
      gender: data.gender as Gender || undefined,
      address: {
        street: data.addressStreet || undefined,
        city: data.addressCity || undefined,
        community: data.addressCommunity,
        region: aeoProfile.assignedRegion, // Farmer's region set to AEO's region
        country: 'Ghana', // Default country
      },
      gpsCoordinates: (data.gpsLatitude !== undefined && data.gpsLongitude !== undefined)
        ? { latitude: data.gpsLatitude, longitude: data.gpsLongitude }
        : undefined,
      role: ['Farmer'],
      accountStatus: 'PendingVerification',
      registrationDate: new Date().toISOString(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      managedByAEO: aeoProfile.userId,
      assignedRegion: aeoProfile.assignedRegion,
      assignedDistrict: aeoProfile.assignedDistrict,
      initialAeoRegion: aeoProfile.assignedRegion,
      initialAeoDistrict: aeoProfile.assignedDistrict,
      avatarUrl: `https://placehold.co/100x100.png?text=${data.fullName.charAt(0)}`,
    };

    try {
      await setDoc(doc(db, usersCollectionName, farmerId), newFarmerProfile);
      toast({ title: "Farmer Added", description: `${data.fullName} has been successfully added.` });
      setFarmers(prev => [...prev, { ...newFarmerProfile, userId: farmerId, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }].sort((a,b) => a.fullName.localeCompare(b.fullName)));
      setIsAddFarmerModalOpen(false);
      form.reset();
    } catch (err: any) {
      console.error("Error adding farmer:", err);
      toast({ title: "Error Adding Farmer", description: err.message || "Could not add farmer.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };


  if (isAeoProfileLoading) {
     return (
      <div className="flex justify-center items-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">Loading AEO profile...</p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Farmer Directory"
        icon={Users}
        description="Manage farmer profiles, track assignments, and organize contact information."
        action={
          <div className="flex gap-2">
            <Button variant="outline" disabled>
              <ListFilter className="mr-2 h-4 w-4" /> Filter (Soon)
            </Button>
            <Button onClick={() => setIsAddFarmerModalOpen(true)}>
              <UserPlus className="mr-2 h-4 w-4" /> Add New Farmer
            </Button>
          </div>
        }
      />

      <Dialog open={isAddFarmerModalOpen} onOpenChange={(isOpen) => {
        if (isSubmitting && !isOpen) return; // Prevent closing while submitting
        setIsAddFarmerModalOpen(isOpen);
        if (!isOpen) form.reset();
      }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Farmer</DialogTitle>
            <DialogDescription>Enter the details for the new farmer. Fields marked with * are required.</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
              <FormField control={form.control} name="fullName" render={({ field }) => (
                <FormItem><FormLabel>Full Name*</FormLabel><FormControl><Input placeholder="John K. Mensah" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="phoneNumber" render={({ field }) => (
                <FormItem><FormLabel>Phone Number</FormLabel><FormControl><Input type="tel" placeholder="024 XXX XXXX" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="emailAddress" render={({ field }) => (
                <FormItem><FormLabel>Email Address (Optional)</FormLabel><FormControl><Input type="email" placeholder="farmer@example.com" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="gender" render={({ field }) => (
                <FormItem><FormLabel>Gender</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {/* <SelectItem value="">Prefer not to say</SelectItem> Removed this line */}
                      {genderOptions.map(option => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                    </SelectContent>
                  </Select><FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="addressCommunity" render={({ field }) => (
                <FormItem><FormLabel>Community*</FormLabel><FormControl><Input placeholder="e.g., Adidome" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="addressStreet" render={({ field }) => (
                <FormItem><FormLabel>Street Address (Optional)</FormLabel><FormControl><Input placeholder="House No. / Street Name" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="addressCity" render={({ field }) => (
                <FormItem><FormLabel>City/Town (Optional)</FormLabel><FormControl><Input placeholder="e.g., Sogakope" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="gpsLatitude" render={({ field }) => (
                  <FormItem><FormLabel>GPS Latitude (Optional)</FormLabel><FormControl><Input type="number" step="any" placeholder="e.g., 5.95" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="gpsLongitude" render={({ field }) => (
                  <FormItem><FormLabel>GPS Longitude (Optional)</FormLabel><FormControl><Input type="number" step="any" placeholder="e.g., 0.58" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Farmer's region and district will be automatically set to your assigned region: <strong>{aeoProfile?.assignedRegion || 'N/A'}</strong> and district: <strong>{aeoProfile?.assignedDistrict || 'N/A'}</strong>.
              </p>
            <DialogFooter className="mt-4">
              <DialogClose asChild><Button type="button" variant="outline" disabled={isSubmitting}>Cancel</Button></DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? 'Adding Farmer...' : 'Add Farmer'}
              </Button>
            </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {error && (
        <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <ShadcnAlertDescription>{error}</ShadcnAlertDescription>
        </Alert>
      )}

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Registered Farmers</CardTitle>
          <CardDescription>
            {isLoadingFarmers ? "Loading farmer data..." : 
             farmers.length > 0 ? `Showing farmers associated with your region/district.` 
                                : "No farmers found associated with you yet. Use 'Add New Farmer' to get started."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingFarmers ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-2 text-muted-foreground">Loading farmers...</p>
            </div>
          ) : farmers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Full Name</TableHead>
                  <TableHead>Community</TableHead>
                  <TableHead>Phone Number</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {farmers.map((farmer) => (
                  <TableRow key={farmer.userId}>
                    <TableCell className="font-medium">{farmer.fullName}</TableCell>
                    <TableCell>{farmer.address?.community || 'N/A'}</TableCell>
                    <TableCell>{farmer.phoneNumber || 'N/A'}</TableCell>
                    <TableCell className="text-right space-x-2">
                       <Link href={`/aeo/farmer-profile/${farmer.userId}`} passHref>
                        <Button variant="outline" size="sm">
                          <Eye className="h-3.5 w-3.5 mr-1" /> View
                        </Button>
                      </Link>
                      <Button variant="outline" size="sm" disabled> {/* Placeholder for Edit */}
                        <Edit className="h-3.5 w-3.5 mr-1" /> Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground text-center py-4">
              No farmers registered under your supervision yet.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
