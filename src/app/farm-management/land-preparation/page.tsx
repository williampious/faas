
'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray, type SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@/components/layout/page-header';
import { Shovel, PlusCircle, Trash2, Edit2, DollarSign, ArrowLeft } from 'lucide-react';
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
import { useRouter } from 'next/navigation';
import type { PaymentSource, CostCategory, OperationalTransaction } from '@/types/finance';
import { paymentSources, costCategories } from '@/types/finance';

const activityTypes = ['Field Clearing', 'Weeding', 'Ploughing', 'Harrowing', 'Levelling', 'Manure Spreading', 'Herbicide Application'] as const;
type LandPreparationActivityType = typeof activityTypes[number];

const costItemSchema = z.object({
  id: z.string().optional(),
  description: z.string().min(1, "Description is required.").max(100),
  category: z.enum(costCategories, { required_error: "Category is required."}),
  paymentSource: z.enum(paymentSources, { required_error: "Payment source is required."}),
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

interface LandPreparationActivity {
  id: string;
  activityType: LandPreparationActivityType;
  date: string; // ISO string "yyyy-MM-dd"
  areaAffected: string;
  notes?: string;
  costItems: CostItem[];
  totalActivityCost: number;
}

const activityFormSchema = z.object({
  activityType: z.enum(activityTypes, { required_error: "Activity type is required." }),
  date: z.string().refine((val) => !!val && isValid(parseISO(val)), { message: "Valid date is required." }),
  areaAffected: z.string().min(1, { message: "Area affected is required." }).max(100),
  notes: z.string().max(500).optional(),
  costItems: z.array(costItemSchema).optional(),
});

type ActivityFormValues = z.infer<typeof activityFormSchema>;

const LOCAL_STORAGE_KEY_ACTIVITIES = 'landPreparationActivities_v4';
const LOCAL_STORAGE_KEY_TRANSACTIONS = 'farmTransactions_v1';
const ACTIVITY_FORM_ID = 'land-prep-activity-form';

export default function LandPreparationPage() {
  const [activities, setActivities] = useState<LandPreparationActivity[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<LandPreparationActivity | null>(null);
  const { toast } = useToast();
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();

  const form = useForm<ActivityFormValues>({
    resolver: zodResolver(activityFormSchema),
    defaultValues: {
      activityType: undefined,
      date: '',
      areaAffected: '',
      notes: '',
      costItems: [],
    },
  });

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: "costItems",
  });

  const watchedCostItems = form.watch("costItems");

  const calculateTotalActivityCost = (items: CostItemFormValues[] | undefined) => {
    if (!items) return 0;
    return items.reduce((acc, item) => {
      const quantity = Number(item.quantity) || 0;
      const unitPrice = Number(item.unitPrice) || 0;
      return acc + (quantity * unitPrice);
    }, 0);
  };

  useEffect(() => {
    setIsMounted(true);
    const storedActivities = localStorage.getItem(LOCAL_STORAGE_KEY_ACTIVITIES);
    if (storedActivities) {
      setActivities(JSON.parse(storedActivities));
    }
  }, []);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem(LOCAL_STORAGE_KEY_ACTIVITIES, JSON.stringify(activities));
    }
  }, [activities, isMounted]);

  const handleOpenModal = (activityToEdit?: LandPreparationActivity) => {
    if (activityToEdit) {
      setEditingActivity(activityToEdit);
      form.reset({
        activityType: activityToEdit.activityType,
        date: activityToEdit.date,
        areaAffected: activityToEdit.areaAffected,
        notes: activityToEdit.notes || '',
        costItems: activityToEdit.costItems.map(ci => ({...ci, id: ci.id || crypto.randomUUID(), category: ci.category || costCategories[0] })) || [],
      });
    } else {
      setEditingActivity(null);
      form.reset({
        activityType: undefined,
        date: '',
        areaAffected: '',
        notes: '',
        costItems: [],
      });
    }
    setIsModalOpen(true);
  };

  const onSubmit: SubmitHandler<ActivityFormValues> = (data) => {
    const processedCostItems: CostItem[] = (data.costItems || []).map(ci => ({
      ...ci,
      id: ci.id || crypto.randomUUID(),
      category: ci.category,
      paymentSource: ci.paymentSource,
      quantity: Number(ci.quantity),
      unitPrice: Number(ci.unitPrice),
      total: (Number(ci.quantity) || 0) * (Number(ci.unitPrice) || 0),
    }));

    const totalActivityCost = processedCostItems.reduce((sum, item) => sum + item.total, 0);

    // --- Central Transaction Logging ---
    const storedTransactions = localStorage.getItem(LOCAL_STORAGE_KEY_TRANSACTIONS);
    let allTransactions: OperationalTransaction[] = storedTransactions ? JSON.parse(storedTransactions) : [];
    // ---

    if (editingActivity) {
      const updatedActivity: LandPreparationActivity = { ...editingActivity, ...data, costItems: processedCostItems, totalActivityCost };
      setActivities(activities.map((act) => (act.id === editingActivity.id ? updatedActivity : act)));
      
      // Remove old transactions for this activity and add the updated ones
      allTransactions = allTransactions.filter(t => t.linkedActivityId !== editingActivity.id);
      const newTransactions: OperationalTransaction[] = processedCostItems.map(item => ({
        id: crypto.randomUUID(),
        date: data.date,
        description: item.description,
        amount: item.total,
        type: 'Expense',
        category: item.category,
        paymentSource: item.paymentSource,
        linkedModule: 'Land Preparation',
        linkedActivityId: editingActivity.id,
        linkedItemId: item.id,
      }));
      allTransactions.push(...newTransactions);
      
      toast({ title: "Activity Updated", description: `${data.activityType} activity has been updated.` });
    } else {
      const newActivity: LandPreparationActivity = {
        id: crypto.randomUUID(),
        ...data,
        notes: data.notes || undefined,
        costItems: processedCostItems,
        totalActivityCost,
      };
      setActivities(prev => [...prev, newActivity]);
      
      // Add new transactions for the new activity
      const newTransactions: OperationalTransaction[] = processedCostItems.map(item => ({
        id: crypto.randomUUID(),
        date: data.date,
        description: item.description,
        amount: item.total,
        type: 'Expense',
        category: item.category,
        paymentSource: item.paymentSource,
        linkedModule: 'Land Preparation',
        linkedActivityId: newActivity.id,
        linkedItemId: item.id,
      }));
      allTransactions.push(...newTransactions);

      toast({ title: "Activity Logged", description: `${data.activityType} activity has been successfully logged.` });
    }

    // Save the updated central transaction ledger
    localStorage.setItem(LOCAL_STORAGE_KEY_TRANSACTIONS, JSON.stringify(allTransactions));

    setIsModalOpen(false);
    setEditingActivity(null);
    form.reset();
  };

  const handleDeleteActivity = (id: string) => {
    const activityToDelete = activities.find(a => a.id === id);
    if (!activityToDelete) return;
    
    // Update activities state
    setActivities(activities.filter((act) => act.id !== id));
    
    // Remove transactions associated with the deleted activity
    const storedTransactions = localStorage.getItem(LOCAL_STORAGE_KEY_TRANSACTIONS);
    if(storedTransactions) {
        let allTransactions: OperationalTransaction[] = JSON.parse(storedTransactions);
        allTransactions = allTransactions.filter(t => t.linkedActivityId !== id);
        localStorage.setItem(LOCAL_STORAGE_KEY_TRANSACTIONS, JSON.stringify(allTransactions));
    }

    toast({ title: "Activity Deleted", description: `Activity "${activityToDelete.activityType}" has been removed.`, variant: "destructive" });
  };


  if (!isMounted) {
    return null; 
  }

  return (
    <div>
      <PageHeader
        title="Land Preparation Management"
        icon={Shovel}
        description="Log, track, and manage all activities and associated costs for preparing your land."
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push('/farm-management')}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Farm Management
            </Button>
            <Button onClick={() => handleOpenModal()}>
              <PlusCircle className="mr-2 h-4 w-4" /> Log New Activity
            </Button>
          </div>
        }
      />

      <Dialog open={isModalOpen} onOpenChange={(isOpen) => {
        setIsModalOpen(isOpen);
        if (!isOpen) {
          form.reset();
          setEditingActivity(null);
        }
      }}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{editingActivity ? 'Edit Activity' : 'Log New Land Preparation Activity'}</DialogTitle>
            <DialogDescription>
              {editingActivity ? 'Update the details and costs of this activity.' : 'Enter details and costs for the new activity.'}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-grow overflow-y-auto pr-2 py-4"> {/* Scrollable content area */}
            <Form {...form}>
              <form id={ACTIVITY_FORM_ID} onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <section className="space-y-4 p-4 border rounded-lg">
                  <h3 className="text-lg font-semibold text-primary">Activity Details</h3>
                  <FormField control={form.control} name="activityType" render={({ field }) => (
                    <FormItem><FormLabel>Activity Type*</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select activity type" /></SelectTrigger></FormControl>
                        <SelectContent>{activityTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent>
                      </Select><FormMessage />
                    </FormItem>)}
                  />
                  <FormField control={form.control} name="date" render={({ field }) => (
                    <FormItem><FormLabel>Date*</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)}
                  />
                  <FormField control={form.control} name="areaAffected" render={({ field }) => (
                    <FormItem><FormLabel>Area Affected*</FormLabel><FormControl><Input placeholder="e.g., North Field - 5 acres" {...field} /></FormControl><FormMessage /></FormItem>)}
                  />
                  <FormField control={form.control} name="notes" render={({ field }) => (
                    <FormItem><FormLabel>Notes (Optional)</FormLabel><FormControl><Textarea placeholder="Any additional details" {...field} /></FormControl><FormMessage /></FormItem>)}
                  />
                </section>

                <section className="space-y-4 p-4 border rounded-lg">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-primary">Cost Items</h3>
                    <Button type="button" size="sm" variant="outline" onClick={() => append({ description: '', category: costCategories[0], paymentSource: paymentSources[0], unit: '', quantity: 1, unitPrice: 0 })}>
                      <PlusCircle className="mr-2 h-4 w-4" /> Add Cost Item
                    </Button>
                  </div>
                  {fields.map((field, index) => {
                    const quantity = form.watch(`costItems.${index}.quantity`) || 0;
                    const unitPrice = form.watch(`costItems.${index}.unitPrice`) || 0;
                    const itemTotal = Number(quantity) * Number(unitPrice);
                    return (
                      <div key={field.id} className="p-3 border rounded-md space-y-3 bg-muted/20 relative">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                           <FormField control={form.control} name={`costItems.${index}.category`} render={({ field: f }) => (
                            <FormItem><FormLabel>Category*</FormLabel>
                              <Select onValueChange={f.onChange} defaultValue={f.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger></FormControl>
                                <SelectContent>{costCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}</SelectContent>
                              </Select><FormMessage />
                            </FormItem>)}
                          />
                          <FormField control={form.control} name={`costItems.${index}.paymentSource`} render={({ field: f }) => (
                            <FormItem><FormLabel>Payment Source*</FormLabel>
                              <Select onValueChange={f.onChange} defaultValue={f.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Select source" /></SelectTrigger></FormControl>
                                <SelectContent>{paymentSources.map(src => <SelectItem key={src} value={src}>{src}</SelectItem>)}</SelectContent>
                              </Select><FormMessage />
                            </FormItem>)}
                          />
                          <FormField control={form.control} name={`costItems.${index}.description`} render={({ field: f }) => (
                            <FormItem><FormLabel>Description*</FormLabel><FormControl><Input placeholder="e.g., Glyphosate, Weeding labor" {...f} /></FormControl><FormMessage /></FormItem>)}
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
                          <FormField control={form.control} name={`costItems.${index}.unit`} render={({ field: f }) => (
                            <FormItem><FormLabel>Unit*</FormLabel><FormControl><Input placeholder="e.g., Liters, Days" {...f} /></FormControl><FormMessage /></FormItem>)}
                          />
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
                        value={calculateTotalActivityCost(watchedCostItems).toFixed(2)}
                        readOnly
                        disabled
                        className="w-32 font-bold text-lg text-right bg-input"
                      />
                    </div>
                </section>
              </form>
            </Form>
          </div>
          <DialogFooter className="py-4 px-6 border-t">
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit" form={ACTIVITY_FORM_ID}>
              {editingActivity ? 'Save Changes' : 'Log Activity'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Logged Land Preparation Activities</CardTitle>
          <CardDescription>
            View all recorded activities and their total costs. Edit or delete as needed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activities.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Activity Type</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Area Affected</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="text-right">Total Cost</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activities.sort((a,b) => parseISO(b.date).getTime() - parseISO(a.date).getTime()).map((activity) => (
                  <TableRow key={activity.id}>
                    <TableCell className="font-medium">{activity.activityType}</TableCell>
                    <TableCell>{isValid(parseISO(activity.date)) ? format(parseISO(activity.date), 'MMMM d, yyyy') : 'Invalid Date'}</TableCell>
                    <TableCell>{activity.areaAffected}</TableCell>
                    <TableCell className="max-w-xs truncate">{activity.notes || 'N/A'}</TableCell>
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
                <Shovel className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-4 text-muted-foreground">No land preparation activities logged yet.</p>
                <p className="text-sm text-muted-foreground">Click "Log New Activity" to get started.</p>
            </div>
          )}
        </CardContent>
      </Card>
       <Card className="mt-6 bg-muted/30 p-4">
        <CardHeader className="p-0 pb-2">
            <CardTitle className="text-base font-semibold text-muted-foreground">About Land Preparation Costing</CardTitle>
        </CardHeader>
        <CardContent className="p-0 text-xs text-muted-foreground space-y-1">
            <p>&bull; This section helps you track crucial groundwork and associated costs before planting.</p>
            <p>&bull; Log activities and itemize costs by category (Material/Input, Labor, Equipment, etc.). Select a "Payment Source" for each cost to enable cash flow tracking.</p>
            <p>&bull; Record the date, specific area affected, and any relevant notes for each activity.</p>
            <p>&bull; The total cost for each activity is automatically calculated and displayed.</p>
        </CardContent>
      </Card>
    </div>
  );
}
