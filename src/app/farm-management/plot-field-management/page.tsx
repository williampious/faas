
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
import { LayoutGrid, PlusCircle, Edit2, Trash2, ArrowLeft, MapPin } from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import type { PlotField } from '@/types/farm';

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

const LOCAL_STORAGE_KEY = 'farmPlots_v1';
const PLOT_FORM_ID = 'plot-field-form';

export default function PlotFieldManagementPage() {
  const [plots, setPlots] = useState<PlotField[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlot, setEditingPlot] = useState<PlotField | null>(null);
  const { toast } = useToast();
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();

  const form = useForm<PlotFieldFormValues>({
    resolver: zodResolver(plotFieldFormSchema),
    defaultValues: {
      name: '', description: '', sizeAcres: undefined, locationNotes: '',
      gpsCoordinates: { latitude: undefined, longitude: undefined }, soilType: '',
    },
  });

  useEffect(() => {
    setIsMounted(true);
    const storedPlots = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (storedPlots) {
      setPlots(JSON.parse(storedPlots));
    }
  }, []);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(plots));
    }
  }, [plots, isMounted]);

  const handleOpenModal = (plotToEdit?: PlotField) => {
    if (plotToEdit) {
      setEditingPlot(plotToEdit);
      form.reset({
        name: plotToEdit.name, description: plotToEdit.description || '',
        sizeAcres: plotToEdit.sizeAcres, locationNotes: plotToEdit.locationNotes || '',
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

  const onSubmit: SubmitHandler<PlotFieldFormValues> = (data) => {
    const now = new Date().toISOString();
    const gpsCoords = 
      (data.gpsCoordinates?.latitude !== undefined && data.gpsCoordinates?.longitude !== undefined) ||
      (data.gpsCoordinates?.latitude === 0 && data.gpsCoordinates?.longitude === 0)
      ? { latitude: data.gpsCoordinates.latitude, longitude: data.gpsCoordinates.longitude } 
      : undefined;


    if (editingPlot) {
      setPlots(
        plots.map((p) =>
          p.id === editingPlot.id
            ? { ...editingPlot, ...data, gpsCoordinates: gpsCoords, updatedAt: now }
            : p
        )
      );
      toast({ title: "Plot Updated", description: `Plot "${data.name}" has been updated.` });
    } else {
      const newPlot: PlotField = {
        id: crypto.randomUUID(), ...data, sizeAcres: data.sizeAcres,
        gpsCoordinates: gpsCoords, createdAt: now, updatedAt: now,
      };
      setPlots((prev) => [...prev, newPlot]);
      toast({ title: "Plot Added", description: `Plot "${data.name}" has been added.` });
    }
    setIsModalOpen(false);
    setEditingPlot(null);
    form.reset();
  };

  const handleDeletePlot = (id: string) => {
    const plotToDelete = plots.find(p => p.id === id);
    setPlots(plots.filter((p) => p.id !== id));
    toast({ title: "Plot Deleted", description: `Plot "${plotToDelete?.name}" has been removed.`, variant: "destructive" });
  };

  if (!isMounted) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-12rem)]">
        <LayoutGrid className="h-12 w-12 text-primary animate-pulse" />
        <p className="ml-3 text-lg text-muted-foreground">Loading plot data...</p>
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
            <Button onClick={() => handleOpenModal()}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add New Plot/Field
            </Button>
          </div>
        }
      />

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
            <CardTitle className="text-base font-semibold text-muted-foreground">Plot/Field Management Notes</CardTitle>
        </CardHeader>
        <CardContent className="p-0 text-xs text-muted-foreground space-y-1">
            <p>&bull; Define each distinct area of your farm here. This helps in organizing activities and tracking per-plot data.</p>
            <p>&bull; Details like size, soil type, and location notes are valuable for planning and record-keeping.</p>
            <p>&bull; GPS coordinates can be useful for mapping and precision agriculture in the future.</p>
            <p>&bull; Future enhancements will link plots to crop history, activities, and soil test results.</p>
        </CardContent>
      </Card>
    </div>
  );
}
