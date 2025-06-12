
'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@/components/layout/page-header';
import { ShieldAlert, PlusCircle, Trash2, Edit2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format, parseISO, isValid } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';

const maintenanceActivityTypes = [
  'Irrigation', 
  'Fertilization', 
  'Pest Control', 
  'Disease Control', 
  'Weeding', 
  'Pruning', 
  'Growth Monitoring',
  'Soil Testing',
  'Other'
] as const;
type CropMaintenanceActivityType = typeof maintenanceActivityTypes[number];

const costItemSchema = z.object({
  id: z.string().optional(),
  description: z.string().min(1, "Description is required.").max(100),
  unit: z.string().min(1, "Unit is required.").max(20),
  quantity: z.preprocess(
    (val) => parseFloat(String(val)),
    z.number().min(0.01, "Quantity must be greater than 0.")
  ),
  unitPrice: z.preprocess(
    (val) => parseFloat(String(val)),
    z.number().min(0.01, "Unit price must be greater than 0.")
  ),
  total: z.number().optional(),
});

type CostItemFormValues = z.infer<typeof costItemSchema>;

interface CostItem extends CostItemFormValues {
  id: string;
  total: number;
}

interface CropMaintenanceActivity {
  id: string;
  activityType: CropMaintenanceActivityType;
  date: string; // ISO string "yyyy-MM-dd"
  cropsAffected: string; // e.g., "Tomatoes, Peppers"
  areaAffected: string; // e.g., "Greenhouse Section B"
  activityDetails?: string; // Specifics like "Applied NPK 15-15-15", "Scouted for aphids"
  notes?: string;
  costItems: CostItem[];
  totalActivityCost: number;
}

const activityFormSchema = z.object({
  activityType: z.enum(maintenanceActivityTypes, { required_error: "Activity type is required." }),
  date: z.string().refine((val) => !!val && isValid(parseISO(val)), { message: "Valid date is required." }),
  cropsAffected: z.string().min(1, {message: "Crops affected is required."}).max(150),
  areaAffected: z.string().min(1, { message: "Area affected is required." }).max(100),
  activityDetails: z.string().max(500).optional(),
  notes: z.string().max(500).optional(),
  costItems: z.array(costItemSchema).optional(),
});

type ActivityFormValues = z.infer<typeof activityFormSchema>;

const LOCAL_STORAGE_KEY = 'cropMaintenanceActivities_v1';

