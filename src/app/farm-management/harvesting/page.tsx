
'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@/components/layout/page-header';
import { Wheat, PlusCircle, Trash2, Edit2, ArrowLeft, DollarSign } from 'lucide-react';
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

const yieldUnits = ['kg', 'bags (50kg)', 'bags (100kg)', 'crates', 'tons', 'bunches', 'pieces'] as const;
type YieldUnit = typeof yieldUnits[number];

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

const saleItemSchema = z.object({
  id: z.string().optional(),
  buyer: z.string().min(1, "Buyer name is required.").max(100),
  quantitySold: z.preprocess(
    (val) => parseFloat(String(val)),
    z.number().min(0.01, "Quantity sold must be greater than 0.")
  ),
  unitOfSale: z.string().min(1, "Unit of sale is required.").max(50),
  pricePerUnit: z.preprocess(
    (val) => parseFloat(String(val)),
    z.number().min(0.01, "Price per unit must be greater than 0.")
  ),
  saleDate: z.string().refine((val) => !!val && isValid(parseISO(val)), { message: "Valid sale date is required." }),
  totalSaleAmount: z.number().optional(),
});

type SaleItemFormValues = z.infer<typeof saleItemSchema>;

interface SaleItem extends SaleItemFormValues {
  id: string;
  totalSaleAmount: number;
}

interface HarvestingRecord {
  id: string;
  cropType: string;
  variety?: string;
  dateHarvested: string;
  areaHarvested: string;
  yieldQuantity: number;
  yieldUnit: YieldUnit;
  qualityGrade?: string;
  postHarvestActivities?: string;
  storageLocation?: string;
  notes?: string;
  costItems: CostItem[];
  totalHarvestCost: number;
  salesDetails?: SaleItem[];
  totalSalesIncome: number;
  createdAt: string;
  updatedAt: string;
}

const harvestRecordFormSchema = z.object({
  cropType: z.string().min(1, { message: "Crop type is required." }).max(100),
  variety: z.string().max(100).optional(),
  dateHarvested: z.string().refine((val) => !!val && isValid(parseISO(val)), { message: "Valid date is required." }),
  areaHarvested: z.string().min(1, { message: "Area harvested is required." }).max(100),
  yieldQuantity: z.preprocess(
    (val) => parseFloat(String(val)),
    z.number().min(0.01, "Yield quantity must be greater than 0.")
  ),
  yieldUnit: z.enum(yieldUnits, { required_error: "Yield unit is required." }),
  qualityGrade: z.string().max(50).optional(),
  postHarvestActivities: z.string().max(500).optional(),
  storageLocation: z.string().max(100).optional(),
  notes: z.string().max(500).optional(),
  costItems: z.array(costItemSchema).optional(),
  salesDetails: z.array(saleItemSchema).optional(),
});

type HarvestRecordFormValues = z.infer<typeof harvestRecordFormSchema>;

const LOCAL_STORAGE_KEY_RECORDS = 'harvestingRecords_v1';
const LOCAL_STORAGE_KEY_TRANSACTIONS = 'farmTransactions_v1';
const ACTIVITY_FORM_ID = 'harvesting-record-form';

