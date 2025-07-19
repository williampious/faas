
'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@/components/layout/page-header';
import { Layers, PlusCircle, Trash2, Edit2, ArrowLeft, Loader2, AlertTriangle, CalendarIcon } from 'lucide-react';
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
import type { SoilTestRecord } from '@/types/soil';
import { useUserProfile } from '@/contexts/user-profile-context';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, writeBatch, orderBy } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { cn } from '@/lib/utils';

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

const soilTestFormSchema = z.object({
  testDate: z.date({ required_error: "A date is required." }),
  plotName: z.string().min(1, { message: "Plot name is required." }).max(100),
  phLevel: z.preprocess(safeParseFloat, z.number().min(0).max(14).optional()),
  nitrogenPPM: z.preprocess(safeParseFloat, z.number().min(0).optional()),
  phosphorusPPM: z.preprocess(safeParseFloat, z.number().min(0).optional()),
  potassiumPPM: z.preprocess(safeParseFloat, z.number().min(0).optional()),
  organicMatterPercent: z.preprocess(safeParseFloat, z.number().min(0).max(100).optional()),
  labName: z.string().max(100).optional(),
  notes: z.string().max(1000).optional(), // for recommendations
  costItems: z.array(costItemSchema).optional(),
});
type SoilTestFormValues = z.infer<typeof soilTestFormSchema>;

const RECORDS_COLLECTION = 'soilTestRecords';
const TRANSACTIONS_COLLECTION = 'transactions';
const ACTIVITY_FORM_ID = 'soil-test-form';

