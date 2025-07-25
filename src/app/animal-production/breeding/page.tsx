
'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@/components/layout/page-header';
import { Construction, PlusCircle, Trash2, Edit2, ArrowLeft, Loader2, AlertTriangle, CalendarIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, parseISO, isValid } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { useRouter } from 'next/navigation';
import type { PaymentSource, CostCategory, OperationalTransaction, CostItem } from '@/types/finance';
import { paymentSources, costCategories } from '@/types/finance';
import type { BreedingRecord, BreedingActivityType } from '@/types/livestock';
import { breedingActivityTypes } from '@/types/livestock';
import { useUserProfile } from '@/contexts/user-profile-context';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, writeBatch, orderBy } from 'firebase/firestore';
import type { FarmingYear } from '@/types/season';
import { v4 as uuidv4 } from 'uuid';
import { cn } from '@/lib/utils';

const safeParseFloat = (val: any) => (val === "" || val === null || val === undefined) ? undefined : parseFloat(String(val));
const safeParseInt = (val: any) => (val === "" || val === null || val === undefined) ? undefined : parseInt(String(val), 10);

const costItemSchema = z.object({
  id: z.string().optional(),
  description: z.string().min(1, "Description is required.").max(100),
  category: z.enum(costCategories, { required_error: "Category is required."}),
  paymentSource: z.enum(paymentSources, { required_error: "Payment source is required."}),
  unit: z.string().min(1, "Unit is required.").max(20),
  quantity: z.preprocess(
    safeParseFloat,
    z.number().min(0.01, "Quantity must be greater than 0.")
  ),
  unitPrice: z.preprocess(
    safeParseFloat,
    z.number().min(0.01, "Unit price must be greater than 0.")
  ),
  total: z.number().optional(),
});
type CostItemFormValues = z.infer<typeof costItemSchema>;

const breedingRecordFormSchema = z.object({
  activityType: z.enum(breedingActivityTypes, { required_error: "Activity type is required." }),
  maleIdentifier: z.string().min(1, "Male ID/Tag is required.").max(50),
  femaleIdentifier: z.string().min(1, "Female ID/Tag is required.").max(50),
  matingDate: z.date({ required_error: "A date is required." }),
  expectedDueDate: z.date().optional(),
  actualDueDate: z.date().optional(),
  offspringCount: z.preprocess(safeParseInt, z.number().min(0, "Offspring count cannot be negative.").optional()),
  notes: z.string().max(1000).optional(),
  costItems: z.array(costItemSchema).optional(),
  farmingYearId: z.string().min(1, "Farming Year selection is required."),
  farmingSeasonId: z.string().min(1, "Farming Season selection is required."),
});
type BreedingRecordFormValues = z.infer<typeof breedingRecordFormSchema>;

const RECORDS_COLLECTION = 'breedingRecords';
const TRANSACTIONS_COLLECTION = 'transactions';
const FARMING_YEARS_COLLECTION = 'farmingYears';
const ACTIVITY_FORM_ID = 'breeding-record-form';