export default function CropMaintenancePage() {
  const [activities, setActivities] = useState<CropMaintenanceActivity[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<CropMaintenanceActivity | null>(null);
  const { toast } = useToast();
  const [isMounted, setIsMounted] = useState(false);

  const form = useForm<ActivityFormValues>({
    resolver: zodResolver(activityFormSchema),
    defaultValues: {
      activityType: undefined,
      date: '',
      cropsAffected: '',
      areaAffected: '',
      activityDetails: '',
      notes: '',
      costItems: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "costItems",
  });

  const watchedCostItems = form.watch("costItems");

  const calculateTotalCost = (items: CostItemFormValues[] | undefined) => {
    if (!items) return 0;
    return items.reduce((acc, item) => {
      const quantity = Number(item.quantity) || 0;
      const unitPrice = Number(item.unitPrice) || 0;
      return acc + (quantity * unitPrice);
    }, 0);
  };

  useEffect(() => {
    setIsMounted(true);
    const storedActivities = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (storedActivities) {
      setActivities(JSON.parse(storedActivities));
    }
  }, []);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(activities));
    }
  }, [activities, isMounted]);

  const handleOpenModal = (activityToEdit?: CropMaintenanceActivity) => {
    if (activityToEdit) {
      setEditingActivity(activityToEdit);
      form.reset({
        ...activityToEdit,
        activityDetails: activityToEdit.activityDetails || '',
        notes: activityToEdit.notes || '',
        costItems: activityToEdit.costItems.map(ci => ({...ci, id: ci.id || crypto.randomUUID() })) || [],
      });
    } else {
      setEditingActivity(null);
      form.reset();
    }
    setIsModalOpen(true);
  };

  const onSubmit: SubmitHandler<ActivityFormValues> = (data) => {
    const processedCostItems: CostItem[] = (data.costItems || []).map(ci => ({
      ...ci,
      id: ci.id || crypto.randomUUID(),
      quantity: Number(ci.quantity),
      unitPrice: Number(ci.unitPrice),
      total: (Number(ci.quantity) || 0) * (Number(ci.unitPrice) || 0),
    }));

    const totalActivityCost = processedCostItems.reduce((sum, item) => sum + item.total, 0);

    if (editingActivity) {
      setActivities(
        activities.map((act) =>
          act.id === editingActivity.id ? { ...editingActivity, ...data, costItems: processedCostItems, totalActivityCost } : act
        )
      );
      toast({ title: "Activity Updated", description: `${data.activityType} activity has been updated.` });
    } else {
      const newActivity: CropMaintenanceActivity = {
        id: crypto.randomUUID(),
        ...data,
        activityDetails: data.activityDetails || undefined,
        notes: data.notes || undefined,
        costItems: processedCostItems,
        totalActivityCost,
      };
      setActivities(prev => [...prev, newActivity]);
      toast({ title: "Activity Logged", description: `${data.activityType} activity has been successfully logged.` });
    }
    setIsModalOpen(false);
    setEditingActivity(null);
    form.reset();
  };

  const handleDeleteActivity = (id: string) => {
    setActivities(activities.filter((act) => act.id !== id));
    toast({ title: "Activity Deleted", description: "The maintenance activity has been removed.", variant: "destructive" });
  };
  
  if (!isMounted) {
    return null; 
  }

  return (
    <div>
      <PageHeader
        title="Crop Maintenance Management"
        icon={ShieldAlert}
        description="Log and monitor ongoing crop care activities and their associated costs."
        action={
          <Button onClick={() => handleOpenModal()}>
            <PlusCircle className="mr-2 h-4 w-4" /> Log New Maintenance Activity
          </Button>
        }
      />

      <Dialog open={isModalOpen} onOpenChange={(isOpen) => {
        setIsModalOpen(isOpen);
        if (!isOpen) {
          form.reset();
          setEditingActivity(null);
        }
      }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{editingActivity ? 'Edit Maintenance Activity' : 'Log New Maintenance Activity'}</DialogTitle>
            <DialogDescription>
              {editingActivity ? 'Update the details and costs of this maintenance activity.' : 'Enter details and costs for the new maintenance activity.'}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-grow overflow-y-auto pr-2">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <section className="space-y-4 p-4 border rounded-lg">
                  <h3 className="text-lg font-semibold text-primary">Activity Details</h3>
                  <FormField control={form.control} name="activityType" render={({ field }) => (
                    <FormItem><FormLabel>Activity Type*</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select activity type" /></SelectTrigger></FormControl>
                        <SelectContent>{maintenanceActivityTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent>
                      </Select><FormMessage />
                    </FormItem>)}
                  />
                  <FormField control={form.control} name="date" render={({ field }) => (
                    <FormItem><FormLabel>Date*</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)}
                  />
                  <FormField control={form.control} name="cropsAffected" render={({ field }) => (
                    <FormItem><FormLabel>Crop(s) Affected*</FormLabel><FormControl><Input placeholder="e.g., Tomatoes, Maize Plot A" {...field} /></FormControl><FormMessage /></FormItem>)}
                  />
                  <FormField control={form.control} name="areaAffected" render={({ field }) => (
                    <FormItem><FormLabel>Area Affected*</FormLabel><FormControl><Input placeholder="e.g., North Field - 5 acres, Row 1-5" {...field} /></FormControl><FormMessage /></FormItem>)}
                  />
                   <FormField control={form.control} name="activityDetails" render={({ field }) => (
                    <FormItem><FormLabel>Specific Activity Details (Optional)</FormLabel><FormControl><Textarea placeholder="e.g., Applied 2 bags of NPK 15-15-15, Sprayed Neem oil solution for aphid control, Irrigated for 2 hours." {...field} /></FormControl><FormMessage /></FormItem>)}
                  />
                  <FormField control={form.control} name="notes" render={({ field }) => (
                    <FormItem><FormLabel>General Notes (Optional)</FormLabel><FormControl><Textarea placeholder="Any additional observations or comments" {...field} /></FormControl><FormMessage /></FormItem>)}
                  />
                </section>

                <section className="space-y-4 p-4 border rounded-lg">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-primary">Cost Items</h3>
                    <Button type="button" size="sm" variant="outline" onClick={() => append({ description: '', unit: '', quantity: 1, unitPrice: 0 })}>
                      <PlusCircle className="mr-2 h-4 w-4" /> Add Cost Item
                    </Button>
                  </div>
                  {fields.map((field, index) => {
                    const quantity = form.watch(`costItems.${index}.quantity`) || 0;
                    const unitPrice = form.watch(`costItems.${index}.unitPrice`) || 0;
                    const itemTotal = Number(quantity) * Number(unitPrice);
                    return (
                      <div key={field.id} className="p-3 border rounded-md space-y-3 bg-muted/20 relative">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <FormField control={form.control} name={`costItems.${index}.description`} render={({ field: f }) => (
                            <FormItem><FormLabel>Description*</FormLabel><FormControl><Input placeholder="e.g., NPK Fertilizer, Labor for weeding" {...f} /></FormControl><FormMessage /></FormItem>)}
                          />
                          <FormField control={form.control} name={`costItems.${index}.unit`} render={({ field: f }) => (
                            <FormItem><FormLabel>Unit*</FormLabel><FormControl><Input placeholder="e.g., Bag, Hour, Liter" {...f} /></FormControl><FormMessage /></FormItem>)}
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                          <FormField control={form.control} name={`costItems.${index}.quantity`} render={({ field: f }) => (
                            <FormItem><FormLabel>Quantity*</FormLabel><FormControl><Input type="number" step="0.01" placeholder="0.00" {...f} onChange={e => {f.onChange(parseFloat(e.target.value)); form.setValue(`costItems.${index}.total`, parseFloat(e.target.value) * (form.getValues(`costItems.${index}.unitPrice`) || 0) ) }} /></FormControl><FormMessage /></FormItem>)}
                          />
                           <FormField control={form.control} name={`costItems.${index}.unitPrice`} render={({ field: f }) => (
                            <FormItem><FormLabel>Unit Price*</FormLabel><FormControl><Input type="number" step="0.01" placeholder="0.00" {...f} onChange={e => {f.onChange(parseFloat(e.target.value)); form.setValue(`costItems.${index}.total`, parseFloat(e.target.value) * (form.getValues(`costItems.${index}.quantity`) || 0) ) }} /></FormControl><FormMessage /></FormItem>)}
                          />
                          <div>
                            <Label>Item Total</Label>
                            <Input value={itemTotal.toFixed(2)} readOnly disabled className="font-semibold bg-input" />
                          </div>
                        </div>
                        <Button type="button" variant="ghost" size="icon" className="absolute top-1 right-1 text-destructive hover:bg-destructive/10" onClick={() => remove(index)}>
                          <Trash2 className="h-4 w-4" /><span className="sr-only">Remove Item</span>
                        </Button>
                      </div>
                    );
                  })}
                  {fields.length === 0 && <p className="text-sm text-muted-foreground text-center py-2">No cost items added yet.</p>}
                   <Separator className="my-4" />
                   <div className="flex justify-end items-center space-x-3">
                      <Label className="text-md font-semibold">Total Activity Cost:</Label>
                      <Input
                        value={calculateTotalCost(watchedCostItems).toFixed(2)}
                        readOnly
                        disabled
                        className="w-32 font-bold text-lg text-right bg-input"
                      />
                    </div>
                </section>
                
                <DialogFooter className="sticky bottom-0 bg-background py-4 px-6 border-t mt-auto">
                  <DialogClose asChild>
                    <Button type="button" variant="outline">Cancel</Button>
                  </DialogClose>
                  <Button type="submit">
                    {editingActivity ? 'Save Changes' : 'Log Activity'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </div>
        </DialogContent>
      </Dialog>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Logged Crop Maintenance Activities</CardTitle>
          <CardDescription>
            View all recorded maintenance activities and their total costs. Edit or delete as needed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activities.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Activity Type</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Crop(s) Affected</TableHead>
                  <TableHead>Area</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead className="text-right">Total Cost</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activities.sort((a,b) => parseISO(b.date).getTime() - parseISO(a.date).getTime()).map((activity) => (
                  <TableRow key={activity.id}>
                    <TableCell className="font-medium">{activity.activityType}</TableCell>
                    <TableCell>{isValid(parseISO(activity.date)) ? format(parseISO(activity.date), 'PP') : 'Invalid Date'}</TableCell>
                    <TableCell>{activity.cropsAffected}</TableCell>
                    <TableCell>{activity.areaAffected}</TableCell>
                    <TableCell className="max-w-xs truncate">{activity.activityDetails || 'N/A'}</TableCell>
                    <TableCell className="text-right font-semibold">
                      {activity.totalActivityCost.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="icon" onClick={() => handleOpenModal(activity)} className="h-8 w-8">
                        <Edit2 className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button variant="destructive" size="icon" onClick={() => handleDeleteActivity(activity.id)} className="h-8 w-8">
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
             <div className="text-center py-10">
                <ShieldAlert className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-4 text-muted-foreground">No crop maintenance activities logged yet.</p>
                <p className="text-sm text-muted-foreground">Click "Log New Maintenance Activity" to get started.</p>
            </div>
          )}
        </CardContent>
      </Card>
      <Card className="mt-6 bg-muted/30 p-4">
        <CardHeader className="p-0 pb-2">
            <CardTitle className="text-base font-semibold text-muted-foreground">About Crop Maintenance Costing</CardTitle>
        </CardHeader>
        <CardContent className="p-0 text-xs text-muted-foreground space-y-1">
            <p>&bull; This section helps track diverse ongoing crop care tasks and their associated costs.</p>
            <p>&bull; Log activities such as irrigation, fertilization, pest/disease control, weeding, pruning, etc.</p>
            <p>&bull; Itemize costs for inputs (fertilizers, pesticides), labor, water usage, equipment rental, and more.</p>
            <p>&bull; The total cost for each maintenance activity is automatically calculated.</p>
            <p>&bull; Consistent logging here is vital for understanding operational expenses throughout the crop cycle.</p>
        </CardContent>
      </Card>
    </div>
  );
}
    

    