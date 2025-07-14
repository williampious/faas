
'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@/components/layout/page-header';
import { Shovel, PlusCircle, Trash2, Edit2, ArrowLeft, Loader2, AlertTriangle, Sparkles } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format, parseISO, isValid } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { useRouter } from 'next/navigation';
import type { PaymentSource, CostCategory, OperationalTransaction, CostItem } from '@/types/finance';
import { paymentSources, costCategories } from '@/types/finance';
import { useUserProfile } from '@/contexts/user-profile-context';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, writeBatch, orderBy } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import type { FarmingYear, FarmingSeason } from '@/types/season';
import { Alert, AlertTitle, AlertDescription as ShadcnAlertDescription } from '@/components/ui/alert';
import Link from 'next/link';


const activityTypes = ['Field Clearing', 'Weeding', 'Ploughing', 'Harrowing', 'Levelling', 'Manure Spreading', 'Herbicide Application'] as const;
type LandPreparationActivityType = typeof activityTypes[number];

const safeParseFloat = (val: any) => (val === "" || val === null || val === undefined) ? undefined : parseFloat(String(val));

const costItemSchema = z.object({
  id: z.string().optional(),
  description: z.string().min(1, "Description is required.").max(100),
  category: z.enum(costCategories, { required_error: "Category is required."}),
  paymentSource: z.enum(paymentSources, { required_error: "Payment source is required."}),
  unit: z.string().min(1, "Unit is required.").max(20),
  quantity: z.preprocess(safeParseFloat, z.number().min(0.01, "Quantity must be greater than 0.")),
  unitPrice: z.preprocess(safeParseFloat, z.number().min(0.01, "Unit price must be greater than 0.")),
  total: z.number().optional(),
});

type CostItemFormValues = z.infer<typeof costItemSchema>;

interface LandPreparationActivity {
  id: string;
  farmId: string;
  activityType: LandPreparationActivityType;
  date: string; // ISO string "yyyy-MM-dd"
  areaAffected: string;
  notes?: string;
  costItems: CostItem[];
  totalActivityCost: number;
  farmingYearId?: string;
  farmingSeasonId?: string;
  createdAt: any;
  updatedAt: any;
}

const activityFormSchema = z.object({
  activityType: z.enum(activityTypes, { required_error: "Activity type is required." }),
  date: z.string().refine((val) => !!val && isValid(parseISO(val)), { message: "Valid date is required." }),
  areaAffected: z.string().min(1, { message: "Area affected is required." }).max(100),
  notes: z.string().max(500).optional(),
  costItems: z.array(costItemSchema).optional(),
  farmingYearId: z.string().min(1, "Farming Year selection is required."),
  farmingSeasonId: z.string().min(1, "Farming Season selection is required."),
});

type ActivityFormValues = z.infer<typeof activityFormSchema>;

const ACTIVITIES_COLLECTION = 'landPreparationActivities';
const TRANSACTIONS_COLLECTION = 'transactions';
const FARMING_YEARS_COLLECTION = 'farmingYears';
const ACTIVITY_FORM_ID = 'land-prep-activity-form';
const STARTER_PLAN_RECORD_LIMIT = 5;