export default function BreedingPage() {
  const [records, setRecords] = useState<BreedingRecord[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<BreedingRecord | null>(null);
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { userProfile, isLoading: isProfileLoading } = useUserProfile();
  const [farmingYears, setFarmingYears] = useState<FarmingYear[]>([]);

  const form = useForm<BreedingRecordFormValues>({
    resolver: zodResolver(breedingRecordFormSchema),
    defaultValues: {
      activityType: undefined, maleIdentifier: '', femaleIdentifier: '',
      expectedDueDate: undefined, actualDueDate: undefined, offspringCount: undefined, notes: '', costItems: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "costItems",
  });

  const watchedCostItems = form.watch("costItems");
  const watchedFarmingYearId = form.watch("farmingYearId");

  const calculateTotalCost = (items: CostItemFormValues[] | undefined) => {
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

    const fetchRecords = async () => {
      setIsLoading(true);
      setError(null);
      try {
        if (!userProfile.farmId) throw new Error("User is not associated with a farm.");
        
        const recordsQuery = query(collection(db, RECORDS_COLLECTION), where("farmId", "==", userProfile.farmId));
        const recordsSnapshot = await getDocs(recordsQuery);
        const fetchedRecords = recordsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as BreedingRecord[];
        setRecords(fetchedRecords);

        const yearsQuery = query(collection(db, FARMING_YEARS_COLLECTION), where("farmId", "==", userProfile.farmId), orderBy("startDate", "desc"));
        const yearsSnapshot = await getDocs(yearsQuery);
        const fetchedYears = yearsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FarmingYear));
        setFarmingYears(fetchedYears);

      } catch (err: any) {
        console.error("Error fetching breeding records:", err);
        setError(`Failed to fetch data: ${err.message}. An index may be required.`);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRecords();
  }, [userProfile, isProfileLoading]);


  const handleOpenModal = (recordToEdit?: BreedingRecord) => {
    if (recordToEdit) {
      setEditingRecord(recordToEdit);
      form.reset({
        ...recordToEdit,
        matingDate: parseISO(recordToEdit.matingDate),
        expectedDueDate: recordToEdit.expectedDueDate ? parseISO(recordToEdit.expectedDueDate) : undefined,
        actualDueDate: recordToEdit.actualDueDate ? parseISO(recordToEdit.actualDueDate) : undefined,
        notes: recordToEdit.notes || '',
        costItems: recordToEdit.costItems.map(ci => ({...ci, id: ci.id || uuidv4()})) || [],
      });
    } else {
      setEditingRecord(null);
      form.reset({
        activityType: undefined, maleIdentifier: '', femaleIdentifier: '',
        expectedDueDate: undefined, actualDueDate: undefined, offspringCount: undefined, notes: '', costItems: [],
        farmingYearId: undefined, farmingSeasonId: undefined,
      });
    }
    setIsModalOpen(true);
  };

  const onSubmit: SubmitHandler<BreedingRecordFormValues> = async (data) => {
    if (!userProfile?.farmId || !db) {
      toast({ title: "Error", description: "Cannot save. Farm/database information is missing.", variant: "destructive" });
      return;
    }
  
    const processedCostItems: CostItem[] = (data.costItems || []).map(ci => ({ ...ci, id: ci.id || uuidv4(), category: ci.category, paymentSource: ci.paymentSource, quantity: Number(ci.quantity), unitPrice: Number(ci.unitPrice), total: (Number(ci.quantity) || 0) * (Number(ci.unitPrice) || 0) }));
    const totalBreedingCost = processedCostItems.reduce((sum, item) => sum + item.total, 0);

    const recordData: any = {
        farmId: userProfile.farmId,
        ...data,
        matingDate: format(data.matingDate, 'yyyy-MM-dd'),
        expectedDueDate: data.expectedDueDate ? format(data.expectedDueDate, 'yyyy-MM-dd') : undefined,
        actualDueDate: data.actualDueDate ? format(data.actualDueDate, 'yyyy-MM-dd') : undefined,
        offspringCount: data.offspringCount ?? null,
        totalBreedingCost,
        costItems: processedCostItems,
        updatedAt: serverTimestamp(),
    };
  
    const batch = writeBatch(db);
  
    try {
      let recordId: string;
      if (editingRecord) {
        recordId = editingRecord.id;
        const recordRef = doc(db, RECORDS_COLLECTION, recordId);
        batch.update(recordRef, recordData);
        
        const transQuery = query(collection(db, TRANSACTIONS_COLLECTION), where("linkedActivityId", "==", recordId));
        const oldTransSnap = await getDocs(transQuery);
        oldTransSnap.forEach(doc => batch.delete(doc.ref));
      } else {
        const recordRef = doc(collection(db, RECORDS_COLLECTION));
        recordId = recordRef.id;
        batch.set(recordRef, { ...recordData, createdAt: serverTimestamp() });
      }
  
      recordData.costItems.forEach((item: CostItem) => {
        const transRef = doc(collection(db, TRANSACTIONS_COLLECTION));
        const newTransaction: Omit<OperationalTransaction, 'id'> = {
          farmId: userProfile.farmId,
          date: recordData.matingDate,
          description: `Breeding: ${item.description}`,
          amount: item.total,
          type: 'Expense',
          category: item.category,
          paymentSource: item.paymentSource,
          linkedModule: 'Breeding',
          linkedActivityId: recordId,
          linkedItemId: item.id,
        };
        batch.set(transRef, newTransaction);
      });
  
      await batch.commit();
  
      if (editingRecord) {
        setRecords(records.map(rec => rec.id === recordId ? { ...rec, ...recordData, id: recordId } : rec));
        toast({ title: "Record Updated", description: `Breeding record for ${data.femaleIdentifier} has been updated.` });
      } else {
        const newRecordForState: BreedingRecord = {
            ...recordData,
            id: recordId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        setRecords(prev => [...prev, newRecordForState]);
        toast({ title: "Record Logged", description: `Breeding record for ${data.femaleIdentifier} has been logged.` });
      }
  
      setIsModalOpen(false);
      setEditingRecord(null);
      form.reset();
  
    } catch (err: any) {
        console.error("Error saving record:", err);
        toast({ title: "Save Failed", description: `Could not save record. Error: ${err.message}`, variant: "destructive" });
    }
  };


  const handleDeleteRecord = async (id: string) => {
    const recordToDelete = records.find(r => r.id === id);
    if (!recordToDelete || !db) return;
    
    const batch = writeBatch(db);
    try {
        batch.delete(doc(db, RECORDS_COLLECTION, id));
        
        const transQuery = query(collection(db, TRANSACTIONS_COLLECTION), where("linkedActivityId", "==", id));
        const transSnap = await getDocs(transQuery);
        transSnap.forEach(doc => batch.delete(doc.ref));

        await batch.commit();
        setRecords(records.filter((rec) => rec.id !== id));
        toast({ title: "Record Deleted", description: `Breeding record has been removed.`, variant: "destructive" });
    } catch(err: any) {
         console.error("Error deleting record:", err);
        toast({ title: "Deletion Failed", description: `Could not delete record. Error: ${err.message}`, variant: "destructive" });
    }
  };
  
  if (isProfileLoading || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-12rem)]">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
        <p className="ml-3 text-lg text-muted-foreground">Loading breeding records...</p>
      </div>
    );
  }
  
  if (error) {
     return (
        <div className="container mx-auto py-10">
         <Card className="w-full max-w-lg mx-auto text-center shadow-lg">
            <CardHeader><CardTitle className="flex items-center justify-center text-xl text-destructive"><AlertTriangle className="mr-2 h-6 w-6" /> Data Loading Error</CardTitle></CardHeader>
            <CardContent><p className="text-muted-foreground mb-2">{error}</p></CardContent>
         </Card>
        </div>
     );
  }

  return (
    <div>
      <PageHeader
        title="Breeding & Incubation"
        icon={Construction}
        description="Manage breeding ratios, incubation, fertility, and hatch rates."
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push('/animal-production')}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Animal Production
            </Button>
            <Button onClick={() => handleOpenModal()}>
              <PlusCircle className="mr-2 h-4 w-4" /> Log New Breeding Record
            </Button>
          </div>
        }
      />

      <Dialog open={isModalOpen} onOpenChange={(isOpen) => {
        setIsModalOpen(isOpen);
        if (!isOpen) { form.reset(); setEditingRecord(null); }
      }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{editingRecord ? 'Edit Breeding Record' : 'Log New Breeding Record'}</DialogTitle>
          </DialogHeader>
          <div className="flex-grow overflow-y-auto pr-2 py-4">
            <Form {...form}>
              <form id={ACTIVITY_FORM_ID} onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <section className="space-y-4 p-4 border rounded-lg">
                  <h3 className="text-lg font-semibold text-primary">Breeding Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <FormField control={form.control} name="farmingYearId" render={({ field }) => (<FormItem><FormLabel>Farming Year*</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select Year" /></SelectTrigger></FormControl><SelectContent>{farmingYears.map(year => <SelectItem key={year.id} value={year.id}>{year.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                     <FormField control={form.control} name="farmingSeasonId" render={({ field }) => (<FormItem><FormLabel>Farming Season*</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value} disabled={!watchedFarmingYearId}><FormControl><SelectTrigger><SelectValue placeholder="Select Season" /></SelectTrigger></FormControl><SelectContent>{farmingYears.find(y => y.id === watchedFarmingYearId)?.seasons.map(season => <SelectItem key={season.id} value={season.id}>{season.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                   </div>
                   <FormField control={form.control} name="activityType" render={({ field }) => (
                    <FormItem><FormLabel>Breeding Method*</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select method" /></SelectTrigger></FormControl>
                        <SelectContent>{breedingActivityTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent>
                      </Select><FormMessage />
                    </FormItem>)}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="maleIdentifier" render={({ field }) => (<FormItem><FormLabel>Male ID/Tag*</FormLabel><FormControl><Input placeholder="e.g., Bull-001" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="femaleIdentifier" render={({ field }) => (<FormItem><FormLabel>Female ID/Tag*</FormLabel><FormControl><Input placeholder="e.g., Cow-A24" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <FormField control={form.control} name="matingDate" render={({ field }) => (
                        <FormItem className="flex flex-col"><FormLabel>Mating Date*</FormLabel>
                          <Popover><PopoverTrigger asChild>
                              <FormControl>
                                <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                  {field.value ? (format(field.value, "PPP")) : (<span>Pick a date</span>)}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>)}
                      />
                     <FormField control={form.control} name="expectedDueDate" render={({ field }) => (
                        <FormItem className="flex flex-col"><FormLabel>Expected Due Date (Optional)</FormLabel>
                          <Popover><PopoverTrigger asChild>
                              <FormControl>
                                <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                  {field.value ? (format(field.value, "PPP")) : (<span>Pick a date</span>)}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>)}
                      />
                  </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="actualDueDate" render={({ field }) => (
                        <FormItem className="flex flex-col"><FormLabel>Actual Delivery Date (Optional)</FormLabel>
                          <Popover><PopoverTrigger asChild>
                              <FormControl>
                                <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                  {field.value ? (format(field.value, "PPP")) : (<span>Pick a date</span>)}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>)}
                      />
                    <FormField control={form.control} name="offspringCount" render={({ field }) => (<FormItem><FormLabel>Offspring Count (Optional)</FormLabel><FormControl><Input type="number" step="1" placeholder="e.g., 1" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  </div>
                  <FormField control={form.control} name="notes" render={({ field }) => (<FormItem><FormLabel>General Notes (Optional)</FormLabel><FormControl><Textarea placeholder="Observations, health of mother/offspring, etc." {...field} /></FormControl><FormMessage /></FormItem>)} />
                </section>
                <section className="space-y-4 p-4 border rounded-lg">
                  <div className="flex justify-between items-center"><h3 className="text-lg font-semibold text-primary">Cost Items</h3><Button type="button" size="sm" variant="outline" onClick={() => append({ description: '', category: 'Vet Services', paymentSource: 'Cash', unit: '', quantity: 1, unitPrice: 0 })}><PlusCircle className="mr-2 h-4 w-4" /> Add Cost Item</Button></div>
                  {fields.map((field, index) => (
                    <div key={field.id} className="p-3 border rounded-md space-y-3 bg-muted/20 relative">
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                         <FormField control={form.control} name={`costItems.${index}.category`} render={({ field: f }) => (<FormItem><FormLabel>Category*</FormLabel><Select onValueChange={f.onChange} defaultValue={f.value}><FormControl><SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger></FormControl><SelectContent>{costCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                         <FormField control={form.control} name={`costItems.${index}.description`} render={({ field: f }) => (<FormItem><FormLabel>Description*</FormLabel><FormControl><Input placeholder="e.g., Vet Service, AI Semen" {...f} /></FormControl><FormMessage /></FormItem>)} />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
                        <FormField control={form.control} name={`costItems.${index}.paymentSource`} render={({ field: f }) => (<FormItem><FormLabel>Payment Source*</FormLabel><Select onValueChange={f.onChange} defaultValue={f.value}><FormControl><SelectTrigger><SelectValue placeholder="Select payment source" /></SelectTrigger></FormControl><SelectContent>{paymentSources.map(src => <SelectItem key={src} value={src}>{src}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name={`costItems.${index}.unit`} render={({ field: f }) => (<FormItem><FormLabel>Unit*</FormLabel><FormControl><Input placeholder="e.g., Service, Straw" {...f} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name={`costItems.${index}.quantity`} render={({ field: f }) => (<FormItem><FormLabel>Quantity*</FormLabel><FormControl><Input type="number" step="0.01" placeholder="0.00" {...f} onChange={e => {f.onChange(parseFloat(e.target.value)); form.setValue(`costItems.${index}.total`, parseFloat(e.target.value) * (form.getValues(`costItems.${index}.unitPrice`) || 0) ) }} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name={`costItems.${index}.unitPrice`} render={({ field: f }) => (<FormItem><FormLabel>Unit Price*</FormLabel><FormControl><Input type="number" step="0.01" placeholder="0.00" {...f} onChange={e => {f.onChange(parseFloat(e.target.value)); form.setValue(`costItems.${index}.total`, parseFloat(e.target.value) * (form.getValues(`costItems.${index}.quantity`) || 0) ) }} /></FormControl><FormMessage /></FormItem>)} />
                        <div><Label>Item Total</Label><Input value={((form.watch(`costItems.${index}.quantity`) || 0) * (form.watch(`costItems.${index}.unitPrice`) || 0)).toFixed(2)} readOnly disabled className="font-semibold bg-input" /></div>
                      </div>
                      <Button type="button" variant="ghost" size="icon" className="absolute top-1 right-1 text-destructive hover:bg-destructive/10" onClick={() => remove(index)}><Trash2 className="h-4 w-4" /><span className="sr-only">Remove Item</span></Button>
                    </div>
                  ))}
                  {fields.length === 0 && <p className="text-sm text-muted-foreground text-center py-2">No cost items added yet.</p>}
                  <Separator className="my-4" />
                  <div className="flex justify-end items-center space-x-3"><Label className="text-md font-semibold">Total Breeding Cost:</Label><Input value={calculateTotalCost(watchedCostItems).toFixed(2)} readOnly disabled className="w-32 font-bold text-lg text-right bg-input" /></div>
                </section>
              </form>
            </Form>
          </div>
          <DialogFooter className="py-4 px-6 border-t"><DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose><Button type="submit" form={ACTIVITY_FORM_ID}>{editingRecord ? 'Save Changes' : 'Log Record'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <Card className="shadow-lg">
        <CardHeader><CardTitle>Logged Breeding Records</CardTitle><CardDescription>View all recorded breeding activities and their total costs.</CardDescription></CardHeader>
        <CardContent>
          {records.length > 0 ? (
            <Table>
              <TableHeader><TableRow><TableHead>Female ID</TableHead><TableHead>Mating Date</TableHead><TableHead>Due Date</TableHead><TableHead>Offspring</TableHead><TableHead className="text-right">Total Cost</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {records.sort((a,b) => parseISO(b.matingDate).getTime() - parseISO(a.matingDate).getTime()).map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">{record.femaleIdentifier}</TableCell>
                    <TableCell>{isValid(parseISO(record.matingDate)) ? format(parseISO(record.matingDate), 'PP') : 'Invalid Date'}</TableCell>
                    <TableCell>{record.expectedDueDate && isValid(parseISO(record.expectedDueDate)) ? format(parseISO(record.expectedDueDate), 'PP') : 'N/A'}</TableCell>
                    <TableCell>{record.offspringCount ?? 'N/A'}</TableCell>
                    <TableCell className="text-right font-semibold">{record.totalBreedingCost.toFixed(2)}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="icon" onClick={() => handleOpenModal(record)} className="h-8 w-8"><Edit2 className="h-4 w-4" /><span className="sr-only">Edit</span></Button>
                      <Button variant="destructive" size="icon" onClick={() => handleDeleteRecord(record.id)} className="h-8 w-8"><Trash2 className="h-4 w-4" /><span className="sr-only">Delete</span></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : ( <div className="text-center py-10"><Construction className="mx-auto h-12 w-12 text-muted-foreground" /><p className="mt-4 text-muted-foreground">No breeding records logged yet.</p><p className="text-sm text-muted-foreground">Click "Log New Breeding Record" to get started.</p></div> )}
        </CardContent>
      </Card>
      <Card className="mt-6 bg-muted/30 p-4">
        <CardHeader className="p-0 pb-2"><CardTitle className="text-base font-semibold text-muted-foreground">About Breeding Management</CardTitle></CardHeader>
        <CardContent className="p-0 text-xs text-muted-foreground space-y-1">
            <p>&bull; This module helps track the reproductive cycle of your livestock.</p>
            <p>&bull; All costs logged here, such as for Artificial Insemination, are automatically added to the central financial ledger.</p>
        </CardContent>
      </Card>
    </div>
  );
}
