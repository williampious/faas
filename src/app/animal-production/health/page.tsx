
'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@/components/layout/page-header';
import { ShieldCheck, PlusCircle, Trash2, Edit2, ArrowLeft } from 'lucide-react';
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
import type { CostItem, HealthRecord, HealthActivityType } from '@/types/livestock';
import { healthActivityTypes } from '@/types/livestock';

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

const healthRecordFormSchema = z.object({
  activityType: z.enum(healthActivityTypes, { required_error: "Activity type is required." }),
  date: z.string().refine((val) => !!val && isValid(parseISO(val)), { message: "Valid date is required." }),
  animalsAffected: z.string().min(1, "This field is required").max(150),
  medicationOrTreatment: z.string().max(100).optional(),
  dosage: z.string().max(50).optional(),
  administeredBy: z.string().max(100).optional(),
  notes: z.string().max(1000).optional(),
  costItems: z.array(costItemSchema).optional(),
});
type HealthRecordFormValues = z.infer<typeof healthRecordFormSchema>;

const LOCAL_STORAGE_KEY_RECORDS = 'animalHealthRecords_v1';
const LOCAL_STORAGE_KEY_TRANSACTIONS = 'farmTransactions_v1';
const ACTIVITY_FORM_ID = 'health-record-form';


export default function HealthCarePage() {
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<HealthRecord | null>(null);
  const { toast } = useToast();
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();

  const form = useForm<HealthRecordFormValues>({
    resolver: zodResolver(healthRecordFormSchema),
    defaultValues: {
      activityType: undefined, date: '', animalsAffected: '',
      medicationOrTreatment: '', dosage: '', administeredBy: '', notes: '', costItems: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "costItems",
  });

  const watchedCostItems = form.watch("costItems");

  const calculateTotalCost = (items: CostItemFormValues[] | undefined) => {
    if (!items) return 0;
    return items.reduce((acc, item) => (acc + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0)), 0);
  };

  useEffect(() => {
    setIsMounted(true);
    const storedRecords = localStorage.getItem(LOCAL_STORAGE_KEY_RECORDS);
    if (storedRecords) {
      setRecords(JSON.parse(storedRecords));
    }
  }, []);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem(LOCAL_STORAGE_KEY_RECORDS, JSON.stringify(records));
    }
  }, [records, isMounted]);

  const handleOpenModal = (recordToEdit?: HealthRecord) => {
    if (recordToEdit) {
      setEditingRecord(recordToEdit);
      form.reset({
        ...recordToEdit,
        medicationOrTreatment: recordToEdit.medicationOrTreatment || '',
        dosage: recordToEdit.dosage || '',
        administeredBy: recordToEdit.administeredBy || '',
        notes: recordToEdit.notes || '',
        costItems: recordToEdit.costItems.map(ci => ({...ci, id: ci.id || crypto.randomUUID()})) || [],
      });
    } else {
      setEditingRecord(null);
      form.reset({
        activityType: undefined, date: '', animalsAffected: '',
        medicationOrTreatment: '', dosage: '', administeredBy: '', notes: '', costItems: [],
      });
    }
    setIsModalOpen(true);
  };

  const onSubmit: SubmitHandler<HealthRecordFormValues> = (data) => {
    const now = new Date().toISOString();
    const activityId = editingRecord ? editingRecord.id : crypto.randomUUID();
    const processedCostItems: CostItem[] = (data.costItems || []).map(ci => ({
      ...ci, id: ci.id || crypto.randomUUID(), category: ci.category, paymentSource: ci.paymentSource,
      quantity: Number(ci.quantity), unitPrice: Number(ci.unitPrice),
      total: (Number(ci.quantity) || 0) * (Number(ci.unitPrice) || 0),
    }));
    const totalActivityCost = processedCostItems.reduce((sum, item) => sum + item.total, 0);

    const storedTransactions = localStorage.getItem(LOCAL_STORAGE_KEY_TRANSACTIONS);
    let allTransactions: OperationalTransaction[] = storedTransactions ? JSON.parse(storedTransactions) : [];
    allTransactions = allTransactions.filter(t => t.linkedActivityId !== activityId);
    
    const newTransactions: OperationalTransaction[] = processedCostItems.map(item => ({
      id: crypto.randomUUID(), date: data.date, description: item.description, amount: item.total, type: 'Expense' as const,
      category: item.category, paymentSource: item.paymentSource, linkedModule: 'Animal Health' as const,
      linkedActivityId: activityId, linkedItemId: item.id,
    }));
    allTransactions.push(...newTransactions);
    localStorage.setItem(LOCAL_STORAGE_KEY_TRANSACTIONS, JSON.stringify(allTransactions));

    if (editingRecord) {
      const updatedRecord = { ...editingRecord, ...data, costItems: processedCostItems, totalActivityCost, updatedAt: now };
      setRecords(records.map((rec) => rec.id === activityId ? updatedRecord : rec));
      toast({ title: "Health Record Updated", description: `${data.activityType} activity has been updated.` });
    } else {
      const newRecord: HealthRecord = {
        id: activityId, ...data,
        medicationOrTreatment: data.medicationOrTreatment || undefined,
        dosage: data.dosage || undefined,
        administeredBy: data.administeredBy || undefined,
        notes: data.notes || undefined,
        costItems: processedCostItems, totalActivityCost, createdAt: now, updatedAt: now,
      };
      setRecords(prev => [...prev, newRecord]);
      toast({ title: "Health Record Logged", description: `${data.activityType} activity has been successfully logged.` });
    }
    
    setIsModalOpen(false);
    setEditingRecord(null);
    form.reset();
  };

  const handleDeleteRecord = (id: string) => {
    setRecords(records.filter((rec) => rec.id !== id));
    
    const storedTransactions = localStorage.getItem(LOCAL_STORAGE_KEY_TRANSACTIONS);
    if(storedTransactions) {
        let allTransactions: OperationalTransaction[] = JSON.parse(storedTransactions);
        allTransactions = allTransactions.filter(t => t.linkedActivityId !== id);
        localStorage.setItem(LOCAL_STORAGE_KEY_TRANSACTIONS, JSON.stringify(allTransactions));
    }
    toast({ title: "Record Deleted", description: "The health record and its financial transactions have been removed.", variant: "destructive" });
  };
  
  if (!isMounted) return null;

  return (
    <div>
      <PageHeader
        title="Health Care & Biosecurity"
        icon={ShieldCheck}
        description="Log vaccinations, treatments, and other health-related activities for your livestock."
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push('/animal-production')}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Animal Production
            </Button>
            <Button onClick={() => handleOpenModal()}>
              <PlusCircle className="mr-2 h-4 w-4" /> Log New Health Record
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
            <DialogTitle>{editingRecord ? 'Edit Health Record' : 'Log New Health Record'}</DialogTitle>
            <DialogDescription>
              {editingRecord ? 'Update the details and costs of this health activity.' : 'Enter details and costs for the new health activity.'}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-grow overflow-y-auto pr-2 py-4">
            <Form {...form}>
              <form id={ACTIVITY_FORM_ID} onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <section className="space-y-4 p-4 border rounded-lg">
                  <h3 className="text-lg font-semibold text-primary">Activity Details</h3>
                  <FormField control={form.control} name="activityType" render={({ field }) => (
                    <FormItem><FormLabel>Activity Type*</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select activity type" /></SelectTrigger></FormControl>
                        <SelectContent>{healthActivityTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent>
                      </Select><FormMessage />
                    </FormItem>)}
                  />
                  <FormField control={form.control} name="date" render={({ field }) => (<FormItem><FormLabel>Date*</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="animalsAffected" render={({ field }) => (<FormItem><FormLabel>Animals Affected*</FormLabel><FormControl><Input placeholder="e.g., Broiler House 1, All Goats, Cow #23" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="medicationOrTreatment" render={({ field }) => (<FormItem><FormLabel>Medication/Treatment (Optional)</FormLabel><FormControl><Input placeholder="e.g., Ivermectin, Gumboro Vaccine" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="dosage" render={({ field }) => (<FormItem><FormLabel>Dosage (Optional)</FormLabel><FormControl><Input placeholder="e.g., 10ml, 1 tablet per bird" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="administeredBy" render={({ field }) => (<FormItem><FormLabel>Administered By (Optional)</FormLabel><FormControl><Input placeholder="e.g., Self, Dr. John Doe (Vet)" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  </div>
                  <FormField control={form.control} name="notes" render={({ field }) => (<FormItem><FormLabel>General Notes (Optional)</FormLabel><FormControl><Textarea placeholder="Withdrawal period, observations, next scheduled date, etc." {...field} /></FormControl><FormMessage /></FormItem>)} />
                </section>
                <section className="space-y-4 p-4 border rounded-lg">
                  <div className="flex justify-between items-center"><h3 className="text-lg font-semibold text-primary">Cost Items</h3><Button type="button" size="sm" variant="outline" onClick={() => append({ description: '', category: costCategories[0], paymentSource: paymentSources[0], unit: '', quantity: 1, unitPrice: 0 })}><PlusCircle className="mr-2 h-4 w-4" /> Add Cost Item</Button></div>
                  {fields.map((field, index) => (
                    <div key={field.id} className="p-3 border rounded-md space-y-3 bg-muted/20 relative">
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                         <FormField control={form.control} name={`costItems.${index}.category`} render={({ field: f }) => (<FormItem><FormLabel>Category*</FormLabel><Select onValueChange={f.onChange} defaultValue={f.value}><FormControl><SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger></FormControl><SelectContent>{costCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                         <FormField control={form.control} name={`costItems.${index}.description`} render={({ field: f }) => (<FormItem><FormLabel>Description*</FormLabel><FormControl><Input placeholder="e.g., Vet Services, Gumboro Vaccine" {...f} /></FormControl><FormMessage /></FormItem>)} />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
                        <FormField control={form.control} name={`costItems.${index}.paymentSource`} render={({ field: f }) => (<FormItem><FormLabel>Source*</FormLabel><Select onValueChange={f.onChange} defaultValue={f.value}><FormControl><SelectTrigger><SelectValue placeholder="Paid from..." /></SelectTrigger></FormControl><SelectContent>{paymentSources.map(src => <SelectItem key={src} value={src}>{src}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name={`costItems.${index}.unit`} render={({ field: f }) => (<FormItem><FormLabel>Unit*</FormLabel><FormControl><Input placeholder="e.g., Vial, Visit, Hour" {...f} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name={`costItems.${index}.quantity`} render={({ field: f }) => (<FormItem><FormLabel>Quantity*</FormLabel><FormControl><Input type="number" step="0.01" placeholder="0.00" {...f} onChange={e => {f.onChange(parseFloat(e.target.value)); form.setValue(`costItems.${index}.total`, parseFloat(e.target.value) * (form.getValues(`costItems.${index}.unitPrice`) || 0) ) }} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name={`costItems.${index}.unitPrice`} render={({ field: f }) => (<FormItem><FormLabel>Unit Price*</FormLabel><FormControl><Input type="number" step="0.01" placeholder="0.00" {...f} onChange={e => {f.onChange(parseFloat(e.target.value)); form.setValue(`costItems.${index}.total`, parseFloat(e.target.value) * (form.getValues(`costItems.${index}.quantity`) || 0) ) }} /></FormControl><FormMessage /></FormItem>)} />
                        <div><Label>Item Total</Label><Input value={((form.watch(`costItems.${index}.quantity`) || 0) * (form.watch(`costItems.${index}.unitPrice`) || 0)).toFixed(2)} readOnly disabled className="font-semibold bg-input" /></div>
                      </div>
                      <Button type="button" variant="ghost" size="icon" className="absolute top-1 right-1 text-destructive hover:bg-destructive/10" onClick={() => remove(index)}><Trash2 className="h-4 w-4" /><span className="sr-only">Remove Item</span></Button>
                    </div>
                  ))}
                  {fields.length === 0 && <p className="text-sm text-muted-foreground text-center py-2">No cost items added yet.</p>}
                  <Separator className="my-4" />
                  <div className="flex justify-end items-center space-x-3"><Label className="text-md font-semibold">Total Activity Cost:</Label><Input value={calculateTotalCost(watchedCostItems).toFixed(2)} readOnly disabled className="w-32 font-bold text-lg text-right bg-input" /></div>
                </section>
              </form>
            </Form>
          </div>
          <DialogFooter className="py-4 px-6 border-t"><DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose><Button type="submit" form={ACTIVITY_FORM_ID}>{editingRecord ? 'Save Changes' : 'Log Record'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <Card className="shadow-lg">
        <CardHeader><CardTitle>Logged Health Records</CardTitle><CardDescription>View all recorded health activities and their total costs. Edit or delete as needed.</CardDescription></CardHeader>
        <CardContent>
          {records.length > 0 ? (
            <Table>
              <TableHeader><TableRow><TableHead>Activity Type</TableHead><TableHead>Date</TableHead><TableHead>Animals Affected</TableHead><TableHead>Medication/Treatment</TableHead><TableHead className="text-right">Total Cost</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {records.sort((a,b) => parseISO(b.date).getTime() - parseISO(a.date).getTime()).map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">{record.activityType}</TableCell>
                    <TableCell>{isValid(parseISO(record.date)) ? format(parseISO(record.date), 'PP') : 'Invalid Date'}</TableCell>
                    <TableCell>{record.animalsAffected}</TableCell>
                    <TableCell>{record.medicationOrTreatment || 'N/A'}</TableCell>
                    <TableCell className="text-right font-semibold">{record.totalActivityCost.toFixed(2)}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="icon" onClick={() => handleOpenModal(record)} className="h-8 w-8"><Edit2 className="h-4 w-4" /><span className="sr-only">Edit</span></Button>
                      <Button variant="destructive" size="icon" onClick={() => handleDeleteRecord(record.id)} className="h-8 w-8"><Trash2 className="h-4 w-4" /><span className="sr-only">Delete</span></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : ( <div className="text-center py-10"><ShieldCheck className="mx-auto h-12 w-12 text-muted-foreground" /><p className="mt-4 text-muted-foreground">No health records logged yet.</p><p className="text-sm text-muted-foreground">Click "Log New Health Record" to get started.</p></div> )}
        </CardContent>
      </Card>
      <Card className="mt-6 bg-muted/30 p-4">
        <CardHeader className="p-0 pb-2"><CardTitle className="text-base font-semibold text-muted-foreground">About Health Costing</CardTitle></CardHeader>
        <CardContent className="p-0 text-xs text-muted-foreground space-y-1">
            <p>&bull; This section tracks vital health and biosecurity activities and their costs.</p>
            <p>&bull; Log activities such as vaccinations, treatments, or regular health checks.</p>
            <p>&bull; Itemize costs for medicines, vaccines, veterinary services, and other related inputs.</p>
            <p>&bull; All costs logged here are automatically added to the central financial ledger for accurate tracking.</p>
        </CardContent>
      </Card>
    </div>
  );
}