export default function SoilWaterManagementPage() {
  const [records, setRecords] = useState<SoilTestRecord[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<SoilTestRecord | null>(null);
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { userProfile, isLoading: isProfileLoading } = useUserProfile();

  const form = useForm<SoilTestFormValues>({
    resolver: zodResolver(soilTestFormSchema),
    defaultValues: {
      plotName: '', phLevel: undefined, nitrogenPPM: undefined, phosphorusPPM: undefined,
      potassiumPPM: undefined, organicMatterPercent: undefined, labName: '', notes: '', costItems: [],
    },
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: "costItems" });
  const watchedCostItems = form.watch("costItems");
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
        const q = query(collection(db, RECORDS_COLLECTION), where("farmId", "==", userProfile.farmId), orderBy("testDate", "desc"));
        const querySnapshot = await getDocs(q);
        const fetchedRecords = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as SoilTestRecord[];
        setRecords(fetchedRecords);
      } catch (err: any) {
        console.error("Error fetching soil test records:", err);
        setError(`Failed to fetch data: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRecords();
  }, [userProfile, isProfileLoading]);

  const handleOpenModal = (recordToEdit?: SoilTestRecord) => {
    if (recordToEdit) {
      setEditingRecord(recordToEdit);
      form.reset({ ...recordToEdit, testDate: parseISO(recordToEdit.testDate), costItems: recordToEdit.costItems?.map(ci => ({...ci, id: ci.id || uuidv4()})) || [] });
    } else {
      setEditingRecord(null);
      form.reset({
        plotName: '', phLevel: undefined, nitrogenPPM: undefined, phosphorusPPM: undefined,
        potassiumPPM: undefined, organicMatterPercent: undefined, labName: '', notes: '', costItems: [],
      });
    }
    setIsModalOpen(true);
  };

  const onSubmit: SubmitHandler<SoilTestFormValues> = async (data) => {
    if (!userProfile?.farmId || !db) {
      toast({ title: "Error", description: "Cannot save. Farm/database information is missing.", variant: "destructive" });
      return;
    }
  
    const totalCost = calculateTotalCost(data.costItems);
    const recordData: any = {
      farmId: userProfile.farmId,
      ...data,
      testDate: format(data.testDate, 'yyyy-MM-dd'),
      totalCost,
      costItems: (data.costItems || []).map(ci => ({
        ...ci,
        total: (Number(ci.quantity) || 0) * (Number(ci.unitPrice) || 0),
        id: ci.id || uuidv4(),
      })),
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
          date: recordData.testDate,
          description: `Soil Test: ${item.description}`,
          amount: item.total,
          type: 'Expense',
          category: item.category,
          paymentSource: item.paymentSource,
          linkedModule: 'Soil & Water Management',
          linkedActivityId: recordId,
          linkedItemId: item.id,
        };
        batch.set(transRef, newTransaction);
      });
  
      await batch.commit();
  
      if (editingRecord) {
        setRecords(records.map(rec => rec.id === recordId ? { ...rec, ...recordData, id: recordId } : rec));
        toast({ title: "Record Updated", description: "Soil test record has been updated." });
      } else {
        const newRecordForState: SoilTestRecord = {
            ...recordData, id: recordId,
            createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
        };
        setRecords(prev => [...prev, newRecordForState]);
        toast({ title: "Record Logged", description: "Soil test record has been logged." });
      }
  
      setIsModalOpen(false);
      setEditingRecord(null);
      form.reset();
  
    } catch (err: any) {
        console.error("Error saving record:", err);
        toast({ title: "Save Failed", description: `Could not save record: ${err.message}`, variant: "destructive" });
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
        toast({ title: "Record Deleted", description: `Soil test record has been removed.`, variant: "destructive" });
    } catch(err: any) {
        console.error("Error deleting record:", err);
        toast({ title: "Deletion Failed", description: `Could not delete record: ${err.message}`, variant: "destructive" });
    }
  };
  
  if (isProfileLoading || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-12rem)]">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
        <p className="ml-3 text-lg text-muted-foreground">Loading soil data...</p>
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
        title="Soil & Water Management"
        icon={Layers}
        description="Log and monitor soil test results for your farm plots."
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push('/farm-management')}><ArrowLeft className="mr-2 h-4 w-4" /> Back to Farm Management</Button>
            <Button onClick={() => handleOpenModal()}><PlusCircle className="mr-2 h-4 w-4" /> Log New Soil Test</Button>
          </div>
        }
      />

      <Dialog open={isModalOpen} onOpenChange={(isOpen) => {
        setIsModalOpen(isOpen);
        if (!isOpen) { form.reset(); setEditingRecord(null); }
      }}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{editingRecord ? 'Edit Soil Test Record' : 'Log New Soil Test Record'}</DialogTitle>
          </DialogHeader>
          <div className="flex-grow overflow-y-auto pr-2 py-4">
            <Form {...form}>
              <form id={ACTIVITY_FORM_ID} onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <section className="space-y-4 p-4 border rounded-lg">
                  <h3 className="text-lg font-semibold text-primary">Test Details</h3>
                   <FormField control={form.control} name="testDate" render={({ field }) => (
                    <FormItem className="flex flex-col"><FormLabel>Test Date*</FormLabel>
                      <Popover><PopoverTrigger asChild>
                          <FormControl>
                            <Button variant={"outline"} className={cn("w-[240px] pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
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
                  <FormField control={form.control} name="plotName" render={({ field }) => (<FormItem><FormLabel>Plot/Field Name*</FormLabel><FormControl><Input placeholder="e.g., North Field, Plot A" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="labName" render={({ field }) => (<FormItem><FormLabel>Lab Name (Optional)</FormLabel><FormControl><Input placeholder="e.g., CSIR-SARI Lab" {...field} /></FormControl><FormMessage /></FormItem>)} />
                </section>
                <section className="space-y-4 p-4 border rounded-lg">
                  <h3 className="text-lg font-semibold text-primary">Test Results</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <FormField control={form.control} name="phLevel" render={({ field }) => (<FormItem><FormLabel>pH Level</FormLabel><FormControl><Input type="number" step="0.1" placeholder="e.g., 6.5" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="nitrogenPPM" render={({ field }) => (<FormItem><FormLabel>Nitrogen (PPM)</FormLabel><FormControl><Input type="number" step="0.1" placeholder="e.g., 25.5" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="phosphorusPPM" render={({ field }) => (<FormItem><FormLabel>Phosphorus (PPM)</FormLabel><FormControl><Input type="number" step="0.1" placeholder="e.g., 15.2" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="potassiumPPM" render={({ field }) => (<FormItem><FormLabel>Potassium (PPM)</FormLabel><FormControl><Input type="number" step="0.1" placeholder="e.g., 120.0" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  </div>
                   <FormField control={form.control} name="organicMatterPercent" render={({ field }) => (<FormItem><FormLabel>Organic Matter (%)</FormLabel><FormControl><Input type="number" step="0.1" placeholder="e.g., 3.2" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="notes" render={({ field }) => (<FormItem><FormLabel>Recommendations / Notes (Optional)</FormLabel><FormControl><Textarea placeholder="e.g., Apply lime at 2 tons/acre. Increase Nitrogen application." {...field} /></FormControl><FormMessage /></FormItem>)} />
                </section>
                <section className="space-y-4 p-4 border rounded-lg">
                  <div className="flex justify-between items-center"><h3 className="text-lg font-semibold text-primary">Associated Costs</h3><Button type="button" size="sm" variant="outline" onClick={() => append({ description: 'Soil testing fee', category: 'Services', paymentSource: 'Cash', unit: 'test', quantity: 1, unitPrice: 0 })}><PlusCircle className="mr-2 h-4 w-4" /> Add Cost Item</Button></div>
                  {fields.map((field, index) => (
                    <div key={field.id} className="p-3 border rounded-md space-y-3 bg-muted/20 relative">
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                         <FormField control={form.control} name={`costItems.${index}.category`} render={({ field: f }) => (<FormItem><FormLabel>Category*</FormLabel><Select onValueChange={f.onChange} defaultValue={f.value}><FormControl><SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger></FormControl><SelectContent>{costCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                         <FormField control={form.control} name={`costItems.${index}.description`} render={({ field: f }) => (<FormItem><FormLabel>Description*</FormLabel><FormControl><Input placeholder="e.g., Lab analysis fee" {...f} /></FormControl><FormMessage /></FormItem>)} />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
                        <FormField control={form.control} name={`costItems.${index}.paymentSource`} render={({ field: f }) => (<FormItem><FormLabel>Payment Source*</FormLabel><Select onValueChange={f.onChange} defaultValue={f.value}><FormControl><SelectTrigger><SelectValue placeholder="Select source" /></SelectTrigger></FormControl><SelectContent>{paymentSources.map(src => <SelectItem key={src} value={src}>{src}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name={`costItems.${index}.unit`} render={({ field: f }) => (<FormItem><FormLabel>Unit*</FormLabel><FormControl><Input placeholder="e.g., Test, Sample" {...f} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name={`costItems.${index}.quantity`} render={({ field: f }) => (<FormItem><FormLabel>Quantity*</FormLabel><FormControl><Input type="number" step="0.01" {...f} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name={`costItems.${index}.unitPrice`} render={({ field: f }) => (<FormItem><FormLabel>Unit Price*</FormLabel><FormControl><Input type="number" step="0.01" {...f} /></FormControl><FormMessage /></FormItem>)} />
                        <div><Label>Item Total</Label><Input value={((form.watch(`costItems.${index}.quantity`) || 0) * (form.watch(`costItems.${index}.unitPrice`) || 0)).toFixed(2)} readOnly disabled className="font-semibold bg-input" /></div>
                      </div>
                      <Button type="button" variant="ghost" size="icon" className="absolute top-1 right-1 text-destructive hover:bg-destructive/10" onClick={() => remove(index)}><Trash2 className="h-4 w-4" /><span className="sr-only">Remove Item</span></Button>
                    </div>
                  ))}
                  {fields.length === 0 && <p className="text-sm text-muted-foreground text-center py-2">No costs added for this test.</p>}
                  <Separator className="my-4" />
                  <div className="flex justify-end items-center space-x-3"><Label className="text-md font-semibold">Total Cost:</Label><Input value={calculateTotalCost(watchedCostItems).toFixed(2)} readOnly disabled className="w-32 font-bold text-lg text-right bg-input" /></div>
                </section>
              </form>
            </Form>
          </div>
          <DialogFooter className="py-4 px-6 border-t"><DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose><Button type="submit" form={ACTIVITY_FORM_ID}>{editingRecord ? 'Save Changes' : 'Log Record'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <Card className="shadow-lg">
        <CardHeader><CardTitle>Logged Soil Test Records</CardTitle><CardDescription>View all recorded soil tests. Edit or delete as needed.</CardDescription></CardHeader>
        <CardContent>
          {records.length > 0 ? (
            <Table>
              <TableHeader><TableRow><TableHead>Test Date</TableHead><TableHead>Plot Name</TableHead><TableHead>pH</TableHead><TableHead>N (ppm)</TableHead><TableHead>P (ppm)</TableHead><TableHead>K (ppm)</TableHead><TableHead className="text-right">Total Cost</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {records.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">{isValid(parseISO(record.testDate)) ? format(parseISO(record.testDate), 'PP') : 'Invalid Date'}</TableCell>
                    <TableCell>{record.plotName}</TableCell>
                    <TableCell>{record.phLevel ?? 'N/A'}</TableCell>
                    <TableCell>{record.nitrogenPPM ?? 'N/A'}</TableCell>
                    <TableCell>{record.phosphorusPPM ?? 'N/A'}</TableCell>
                    <TableCell>{record.potassiumPPM ?? 'N/A'}</TableCell>
                    <TableCell className="text-right font-semibold">{record.totalCost.toFixed(2)}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="icon" onClick={() => handleOpenModal(record)} className="h-8 w-8"><Edit2 className="h-4 w-4" /><span className="sr-only">Edit</span></Button>
                      <Button variant="destructive" size="icon" onClick={() => handleDeleteRecord(record.id)} className="h-8 w-8"><Trash2 className="h-4 w-4" /><span className="sr-only">Delete</span></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : ( <div className="text-center py-10"><Layers className="mx-auto h-12 w-12 text-muted-foreground" /><p className="mt-4 text-muted-foreground">No soil test records logged yet.</p><p className="text-sm text-muted-foreground">Click "Log New Soil Test" to get started.</p></div> )}
        </CardContent>
      </Card>
      <Card className="mt-6 bg-muted/30 p-4">
        <CardHeader className="p-0 pb-2"><CardTitle className="text-base font-semibold text-muted-foreground">About Soil Test Records</CardTitle></CardHeader>
        <CardContent className="p-0 text-xs text-muted-foreground space-y-1">
            <p>&bull; This module enables the digital logging of soil analysis results.</p>
            <p>&bull; Costs associated with soil testing are automatically added to your farm's financial ledger.</p>
            <p>&bull; Future versions will leverage this data to provide automated recommendations for soil amendments and fertilization.</p>
        </CardContent>
      </Card>
    </div>
  );
}