export default function LandPreparationPage() {
  const [activities, setActivities] = useState<LandPreparationActivity[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<LandPreparationActivity | null>(null);
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { userProfile, isLoading: isProfileLoading } = useUserProfile();
  
  const [farmingYears, setFarmingYears] = useState<FarmingYear[]>([]);

  const isStarterPlan = userProfile?.subscription?.planId === 'starter';
  const hasReachedRecordLimit = isStarterPlan && activities.length >= STARTER_PLAN_RECORD_LIMIT;

  const form = useForm<ActivityFormValues>({
    resolver: zodResolver(activityFormSchema),
    defaultValues: {
      activityType: undefined, date: '', areaAffected: '', notes: '', costItems: [],
      farmingYearId: undefined, farmingSeasonId: undefined,
    },
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: "costItems" });
  const watchedCostItems = form.watch("costItems");
  const watchedFarmingYearId = form.watch("farmingYearId");

  const calculateTotalActivityCost = (items: CostItemFormValues[] | undefined) => {
    if (!items) return 0;
    return items.reduce((acc, item) => (acc + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0)), 0);
  };

  useEffect(() => {
    if (isProfileLoading) return;
    if (!userProfile?.farmId) {
      setError("Farm information is not available. Cannot load data.");
      setIsLoading(false);
      return;
    }

    const fetchInitialData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        if (!userProfile.farmId) throw new Error("User is not associated with a farm.");
        
        const activitiesQuery = query(collection(db, ACTIVITIES_COLLECTION), where("farmId", "==", userProfile.farmId));
        const activitiesSnapshot = await getDocs(activitiesQuery);
        const fetchedActivities = activitiesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as LandPreparationActivity[];
        setActivities(fetchedActivities);
        
        const yearsQuery = query(collection(db, FARMING_YEARS_COLLECTION), where("farmId", "==", userProfile.farmId), orderBy("startDate", "desc"));
        const yearsSnapshot = await getDocs(yearsQuery);
        const fetchedYears = yearsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FarmingYear));
        setFarmingYears(fetchedYears);

      } catch (err: any) {
        console.error("Error fetching data:", err);
        setError(`Failed to fetch data: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInitialData();
  }, [userProfile, isProfileLoading]);

  const handleOpenModal = (activityToEdit?: LandPreparationActivity) => {
    if (hasReachedRecordLimit && !activityToEdit) {
      toast({
        title: "Record Limit Reached",
        description: `The Starter plan is limited to ${STARTER_PLAN_RECORD_LIMIT} records. Please upgrade to add more.`,
        variant: "destructive",
      });
      return;
    }
    
    if (activityToEdit) {
      setEditingActivity(activityToEdit);
      form.reset({
        ...activityToEdit,
        notes: activityToEdit.notes || '',
        costItems: activityToEdit.costItems.map(ci => ({...ci, id: ci.id || uuidv4()})) || [],
      });
    } else {
      setEditingActivity(null);
      form.reset({ activityType: undefined, date: '', areaAffected: '', notes: '', costItems: [], farmingYearId: undefined, farmingSeasonId: undefined });
    }
    setIsModalOpen(true);
  };

  const onSubmit: SubmitHandler<ActivityFormValues> = async (data) => {
    if (!userProfile?.farmId || !db) {
      toast({ title: "Error", description: "Cannot save. Farm/database information is missing.", variant: "destructive" });
      return;
    }

    const totalActivityCost = calculateTotalActivityCost(data.costItems);
    const activityData: any = {
      farmId: userProfile.farmId,
      ...data,
      totalActivityCost,
      costItems: (data.costItems || []).map(ci => ({
        ...ci,
        total: (Number(ci.quantity) || 0) * (Number(ci.unitPrice) || 0),
        id: ci.id || uuidv4(),
      })),
      updatedAt: serverTimestamp(),
    };
    
    const batch = writeBatch(db);

    try {
      let activityId: string;
      if (editingActivity) {
        activityId = editingActivity.id;
        const activityRef = doc(db, ACTIVITIES_COLLECTION, activityId);
        batch.update(activityRef, activityData);
        
        const transQuery = query(collection(db, TRANSACTIONS_COLLECTION), where("linkedActivityId", "==", activityId));
        const oldTransSnap = await getDocs(transQuery);
        oldTransSnap.forEach(doc => batch.delete(doc.ref));

      } else {
        const activityRef = doc(collection(db, ACTIVITIES_COLLECTION));
        activityId = activityRef.id;
        batch.set(activityRef, { ...activityData, createdAt: serverTimestamp() });
        activityData.id = activityRef.id;
      }

      activityData.costItems.forEach((item: CostItem) => {
        const transRef = doc(collection(db, TRANSACTIONS_COLLECTION));
        const newTransaction: Omit<OperationalTransaction, 'id'> = {
          farmId: userProfile.farmId,
          date: data.date,
          description: item.description,
          amount: item.total,
          type: 'Expense',
          category: item.category,
          paymentSource: item.paymentSource,
          linkedModule: 'Land Preparation',
          linkedActivityId: activityId,
          linkedItemId: item.id,
        };
        batch.set(transRef, newTransaction);
      });

      await batch.commit();

      if (editingActivity) {
        setActivities(activities.map(a => a.id === editingActivity.id ? { ...a, ...activityData, id: editingActivity.id } : a));
        toast({ title: "Activity Updated", description: `${data.activityType} activity has been updated.` });
      } else {
        const newActivityForState: LandPreparationActivity = {
            ...activityData, 
            id: activityData.id,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }
        setActivities(prev => [...prev, newActivityForState]);
        toast({ title: "Activity Logged", description: `${data.activityType} activity has been successfully logged.` });
      }

      setIsModalOpen(false);
      setEditingActivity(null);
      form.reset();

    } catch (err: any) {
        console.error("Error saving activity:", err);
        toast({ title: "Save Failed", description: `Could not save activity. Error: ${err.message}`, variant: "destructive" });
    }
  };

  const handleDeleteActivity = async (id: string) => {
    const activityToDelete = activities.find(a => a.id === id);
    if (!activityToDelete || !db) return;
    
    const batch = writeBatch(db);
    try {
        batch.delete(doc(db, ACTIVITIES_COLLECTION, id));
        
        const transQuery = query(collection(db, TRANSACTIONS_COLLECTION), where("linkedActivityId", "==", id));
        const transSnap = await getDocs(transQuery);
        transSnap.forEach(doc => batch.delete(doc.ref));

        await batch.commit();
        setActivities(activities.filter((act) => act.id !== id));
        toast({ title: "Activity Deleted", description: `Activity "${activityToDelete.activityType}" and its financial records have been removed.`, variant: "destructive" });
    } catch(err: any) {
         console.error("Error deleting activity:", err);
        toast({ title: "Deletion Failed", description: `Could not delete activity. Error: ${err.message}`, variant: "destructive" });
    }
  };
  
  const getSortableDate = (timestamp: any): Date => {
    if (!timestamp) return new Date(0);
    if (typeof timestamp.toDate === 'function') { // Firestore Timestamp
      return timestamp.toDate();
    }
    if (typeof timestamp === 'string') { // ISO string
      const d = parseISO(timestamp);
      if(isValid(d)) return d;
    }
    if (timestamp instanceof Date) {
        if(isValid(timestamp)) return timestamp;
    }
    return new Date(0);
  };


  if (isProfileLoading || (isLoading && !error)) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-12rem)]">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
        <p className="ml-3 text-lg text-muted-foreground">Loading data...</p>
      </div>
    );
  }
  
  if (error) {
     return (
        <div className="container mx-auto py-10">
         <Card className="w-full max-w-lg mx-auto text-center shadow-lg">
            <CardHeader>
                <CardTitle className="flex items-center justify-center text-xl text-destructive">
                    <AlertTriangle className="mr-2 h-6 w-6" /> Data Loading Error
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground mb-2">{error}</p>
            </CardContent>
         </Card>
        </div>
     );
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
            <Button onClick={() => handleOpenModal()} disabled={hasReachedRecordLimit}>
              <PlusCircle className="mr-2 h-4 w-4" /> Log New Activity
            </Button>
          </div>
        }
      />

       {hasReachedRecordLimit && (
        <Alert className="mb-6 bg-yellow-50 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700">
            <Sparkles className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            <AlertTitle className="text-yellow-800 dark:text-yellow-200">Starter Plan Limit Reached</AlertTitle>
            <ShadcnAlertDescription className="text-yellow-700 dark:text-yellow-300">
                You have reached the {STARTER_PLAN_RECORD_LIMIT}-record limit for Land Preparation activities on the Starter plan. To log more records, please upgrade your subscription.
                <Link href="/settings/billing">
                  <Button variant="link" className="p-0 h-auto ml-1 text-yellow-800 dark:text-yellow-200 font-bold">Upgrade Plan</Button>
                </Link>
            </ShadcnAlertDescription>
        </Alert>
      )}

      <Dialog open={isModalOpen} onOpenChange={(isOpen) => {
        setIsModalOpen(isOpen);
        if (!isOpen) { form.reset(); setEditingActivity(null); }
      }}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{editingActivity ? 'Edit Activity' : 'Log New Land Preparation Activity'}</DialogTitle>
            <DialogDescription>{editingActivity ? 'Update the details and costs of this activity.' : 'Enter details and costs for the new activity.'}</DialogDescription>
          </DialogHeader>
          <div className="flex-grow overflow-y-auto pr-2 py-4">
            <Form {...form}>
              <form id={ACTIVITY_FORM_ID} onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <section className="space-y-4 p-4 border rounded-lg">
                  <h3 className="text-lg font-semibold text-primary">Activity Details</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <FormField control={form.control} name="farmingYearId" render={({ field }) => (<FormItem><FormLabel>Farming Year*</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select Year" /></SelectTrigger></FormControl><SelectContent>{farmingYears.map(year => <SelectItem key={year.id} value={year.id}>{year.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                     <FormField control={form.control} name="farmingSeasonId" render={({ field }) => (<FormItem><FormLabel>Farming Season*</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value} disabled={!watchedFarmingYearId}><FormControl><SelectTrigger><SelectValue placeholder="Select Season" /></SelectTrigger></FormControl><SelectContent>{farmingYears.find(y => y.id === watchedFarmingYearId)?.seasons.map(season => <SelectItem key={season.id} value={season.id}>{season.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                   </div>
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
                    <Button type="button" size="sm" variant="outline" onClick={() => append({ description: '', category: 'Labor', paymentSource: 'Cash', unit: '', quantity: undefined, unitPrice: undefined })}>
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
                           <FormField control={form.control} name={`costItems.${index}.category`} render={({ field: f }) => (
                            <FormItem><FormLabel>Category*</FormLabel>
                              <Select onValueChange={f.onChange} defaultValue={f.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger></FormControl>
                                <SelectContent>{costCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}</SelectContent>
                              </Select><FormMessage />
                            </FormItem>)}
                          />
                          <FormField control={form.control} name={`costItems.${index}.description`} render={({ field: f }) => (
                            <FormItem><FormLabel>Description*</FormLabel><FormControl><Input placeholder="e.g., Glyphosate, Weeding labor" {...f} /></FormControl><FormMessage /></FormItem>)}
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
                           <FormField control={form.control} name={`costItems.${index}.paymentSource`} render={({ field: f }) => (<FormItem><FormLabel>Payment Source*</FormLabel><Select onValueChange={f.onChange} defaultValue={f.value}><FormControl><SelectTrigger><SelectValue placeholder="Select payment source" /></SelectTrigger></FormControl><SelectContent>{paymentSources.map(src => <SelectItem key={src} value={src}>{src}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                          <FormField control={form.control} name={`costItems.${index}.unit`} render={({ field: f }) => (
                            <FormItem><FormLabel>Unit*</FormLabel><FormControl><Input placeholder="e.g., Liters, Days" {...f} /></FormControl><FormMessage /></FormItem>)}
                          />
                          <FormField control={form.control} name={`costItems.${index}.quantity`} render={({ field: f }) => (
                            <FormItem><FormLabel>Quantity*</FormLabel><FormControl><Input type="number" step="0.01" placeholder="0.00" {...f} /></FormControl><FormMessage /></FormItem>)}
                          />
                           <FormField control={form.control} name={`costItems.${index}.unitPrice`} render={({ field: f }) => (
                            <FormItem><FormLabel>Unit Price*</FormLabel><FormControl><Input type="number" step="0.01" placeholder="0.00" {...f} /></FormControl><FormMessage /></FormItem>)}
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
            <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
            <Button type="submit" form={ACTIVITY_FORM_ID}>
              {editingActivity ? 'Save Changes' : 'Log Activity'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Logged Land Preparation Activities ({activities.length}/{isStarterPlan ? STARTER_PLAN_RECORD_LIMIT : 'Unlimited'})</CardTitle>
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
                  <TableHead className="text-right">Total Cost</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activities.sort((a,b) => getSortableDate(b.createdAt).getTime() - getSortableDate(a.createdAt).getTime()).map((activity) => (
                  <TableRow key={activity.id}>
                    <TableCell className="font-medium">{activity.activityType}</TableCell>
                    <TableCell>{isValid(parseISO(activity.date)) ? format(parseISO(activity.date), 'MMMM d, yyyy') : 'Invalid Date'}</TableCell>
                    <TableCell>{activity.areaAffected}</TableCell>
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
            <p>&bull; Data in this module is now stored centrally in Firestore, ensuring all farm members see the same information.</p>
            <p>&bull; Log activities and itemize costs by category (Material/Input, Labor, Equipment, etc.).</p>
            <p>&bull; The total cost for each activity is automatically calculated and logged in the central financial ledger, which feeds the Financial Dashboard.</p>
        </CardContent>
      </Card>
    </div>
  );
}
