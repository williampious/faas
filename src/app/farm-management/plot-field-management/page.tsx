
'use client';

import { useState, useEffect } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from '@/components/ui/table';
import { LayoutGrid, PlusCircle, Edit2, Trash2, ArrowLeft, MapPin, Loader2, AlertTriangle, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import type { PlotField } from '@/types/farm';
import { useUserProfile } from '@/contexts/user-profile-context';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { Alert, AlertTitle, AlertDescription as ShadcnAlertDescription } from '@/components/ui/alert';
import Link from 'next/link';

const plotFieldFormSchema = z.object({
  name: z.string().min(2, { message: "Plot name must be at least 2 characters." }).max(100),
  description: z.string().max(500).optional(),
  sizeAcres: z.preprocess(
    (val) => (val === "" ? undefined : parseFloat(String(val))),
    z.number().min(0.01, "Size must be greater than 0.").optional()
  ),
  locationNotes: z.string().max(250).optional(),
  gpsCoordinates: z.object({
    latitude: z.preprocess(
      (val) => (val === "" ? undefined : parseFloat(String(val))),
      z.number().min(-90).max(90).optional()
    ),
    longitude: z.preprocess(
      (val) => (val === "" ? undefined : parseFloat(String(val))),
      z.number().min(-180).max(180).optional()
    ),
  }).optional(),
  soilType: z.string().max(100).optional(),
});

type PlotFieldFormValues = z.infer<typeof plotFieldFormSchema>;

const PLOT_FORM_ID = 'plot-field-form';
const TENANTS_COLLECTION = 'tenants'; // New top-level collection
const PLOTS_SUBCOLLECTION = 'plots'; // New subcollection name

export default function PlotFieldManagementPage() {
  const [plots, setPlots] = useState<PlotField[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlot, setEditingPlot] = useState<PlotField | null>(null);
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { userProfile, isLoading: isProfileLoading } = useUserProfile();

  const form = useForm<PlotFieldFormValues>({
    resolver: zodResolver(plotFieldFormSchema),
    defaultValues: {
      name: '', description: '', sizeAcres: undefined, locationNotes: '',
      gpsCoordinates: { latitude: undefined, longitude: undefined }, soilType: '',
    },
  });

  const tenantId = userProfile?.farmId; // Using farmId as the tenantId
  const isStarterPlan = userProfile?.subscription?.planId === 'starter';
  const hasReachedPlotLimit = isStarterPlan && plots.length >= 1;

  useEffect(() => {
    if (isProfileLoading) return;
    if (!tenantId) {
      setError("Tenant (Farm) information is not available. Cannot load plot data.");
      setIsLoading(false);
      return;
    }

    const fetchPlots = async () => {
      setIsLoading(true);
      setError(null);
      try {
        if (!tenantId) throw new Error("User is not associated with a tenant.");
        
        const plotsPath = `${TENANTS_COLLECTION}/${tenantId}/${PLOTS_SUBCOLLECTION}`;
        const plotsQuery = query(collection(db, plotsPath));

        const querySnapshot = await getDocs(plotsQuery);
        const fetchedPlots = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as PlotField[];
        setPlots(fetchedPlots);
      } catch (err: any) {
        console.error("Error fetching plots:", err);
        setError(`Failed to fetch plot data. Please check your connection and security rules. Error: ${err.message}`);
        toast({ title: "Error", description: "Could not fetch plot data.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlots();
  }, [userProfile, isProfileLoading, toast, tenantId]);


  const handleOpenModal = (plotToEdit?: PlotField) => {
    if (hasReachedPlotLimit && !plotToEdit) {
        toast({
            title: "Plot Limit Reached",
            description: "The Starter plan allows for only 1 plot. Please upgrade to add more.",
            variant: "destructive"
        });
        return;
    }

    if (plotToEdit) {
      setEditingPlot(plotToEdit);
      form.reset({
        name: plotToEdit.name,
        description: plotToEdit.description || '',
        sizeAcres: plotToEdit.sizeAcres,
        locationNotes: plotToEdit.locationNotes || '',
        gpsCoordinates: {
          latitude: plotToEdit.gpsCoordinates?.latitude,
          longitude: plotToEdit.gpsCoordinates?.longitude,
        },
        soilType: plotToEdit.soilType || '',
      });
    } else {
      setEditingPlot(null);
      form.reset({
        name: '', description: '', sizeAcres: undefined, locationNotes: '',
        gpsCoordinates: { latitude: undefined, longitude: undefined }, soilType: '',
      });
    }
    setIsModalOpen(true);
  };

  const onSubmit: SubmitHandler<PlotFieldFormValues> = async (data) => {
    if (!tenantId) {
      toast({ title: "Error", description: "Cannot save plot. Tenant (Farm) ID is missing.", variant: "destructive" });
      return;
    }

    const gpsCoords = 
      (data.gpsCoordinates?.latitude !== undefined && data.gpsCoordinates?.longitude !== undefined) ||
      (data.gpsCoordinates?.latitude === 0 && data.gpsCoordinates?.longitude === 0)
      ? { latitude: data.gpsCoordinates.latitude, longitude: data.gpsCoordinates.longitude } 
      : undefined;

    const plotData = {
      ...data,
      gpsCoordinates: gpsCoords,
      updatedAt: serverTimestamp(),
    };

    const plotsPath = `${TENANTS_COLLECTION}/${tenantId}/${PLOTS_SUBCOLLECTION}`;

    try {
      if (editingPlot) {
        const plotDocRef = doc(db, plotsPath, editingPlot.id);
        await updateDoc(plotDocRef, plotData);
        setPlots(plots.map((p) => p.id === editingPlot.id ? { ...p, ...data, tenantId: p.tenantId, gpsCoordinates: gpsCoords } : p));
        toast({ title: "Plot Updated", description: `Plot "${data.name}" has been updated.` });
      } else {
        const docRef = await addDoc(collection(db, plotsPath), {
            ...plotData,
            createdAt: serverTimestamp(),
        });
        const newPlot: PlotField = { id: docRef.id, tenantId, ...plotData, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
        setPlots(prev => [...prev, newPlot]);
        toast({ title: "Plot Added", description: `Plot "${data.name}" has been added.` });
      }
      setIsModalOpen(false);
      setEditingPlot(null);
      form.reset();
    } catch (err: any) {
       console.error("Error saving plot:", err);
       toast({ title: "Save Failed", description: `Could not save plot. Error: ${err.message}`, variant: "destructive" });
    }
  };

  const handleDeletePlot = async (id: string) => {
    if (!tenantId) return;
    const plotToDelete = plots.find(p => p.id === id);
    if (!plotToDelete) return;
    
    try {
      const plotsPath = `${TENANTS_COLLECTION}/${tenantId}/${PLOTS_SUBCOLLECTION}`;
      await deleteDoc(doc(db, plotsPath, id));
      setPlots(plots.filter((p) => p.id !== id));
      toast({ title: "Plot Deleted", description: `Plot "${plotToDelete.name}" has been removed.`, variant: "destructive" });
    } catch (err: any) {
      console.error("Error deleting plot:", err);
      toast({ title: "Deletion Failed", description: `Could not delete plot. Error: ${err.message}`, variant: "destructive" });
    }
  };

  if (isProfileLoading || (isLoading && !error)) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-12rem)]">
        <Loader2 className="h-12 w-12 text-primary animate-pulse" />
        <p className="ml-3 text-lg text-muted-foreground">Loading plot data...</p>
      </div>
    );
  }
  
  if (error) {
     return (
        <div className="container mx-auto py-10">
         <Card className="w-full max-w-lg mx-auto text-center shadow-lg">
            <CardHeader>
                <CardTitle className="flex items-center justify-center text-xl text-destructive">
                    <AlertTriangle className="mr-2 h-6 w-6" />
                    Data Loading Error
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground mb-2">{error}</p>
                <p className="mt-4 text-sm text-muted-foreground">Please ensure your Firestore security rules allow reading from the 'plots' collection.</p>
            </CardContent>
         </Card>
        </div>
     );
  }

  return (
    <div>
      <PageHeader
        title="Plot/Field Management"
        icon={LayoutGrid}
        description="Define, map, and manage individual farm plots or fields."
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push('/farm-management')}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Farm Management
            </Button>
            <Button onClick={() => handleOpenModal()} disabled={hasReachedPlotLimit}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add New Plot/Field
            </Button>
          </div>
        }
      />

      {hasReachedPlotLimit && (
        <Alert className="mb-6 bg-yellow-50 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700">
            <Sparkles className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            <AlertTitle className="text-yellow-800 dark:text-yellow-200">Starter Plan Limit Reached</AlertTitle>
            <ShadcnAlertDescription className="text-yellow-700 dark:text-yellow-300">
                You have reached the 1-plot limit for the Starter plan. To manage more plots, please upgrade your subscription.
                <Link href="/settings/billing">
                  <Button variant="link" className="p-0 h-auto ml-1 text-yellow-800 dark:text-yellow-200 font-bold">Upgrade Plan</Button>
                </Link>
            </ShadcnAlertDescription>
        </Alert>
      )}

      <Dialog open={isModalOpen} onOpenChange={(isOpen) => {
        setIsModalOpen(isOpen);
        if (!isOpen) { form.reset(); setEditingPlot(null); }
      }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{editingPlot ? 'Edit Plot/Field' : 'Add New Plot/Field'}</DialogTitle>
          </DialogHeader>
          <div className="flex-grow overflow-y-auto pr-2 py-4">
            <Form {...form}>
              <form id={PLOT_FORM_ID} onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem><FormLabel>Plot/Field Name*</FormLabel><FormControl><Input placeholder="e.g., North Field, Plot A" {...field} /></FormControl><FormMessage /></FormItem>)}
                />
                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem><FormLabel>Description (Optional)</FormLabel><FormControl><Textarea placeholder="Brief description of the plot" {...field} /></FormControl><FormMessage /></FormItem>)}
                />
                <FormField control={form.control} name="sizeAcres" render={({ field }) => (
                  <FormItem><FormLabel>Size (Acres, Optional)</FormLabel><FormControl><Input type="number" step="0.01" placeholder="e.g., 5.25" {...field} /></FormControl><FormMessage /></FormItem>)}
                />
                <FormField control={form.control} name="locationNotes" render={({ field }) => (
                  <FormItem><FormLabel>Location Notes (Optional)</FormLabel><FormControl><Input placeholder="e.g., Behind the main barn, near river" {...field} /></FormControl><FormMessage /></FormItem>)}
                />
                <FormField control={form.control} name="soilType" render={({ field }) => (
                  <FormItem><FormLabel>Soil Type (Optional)</FormLabel><FormControl><Input placeholder="e.g., Loamy, Clay, Sandy Loam" {...field} /></FormControl><FormMessage /></FormItem>)}
                />
                <Card className="p-3 bg-muted/30">
                  <CardDescription className="mb-2 text-xs flex items-center"><MapPin className="h-3 w-3 mr-1"/>GPS Coordinates (Optional)</CardDescription>
                  <div className="grid grid-cols-2 gap-3">
                    <FormField control={form.control} name="gpsCoordinates.latitude" render={({ field }) => (
                      <FormItem><FormLabel className="text-xs">Latitude</FormLabel><FormControl><Input type="number" step="any" placeholder="e.g., 5.9523" {...field} /></FormControl><FormMessage /></FormItem>)}
                    />
                    <FormField control={form.control} name="gpsCoordinates.longitude" render={({ field }) => (
                      <FormItem><FormLabel className="text-xs">Longitude</FormLabel><FormControl><Input type="number" step="any" placeholder="e.g., 0.5871" {...field} /></FormControl><FormMessage /></FormItem>)}
                    />
                  </div>
                </Card>
              </form>
            </Form>
          </div>
          <DialogFooter className="border-t pt-4">
            <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
            <Button type="submit" form={PLOT_FORM_ID}>
              {editingPlot ? 'Save Changes' : 'Add Plot/Field'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Existing Plots/Fields</CardTitle>
          <CardDescription>
            {plots.length > 0 ? "Manage your farm plots and fields." : "No plots/fields defined yet."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {plots.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Size (Acres)</TableHead>
                  <TableHead>Soil Type</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plots.sort((a,b) => a.name.localeCompare(b.name)).map((plot) => (
                  <TableRow key={plot.id}>
                    <TableCell className="font-medium">{plot.name}</TableCell>
                    <TableCell>{plot.sizeAcres !== undefined ? plot.sizeAcres.toFixed(2) : 'N/A'}</TableCell>
                    <TableCell>{plot.soilType || 'N/A'}</TableCell>
                    <TableCell>{plot.locationNotes || 'N/A'}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleOpenModal(plot)}>
                        <Edit2 className="h-3.5 w-3.5 mr-1" /> Edit
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDeletePlot(plot.id)}>
                        <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-10">
              <LayoutGrid className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">No plots or fields have been added yet.</p>
              <p className="text-sm text-muted-foreground">Click "Add New Plot/Field" to get started.</p>
            </div>
          )}
        </CardContent>
      </Card>
       <Card className="mt-6 bg-muted/30 p-4">
        <CardHeader className="p-0 pb-2">
            <CardTitle className="text-base font-semibold text-muted-foreground">Architectural Note</CardTitle>
        </CardHeader>
        <CardContent className="p-0 text-xs text-muted-foreground space-y-1">
            <p>&bull; This module has been migrated to the new multi-tenant data model.</p>
            <p>&bull; All plot data is now stored in a subcollection under your unique tenant (farm) ID: `/tenants/{your_farm_id}/plots`.</p>
            <p>&bull; This improves data isolation and scalability, preparing the app for managing multiple farms under one platform.</p>
        </CardContent>
      </Card>
    </div>
  );
}