export default function HarvestingPage() {
  const [records, setRecords] = useState<HarvestingRecord[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<HarvestingRecord | null>(null);
  const { toast } = useToast();
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();

  const form = useForm<HarvestRecordFormValues>({
    resolver: zodResolver(harvestRecordFormSchema),
    defaultValues: {
      cropType: '', variety: '', dateHarvested: '', areaHarvested: '', yieldQuantity: undefined,
      yieldUnit: undefined, qualityGrade: '', postHarvestActivities: '', storageLocation: '', notes: '', costItems: [], salesDetails: [],
    },
  });

  const { fields: costFields, append: appendCost, remove: removeCost } = useFieldArray({ control: form.control, name: "costItems" });
  const watchedCostItems = form.watch("costItems");

  const { fields: saleFields, append: appendSale, remove: removeSale } = useFieldArray({ control: form.control, name: "salesDetails" });
  const watchedSaleItems = form.watch("salesDetails");

  useEffect(() => {
    setIsMounted(true);
    const storedRecords = localStorage.getItem(LOCAL_STORAGE_KEY_RECORDS);
    if (storedRecords) setRecords(JSON.parse(storedRecords));
  }, []);

  useEffect(() => {
    if (isMounted) localStorage.setItem(LOCAL_STORAGE_KEY_RECORDS, JSON.stringify(records));
  }, [records, isMounted]);

  const handleOpenModal = (recordToEdit?: HarvestingRecord) => {
    if (recordToEdit) {
      setEditingRecord(recordToEdit);
      form.reset({
        ...recordToEdit, notes: recordToEdit.notes || '', variety: recordToEdit.variety || '',
        qualityGrade: recordToEdit.qualityGrade || '', postHarvestActivities: recordToEdit.postHarvestActivities || '',
        storageLocation: recordToEdit.storageLocation || '',
        costItems: recordToEdit.costItems.map(ci => ({...ci, id: ci.id || crypto.randomUUID()})) || [],
        salesDetails: recordToEdit.salesDetails?.map(si => ({...si, id: si.id || crypto.randomUUID()})) || [],
      });
    } else {
      setEditingRecord(null);
      form.reset({
        cropType: '', variety: '', dateHarvested: '', areaHarvested: '', yieldQuantity: undefined,
        yieldUnit: undefined, qualityGrade: '', postHarvestActivities: '', storageLocation: '', notes: '', costItems: [], salesDetails: [],
      });
    }
    setIsModalOpen(true);
  };

  const onSubmit: SubmitHandler<HarvestRecordFormValues> = (data) => {
    const now = new Date().toISOString();
    const activityId = editingRecord ? editingRecord.id : crypto.randomUUID();

    const processedCostItems: CostItem[] = (data.costItems || []).map(ci => ({
      ...ci, id: ci.id || crypto.randomUUID(), category: ci.category, paymentSource: ci.paymentSource,
      quantity: Number(ci.quantity), unitPrice: Number(ci.unitPrice), total: (Number(ci.quantity) || 0) * (Number(ci.unitPrice) || 0),
    }));
    const totalHarvestCost = processedCostItems.reduce((sum, item) => sum + item.total, 0);

    const processedSaleItems: SaleItem[] = (data.salesDetails || []).map(si => ({
      ...si, id: si.id || crypto.randomUUID(), quantitySold: Number(si.quantitySold),
      pricePerUnit: Number(si.pricePerUnit), totalSaleAmount: (Number(si.quantitySold) || 0) * (Number(si.pricePerUnit) || 0),
    }));
    const totalSalesIncome = processedSaleItems.reduce((sum, item) => sum + item.totalSaleAmount, 0);

    const storedTransactions = localStorage.getItem(LOCAL_STORAGE_KEY_TRANSACTIONS);
    let allTransactions: OperationalTransaction[] = storedTransactions ? JSON.parse(storedTransactions) : [];
    allTransactions = allTransactions.filter(t => t.linkedActivityId !== activityId);
    
    const newTransactions: OperationalTransaction[] = [
        ...processedCostItems.map(item => ({
            id: crypto.randomUUID(), date: data.dateHarvested, description: item.description,
            amount: item.total, type: 'Expense' as const, category: item.category, paymentSource: item.paymentSource,
            linkedModule: 'Harvesting' as const, linkedActivityId: activityId, linkedItemId: item.id,
        })),
        ...processedSaleItems.map(item => ({
            id: crypto.randomUUID(), date: item.saleDate, description: `Sale of ${data.cropType} to ${item.buyer}`,
            amount: item.totalSaleAmount, type: 'Income' as const, category: 'Crop Sales' as any, paymentSource: 'Cash',
            linkedModule: 'Harvesting' as const, linkedActivityId: activityId, linkedItemId: item.id,
        }))
    ];
    allTransactions.push(...newTransactions);
    localStorage.setItem(LOCAL_STORAGE_KEY_TRANSACTIONS, JSON.stringify(allTransactions));

    if (editingRecord) {
      const updatedRecord = { ...editingRecord, ...data, costItems: processedCostItems, totalHarvestCost, salesDetails: processedSaleItems, totalSalesIncome, updatedAt: now };
      setRecords(records.map(rec => rec.id === activityId ? updatedRecord : rec));
      toast({ title: "Harvest Record Updated", description: `Record for ${data.cropType} has been updated.` });
    } else {
      const newRecord: HarvestingRecord = {
        ...data, id: activityId, variety: data.variety || undefined, qualityGrade: data.qualityGrade || undefined,
        postHarvestActivities: data.postHarvestActivities || undefined, storageLocation: data.storageLocation || undefined,
        notes: data.notes || undefined, costItems: processedCostItems, totalHarvestCost, salesDetails: processedSaleItems, totalSalesIncome,
        createdAt: now, updatedAt: now,
      };
      setRecords(prev => [...prev, newRecord]);
      toast({ title: "Harvest Record Logged", description: `Record for ${data.cropType} has been successfully logged.` });
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
    toast({ title: "Record Deleted", description: "The harvest record and its financial transactions have been removed.", variant: "destructive" });
  };
  
  if (!isMounted) return null;

  return (
    <div>
      <PageHeader
        title="Harvesting & Post-Harvest Management"
        icon={Wheat}
        description="Log harvest activities, yield data, sales, and associated costs."
        action={
           <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push('/farm-management')}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Farm Management
            </Button>
            <Button onClick={() => handleOpenModal()}>
              <PlusCircle className="mr-2 h-4 w-4" /> Log New Harvest Record
            </Button>
          </div>
        }
      />

      <Dialog open={isModalOpen} onOpenChange={(isOpen) => {
        setIsModalOpen(isOpen);
        if (!isOpen) { form.reset(); setEditingRecord(null); }
      }}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{editingRecord ? 'Edit Harvest Record' : 'Log New Harvest Record'}</DialogTitle>
            <DialogDescription>{editingRecord ? 'Update details for this harvest record.' : 'Enter details for the new harvest record.'}</DialogDescription>
          </DialogHeader>
          <div className="flex-grow overflow-y-auto pr-2 py-4">
            <Form {...form}>
              <form id={ACTIVITY_FORM_ID} onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <section className="space-y-4 p-4 border rounded-lg">
                  <h3 className="text-lg font-semibold text-primary">Harvest Details</h3>
                  <FormField control={form.control} name="cropType" render={({ field }) => (<FormItem><FormLabel>Crop Type*</FormLabel><FormControl><Input placeholder="e.g., Maize, Tomato" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="variety" render={({ field }) => (<FormItem><FormLabel>Variety (Optional)</FormLabel><FormControl><Input placeholder="e.g., Obaatanpa" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="dateHarvested" render={({ field }) => (<FormItem><FormLabel>Date Harvested*</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="areaHarvested" render={({ field }) => (<FormItem><FormLabel>Area Harvested*</FormLabel><FormControl><Input placeholder="e.g., North Field - 2 acres, All 5 acres" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="yieldQuantity" render={({ field }) => (<FormItem><FormLabel>Yield Quantity*</FormLabel><FormControl><Input type="number" step="0.01" placeholder="e.g., 1500" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="yieldUnit" render={({ field }) => (<FormItem><FormLabel>Yield Unit*</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select unit" /></SelectTrigger></FormControl><SelectContent>{yieldUnits.map(unit => <SelectItem key={unit} value={unit}>{unit}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                  </div>
                  <FormField control={form.control} name="qualityGrade" render={({ field }) => (<FormItem><FormLabel>Quality Grade (Optional)</FormLabel><FormControl><Input placeholder="e.g., Grade A, Premium" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="postHarvestActivities" render={({ field }) => (<FormItem><FormLabel>Post-Harvest Activities (Optional)</FormLabel><FormControl><Textarea placeholder="Describe activities like cleaning, sorting, packing, drying, etc." {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="storageLocation" render={({ field }) => (<FormItem><FormLabel>Storage Location (Optional)</FormLabel><FormControl><Input placeholder="e.g., Farm Silo #2, Warehouse B" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="notes" render={({ field }) => (<FormItem><FormLabel>General Notes (Optional)</FormLabel><FormControl><Textarea placeholder="Any additional observations or comments about the harvest" {...field} /></FormControl><FormMessage /></FormItem>)} />
                </section>
                <section className="space-y-4 p-4 border rounded-lg">
                  <div className="flex justify-between items-center"><h3 className="text-lg font-semibold text-primary">Cost Items</h3><Button type="button" size="sm" variant="outline" onClick={() => appendCost({ description: '', category: costCategories[0], paymentSource: paymentSources[0], unit: '', quantity: 1, unitPrice: 0 })}><PlusCircle className="mr-2 h-4 w-4" /> Add Cost Item</Button></div>
                  {costFields.map((field, index) => (<div key={field.id} className="p-3 border rounded-md space-y-3 bg-muted/20 relative">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <FormField control={form.control} name={`costItems.${index}.category`} render={({ field: f }) => (<FormItem><FormLabel>Category*</FormLabel><Select onValueChange={f.onChange} defaultValue={f.value}><FormControl><SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger></FormControl><SelectContent>{costCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                      <FormField control={form.control} name={`costItems.${index}.description`} render={({ field: f }) => (<FormItem><FormLabel>Description*</FormLabel><FormControl><Input placeholder="e.g., Labor for harvesting, Transport" {...f} /></FormControl><FormMessage /></FormItem>)} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
                      <FormField control={form.control} name={`costItems.${index}.paymentSource`} render={({ field: f }) => (<FormItem><FormLabel>Source*</FormLabel><Select onValueChange={f.onChange} defaultValue={f.value}><FormControl><SelectTrigger><SelectValue placeholder="Paid from..." /></SelectTrigger></FormControl><SelectContent>{paymentSources.map(src => <SelectItem key={src} value={src}>{src}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                      <FormField control={form.control} name={`costItems.${index}.unit`} render={({ field: f }) => (<FormItem><FormLabel>Unit*</FormLabel><FormControl><Input placeholder="e.g., Hours, Crates, Trip" {...f} /></FormControl><FormMessage /></FormItem>)} />
                      <FormField control={form.control} name={`costItems.${index}.quantity`} render={({ field: f }) => (<FormItem><FormLabel>Quantity*</FormLabel><FormControl><Input type="number" step="0.01" placeholder="0.00" {...f} onChange={e => {f.onChange(parseFloat(e.target.value)); form.setValue(`costItems.${index}.total`, parseFloat(e.target.value) * (form.getValues(`costItems.${index}.unitPrice`) || 0) ) }} /></FormControl><FormMessage /></FormItem>)} />
                      <FormField control={form.control} name={`costItems.${index}.unitPrice`} render={({ field: f }) => (<FormItem><FormLabel>Unit Price*</FormLabel><FormControl><Input type="number" step="0.01" placeholder="0.00" {...f} onChange={e => {f.onChange(parseFloat(e.target.value)); form.setValue(`costItems.${index}.total`, parseFloat(e.target.value) * (form.getValues(`costItems.${index}.quantity`) || 0) ) }} /></FormControl><FormMessage /></FormItem>)} />
                      <div><Label>Item Total</Label><Input value={((form.watch(`costItems.${index}.quantity`) || 0) * (form.watch(`costItems.${index}.unitPrice`) || 0)).toFixed(2)} readOnly disabled className="font-semibold bg-input" /></div>
                    </div>
                    <Button type="button" variant="ghost" size="icon" className="absolute top-1 right-1 text-destructive hover:bg-destructive/10" onClick={() => removeCost(index)}><Trash2 className="h-4 w-4" /><span className="sr-only">Remove Item</span></Button>
                  </div>))}
                  {costFields.length === 0 && <p className="text-sm text-muted-foreground text-center py-2">No cost items added yet.</p>}
                  <Separator className="my-4" />
                  <div className="flex justify-end items-center space-x-3"><Label className="text-md font-semibold">Total Harvest Cost:</Label><Input value={watchedCostItems.reduce((acc, item) => acc + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0), 0).toFixed(2)} readOnly disabled className="w-32 font-bold text-lg text-right bg-input" /></div>
                </section>
                <section className="space-y-4 p-4 border rounded-lg">
                  <div className="flex justify-between items-center"><h3 className="text-lg font-semibold text-primary">Sales Details</h3><Button type="button" size="sm" variant="outline" onClick={() => appendSale({ buyer: '', quantitySold: 1, unitOfSale: '', pricePerUnit: 0, saleDate: format(new Date(), 'yyyy-MM-dd') })}><DollarSign className="mr-2 h-4 w-4" /> Add Sale</Button></div>
                  {saleFields.map((field, index) => (<div key={field.id} className="p-3 border rounded-md space-y-3 bg-muted/20 relative">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <FormField control={form.control} name={`salesDetails.${index}.buyer`} render={({ field: f }) => (<FormItem><FormLabel>Buyer*</FormLabel><FormControl><Input placeholder="e.g., Market Trader A" {...f} /></FormControl><FormMessage /></FormItem>)} />
                      <FormField control={form.control} name={`salesDetails.${index}.saleDate`} render={({ field: f }) => (<FormItem><FormLabel>Sale Date*</FormLabel><FormControl><Input type="date" {...f} /></FormControl><FormMessage /></FormItem>)} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
                      <FormField control={form.control} name={`salesDetails.${index}.quantitySold`} render={({ field: f }) => (<FormItem><FormLabel>Quantity Sold*</FormLabel><FormControl><Input type="number" step="0.01" placeholder="0.00" {...f} /></FormControl><FormMessage /></FormItem>)} />
                      <FormField control={form.control} name={`salesDetails.${index}.unitOfSale`} render={({ field: f }) => (<FormItem><FormLabel>Unit of Sale*</FormLabel><FormControl><Input placeholder="e.g., kg, crate, bag" {...f} /></FormControl><FormMessage /></FormItem>)} />
                      <FormField control={form.control} name={`salesDetails.${index}.pricePerUnit`} render={({ field: f }) => (<FormItem><FormLabel>Price Per Unit*</FormLabel><FormControl><Input type="number" step="0.01" placeholder="0.00" {...f} /></FormControl><FormMessage /></FormItem>)} />
                      <div><Label>Sale Total</Label><Input value={((form.watch(`salesDetails.${index}.quantitySold`) || 0) * (form.watch(`salesDetails.${index}.pricePerUnit`) || 0)).toFixed(2)} readOnly disabled className="font-semibold bg-input" /></div>
                    </div>
                    <Button type="button" variant="ghost" size="icon" className="absolute top-1 right-1 text-destructive hover:bg-destructive/10" onClick={() => removeSale(index)}><Trash2 className="h-4 w-4" /><span className="sr-only">Remove Sale Item</span></Button>
                  </div>))}
                  {saleFields.length === 0 && <p className="text-sm text-muted-foreground text-center py-2">No sales details added yet for this harvest.</p>}
                  <Separator className="my-4" />
                  <div className="flex justify-end items-center space-x-3"><Label className="text-md font-semibold">Total Sales Income (This Harvest):</Label><Input value={watchedSaleItems.reduce((acc, item) => acc + (Number(item.quantitySold) || 0) * (Number(item.pricePerUnit) || 0), 0).toFixed(2)} readOnly disabled className="w-36 font-bold text-lg text-right bg-input" /></div>
                </section>
              </form>
            </Form>
          </div>
          <DialogFooter className="py-4 px-6 border-t"><DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose><Button type="submit" form={ACTIVITY_FORM_ID}>{editingRecord ? 'Save Changes' : 'Log Record'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <Card className="shadow-lg">
        <CardHeader><CardTitle>Logged Harvest Records</CardTitle><CardDescription>View all recorded harvest activities, yields, sales and their total costs/income. Edit or delete as needed.</CardDescription></CardHeader>
        <CardContent>
          {records.length > 0 ? (
            <Table>
              <TableHeader><TableRow><TableHead>Crop Type</TableHead><TableHead>Date</TableHead><TableHead>Yield</TableHead><TableHead className="text-right">Total Cost</TableHead><TableHead className="text-right">Total Income</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {records.sort((a,b) => parseISO(b.dateHarvested).getTime() - parseISO(a.dateHarvested).getTime()).map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">{record.cropType} {record.variety && `(${record.variety})`}</TableCell>
                    <TableCell>{isValid(parseISO(record.dateHarvested)) ? format(parseISO(record.dateHarvested), 'PP') : 'Invalid Date'}</TableCell>
                    <TableCell>{record.yieldQuantity} {record.yieldUnit}</TableCell>
                    <TableCell className="text-right font-semibold">{record.totalHarvestCost.toFixed(2)}</TableCell>
                    <TableCell className="text-right font-semibold text-green-600">{record.totalSalesIncome.toFixed(2)}</TableCell>
                    <TableCell className="text-right space-x-2"><Button variant="outline" size="icon" onClick={() => handleOpenModal(record)} className="h-8 w-8"><Edit2 className="h-4 w-4" /><span className="sr-only">Edit</span></Button><Button variant="destructive" size="icon" onClick={() => handleDeleteRecord(record.id)} className="h-8 w-8"><Trash2 className="h-4 w-4" /><span className="sr-only">Delete</span></Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (<div className="text-center py-10"><Wheat className="mx-auto h-12 w-12 text-muted-foreground" /><p className="mt-4 text-muted-foreground">No harvest records logged yet.</p><p className="text-sm text-muted-foreground">Click "Log New Harvest Record" to get started.</p></div>)}
        </CardContent>
      </Card>
      <Card className="mt-6 bg-muted/30 p-4">
        <CardHeader className="p-0 pb-2"><CardTitle className="text-base font-semibold text-muted-foreground">About Harvesting & Sales Costing</CardTitle></CardHeader>
        <CardContent className="p-0 text-xs text-muted-foreground space-y-1">
            <p>&bull; This section helps track yield data, sales income, and costs associated with harvesting and initial post-harvest activities.</p>
            <p>&bull; Log details for each crop harvested, including yield quantity, units, quality, and where it's stored.</p>
            <p>&bull; Itemize costs by category for labor, equipment, transportation, packaging, etc.</p>
            <p>&bull; Add details for each sale made from this harvest, including buyer, quantity, price, and date.</p>
            <p>&bull; This data is vital for assessing crop profitability and managing post-harvest logistics.</p>
        </CardContent>
      </Card>
    </div>
  );
}
