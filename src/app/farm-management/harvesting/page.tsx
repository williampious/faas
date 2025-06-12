
'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@/components/layout/page-header';
import { Wheat, PlusCircle, Trash2, Edit2 } from 'lucide-react';
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

const yieldUnits = ['kg', 'bags (50kg)', 'bags (100kg)', 'crates', 'tons', 'bunches', 'pieces'] as const;
type YieldUnit = typeof yieldUnits[number];

const costCategories = ['Material/Input', 'Labor', 'Equipment Rental', 'Services', 'Utilities', 'Other'] as const;
type CostCategory = typeof costCategories[number];

const costItemSchema = z.object({
  id: z.string().optional(),
  description: z.string().min(1, "Description is required.").max(100),
  category: z.enum(costCategories, { required_error: "Category is required."}),
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

interface HarvestingRecord {
  id: string;
  cropType: string;
  variety?: string;
  dateHarvested: string; // ISO string "yyyy-MM-dd"
  areaHarvested: string;
  yieldQuantity: number;
  yieldUnit: YieldUnit;
  qualityGrade?: string;
  postHarvestActivities?: string;
  storageLocation?: string;
  notes?: string;
  costItems: CostItem[];
  totalHarvestCost: number;
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
});

type HarvestRecordFormValues = z.infer<typeof harvestRecordFormSchema>;

const LOCAL_STORAGE_KEY = 'harvestingRecords_v2'; // Version bump due to cost category
const ACTIVITY_FORM_ID = 'harvesting-record-form';

export default function HarvestingPage() {
  const [records, setRecords] = useState<HarvestingRecord[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<HarvestingRecord | null>(null);
  const { toast } = useToast();
  const [isMounted, setIsMounted] = useState(false);

  const form = useForm<HarvestRecordFormValues>({
    resolver: zodResolver(harvestRecordFormSchema),
    defaultValues: {
      cropType: '',
      variety: '',
      dateHarvested: '',
      areaHarvested: '',
      yieldQuantity: undefined,
      yieldUnit: undefined,
      qualityGrade: '',
      postHarvestActivities: '',
      storageLocation: '',
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
    const storedRecords = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (storedRecords) {
      setRecords(JSON.parse(storedRecords));
    }
  }, []);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(records));
    }
  }, [records, isMounted]);

  const handleOpenModal = (recordToEdit?: HarvestingRecord) => {
    if (recordToEdit) {
      setEditingRecord(recordToEdit);
      form.reset({
        ...recordToEdit,
        notes: recordToEdit.notes || '',
        variety: recordToEdit.variety || '',
        qualityGrade: recordToEdit.qualityGrade || '',
        postHarvestActivities: recordToEdit.postHarvestActivities || '',
        storageLocation: recordToEdit.storageLocation || '',
        costItems: recordToEdit.costItems.map(ci => ({...ci, id: ci.id || crypto.randomUUID(), category: ci.category || costCategories[0] })) || [],
      });
    } else {
      setEditingRecord(null);
      form.reset({
        cropType: '',
        variety: '',
        dateHarvested: '',
        areaHarvested: '',
        yieldQuantity: undefined,
        yieldUnit: undefined,
        qualityGrade: '',
        postHarvestActivities: '',
        storageLocation: '',
        notes: '',
        costItems: [],
      });
    }
    setIsModalOpen(true);
  };

  const onSubmit: SubmitHandler<HarvestRecordFormValues> = (data) => {
    const processedCostItems: CostItem[] = (data.costItems || []).map(ci => ({
      ...ci,
      id: ci.id || crypto.randomUUID(),
      category: ci.category || costCategories[0],
      quantity: Number(ci.quantity),
      unitPrice: Number(ci.unitPrice),
      total: (Number(ci.quantity) || 0) * (Number(ci.unitPrice) || 0),
    }));

    const totalHarvestCost = processedCostItems.reduce((sum, item) => sum + item.total, 0);

    if (editingRecord) {
      setRecords(
        records.map((rec) =>
          rec.id === editingRecord.id ? { ...editingRecord, ...data, costItems: processedCostItems, totalHarvestCost } : rec
        )
      );
      toast({ title: "Harvest Record Updated", description: `Record for ${data.cropType} has been updated.` });
    } else {
      const newRecord: HarvestingRecord = {
        id: crypto.randomUUID(),
        ...data,
        variety: data.variety || undefined,
        qualityGrade: data.qualityGrade || undefined,
        postHarvestActivities: data.postHarvestActivities || undefined,
        storageLocation: data.storageLocation || undefined,
        notes: data.notes || undefined,
        costItems: processedCostItems,
        totalHarvestCost,
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
    toast({ title: "Record Deleted", description: "The harvest record has been removed.", variant: "destructive" });
  };
  
  if (!isMounted) {
    return null; 
  }

  return (
    <div>
      <PageHeader
        title="Harvesting & Post-Harvest Management"
        icon={Wheat}
        description="Log harvest activities, yield data, and associated costs."
        action={
          <Button onClick={() => handleOpenModal()}>
            <PlusCircle className="mr-2 h-4 w-4" /> Log New Harvest Record
          </Button>
        }
      />

      <Dialog open={isModalOpen} onOpenChange={(isOpen) => {
        setIsModalOpen(isOpen);
        if (!isOpen) {
          form.reset();
          setEditingRecord(null);
        }
      }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{editingRecord ? 'Edit Harvest Record' : 'Log New Harvest Record'}</DialogTitle>
            <DialogDescription>
              {editingRecord ? 'Update details for this harvest record.' : 'Enter details for the new harvest record.'}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-grow overflow-y-auto pr-2 py-4"> {/* Scrollable content area */}
            <Form {...form}>
              <form id={ACTIVITY_FORM_ID} onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <section className="space-y-4 p-4 border rounded-lg">
                  <h3 className="text-lg font-semibold text-primary">Harvest Details</h3>
                  <FormField control={form.control} name="cropType" render={({ field }) => (
                    <FormItem><FormLabel>Crop Type*</FormLabel><FormControl><Input placeholder="e.g., Maize, Tomato" {...field} /></FormControl><FormMessage /></FormItem>)}
                  />
                  <FormField control={form.control} name="variety" render={({ field }) => (
                    <FormItem><FormLabel>Variety (Optional)</FormLabel><FormControl><Input placeholder="e.g., Obaatanpa" {...field} /></FormControl><FormMessage /></FormItem>)}
                  />
                  <FormField control={form.control} name="dateHarvested" render={({ field }) => (
                    <FormItem><FormLabel>Date Harvested*</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)}
                  />
                  <FormField control={form.control} name="areaHarvested" render={({ field }) => (
                    <FormItem><FormLabel>Area Harvested*</FormLabel><FormControl><Input placeholder="e.g., North Field - 2 acres, All 5 acres" {...field} /></FormControl><FormMessage /></FormItem>)}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="yieldQuantity" render={({ field }) => (
                      <FormItem><FormLabel>Yield Quantity*</FormLabel><FormControl><Input type="number" step="0.01" placeholder="e.g., 1500" {...field} /></FormControl><FormMessage /></FormItem>)}
                    />
                    <FormField control={form.control} name="yieldUnit" render={({ field }) => (
                      <FormItem><FormLabel>Yield Unit*</FormLabel>
                        <Input list="yieldUnitsDatalist" placeholder="e.g., kg, bags" {...field} />
                        <datalist id="yieldUnitsDatalist">
                            {yieldUnits.map(unit => <option key={unit} value={unit} />)}
                        </datalist>
                        <FormMessage />
                      </FormItem>)}
                    />
                  </div>
                  <FormField control={form.control} name="qualityGrade" render={({ field }) => (
                    <FormItem><FormLabel>Quality Grade (Optional)</FormLabel><FormControl><Input placeholder="e.g., Grade A, Premium" {...field} /></FormControl><FormMessage /></FormItem>)}
                  />
                  <FormField control={form.control} name="postHarvestActivities" render={({ field }) => (
                    <FormItem><FormLabel>Post-Harvest Activities (Optional)</FormLabel><FormControl><Textarea placeholder="Describe activities like cleaning, sorting, packing, drying, etc." {...field} /></FormControl><FormMessage /></FormItem>)}
                  />
                  <FormField control={form.control} name="storageLocation" render={({ field }) => (
                    <FormItem><FormLabel>Storage Location (Optional)</FormLabel><FormControl><Input placeholder="e.g., Farm Silo #2, Warehouse B" {...field} /></FormControl><FormMessage /></FormItem>)}
                  />
                  <FormField control={form.control} name="notes" render={({ field }) => (
                    <FormItem><FormLabel>General Notes (Optional)</FormLabel><FormControl><Textarea placeholder="Any additional observations or comments about the harvest" {...field} /></FormControl><FormMessage /></FormItem>)}
                  />
                </section>

                <section className="space-y-4 p-4 border rounded-lg">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-primary">Cost Items</h3>
                    <Button type="button" size="sm" variant="outline" onClick={() => append({ description: '', category: costCategories[0], unit: '', quantity: 1, unitPrice: 0 })}>
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
                            <FormItem><FormLabel>Description*</FormLabel><FormControl><Input placeholder="e.g., Labor for harvesting, Transport" {...f} /></FormControl><FormMessage /></FormItem>)}
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
                          <FormField control={form.control} name={`costItems.${index}.unit`} render={({ field: f }) => (
                            <FormItem><FormLabel>Unit*</FormLabel><FormControl><Input placeholder="e.g., Hours, Crates, Trip" {...f} /></FormControl><FormMessage /></FormItem>)}
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
                      <Label className="text-md font-semibold">Total Harvest Cost:</Label>
                      <Input
                        value={calculateTotalCost(watchedCostItems).toFixed(2)}
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
              {editingRecord ? 'Save Changes' : 'Log Record'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Logged Harvest Records</CardTitle>
          <CardDescription>
            View all recorded harvest activities, yields, and their total costs. Edit or delete as needed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {records.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Crop Type</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Yield</TableHead>
                  <TableHead>Area Harvested</TableHead>
                  <TableHead className="text-right">Total Cost</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.sort((a,b) => parseISO(b.dateHarvested).getTime() - parseISO(a.dateHarvested).getTime()).map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">{record.cropType} {record.variety && `(${record.variety})`}</TableCell>
                    <TableCell>{isValid(parseISO(record.dateHarvested)) ? format(parseISO(record.dateHarvested), 'PP') : 'Invalid Date'}</TableCell>
                    <TableCell>{record.yieldQuantity} {record.yieldUnit}</TableCell>
                    <TableCell>{record.areaHarvested}</TableCell>
                    <TableCell className="text-right font-semibold">
                      {record.totalHarvestCost.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="icon" onClick={() => handleOpenModal(record)} className="h-8 w-8">
                        <Edit2 className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button variant="destructive" size="icon" onClick={() => handleDeleteRecord(record.id)} className="h-8 w-8">
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
                <Wheat className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-4 text-muted-foreground">No harvest records logged yet.</p>
                <p className="text-sm text-muted-foreground">Click "Log New Harvest Record" to get started.</p>
            </div>
          )}
        </CardContent>
      </Card>
      <Card className="mt-6 bg-muted/30 p-4">
        <CardHeader className="p-0 pb-2">
            <CardTitle className="text-base font-semibold text-muted-foreground">About Harvesting Costing</CardTitle>
        </CardHeader>
        <CardContent className="p-0 text-xs text-muted-foreground space-y-1">
            <p>&bull; This section helps track yield data and costs associated with harvesting and initial post-harvest activities.</p>
            <p>&bull; Log details for each crop harvested, including yield quantity, units, quality, and where it's stored.</p>
            <p>&bull; Itemize costs by category for labor, equipment, transportation, packaging, etc.</p>
            <p>&bull; This data is vital for assessing crop profitability and managing post-harvest logistics.</p>
        </CardContent>
      </Card>
    </div>
  );
}
    


    