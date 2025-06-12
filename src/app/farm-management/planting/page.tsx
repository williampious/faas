
'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@/components/layout/page-header';
import { Sprout, PlusCircle, Trash2, Edit2 } from 'lucide-react'; // Changed Seedling to Sprout
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

const plantingMethods = ['Direct Sowing', 'Transplanting', 'Broadcasting', 'Drilling'] as const;
type PlantingMethod = typeof plantingMethods[number];

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

interface PlantingRecord {
  id: string;
  cropType: string;
  variety?: string;
  datePlanted: string; // ISO string "yyyy-MM-dd"
  areaPlanted: string;
  seedSource?: string;
  plantingMethod: PlantingMethod;
  notes?: string;
  costItems: CostItem[];
  totalPlantingCost: number;
}

const plantingRecordFormSchema = z.object({
  cropType: z.string().min(1, { message: "Crop type is required." }).max(100),
  variety: z.string().max(100).optional(),
  datePlanted: z.string().refine((val) => !!val && isValid(parseISO(val)), { message: "Valid date is required." }),
  areaPlanted: z.string().min(1, { message: "Area planted is required." }).max(100),
  seedSource: z.string().max(100).optional(),
  plantingMethod: z.enum(plantingMethods, { required_error: "Planting method is required." }),
  notes: z.string().max(500).optional(),
  costItems: z.array(costItemSchema).optional(),
});

type PlantingRecordFormValues = z.infer<typeof plantingRecordFormSchema>;

const LOCAL_STORAGE_KEY = 'plantingRecords_v1';

export default function PlantingPage() {
  const [records, setRecords] = useState<PlantingRecord[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<PlantingRecord | null>(null);
  const { toast } = useToast();
  const [isMounted, setIsMounted] = useState(false);

  const form = useForm<PlantingRecordFormValues>({
    resolver: zodResolver(plantingRecordFormSchema),
    defaultValues: {
      cropType: '',
      variety: '',
      datePlanted: '',
      areaPlanted: '',
      seedSource: '',
      plantingMethod: undefined,
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

  const handleOpenModal = (recordToEdit?: PlantingRecord) => {
    if (recordToEdit) {
      setEditingRecord(recordToEdit);
      form.reset({
        ...recordToEdit,
        notes: recordToEdit.notes || '',
        variety: recordToEdit.variety || '',
        seedSource: recordToEdit.seedSource || '',
        costItems: recordToEdit.costItems.map(ci => ({...ci, id: ci.id || crypto.randomUUID() })) || [],
      });
    } else {
      setEditingRecord(null);
      form.reset();
    }
    setIsModalOpen(true);
  };

  const onSubmit: SubmitHandler<PlantingRecordFormValues> = (data) => {
    const processedCostItems: CostItem[] = (data.costItems || []).map(ci => ({
      ...ci,
      id: ci.id || crypto.randomUUID(),
      quantity: Number(ci.quantity),
      unitPrice: Number(ci.unitPrice),
      total: (Number(ci.quantity) || 0) * (Number(ci.unitPrice) || 0),
    }));

    const totalPlantingCost = processedCostItems.reduce((sum, item) => sum + item.total, 0);

    if (editingRecord) {
      setRecords(
        records.map((rec) =>
          rec.id === editingRecord.id ? { ...editingRecord, ...data, costItems: processedCostItems, totalPlantingCost } : rec
        )
      );
      toast({ title: "Planting Record Updated", description: `Record for ${data.cropType} has been updated.` });
    } else {
      const newRecord: PlantingRecord = {
        id: crypto.randomUUID(),
        ...data,
        variety: data.variety || undefined,
        seedSource: data.seedSource || undefined,
        notes: data.notes || undefined,
        costItems: processedCostItems,
        totalPlantingCost,
      };
      setRecords(prev => [...prev, newRecord]);
      toast({ title: "Planting Record Logged", description: `Record for ${data.cropType} has been successfully logged.` });
    }
    setIsModalOpen(false);
    setEditingRecord(null);
    form.reset();
  };

  const handleDeleteRecord = (id: string) => {
    setRecords(records.filter((rec) => rec.id !== id));
    toast({ title: "Record Deleted", description: "The planting record has been removed.", variant: "destructive" });
  };
  
  if (!isMounted) {
    return null; 
  }

  return (
    <div>
      <PageHeader
        title="Planting Management"
        icon={Sprout}
        description="Log, track, and manage all planting activities and associated costs."
        action={
          <Button onClick={() => handleOpenModal()}>
            <PlusCircle className="mr-2 h-4 w-4" /> Log New Planting Record
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
            <DialogTitle>{editingRecord ? 'Edit Planting Record' : 'Log New Planting Record'}</DialogTitle>
            <DialogDescription>
              {editingRecord ? 'Update details and costs for this planting record.' : 'Enter details and costs for the new planting record.'}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-grow overflow-y-auto pr-2">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <section className="space-y-4 p-4 border rounded-lg">
                  <h3 className="text-lg font-semibold text-primary">Planting Details</h3>
                  <FormField control={form.control} name="cropType" render={({ field }) => (
                    <FormItem><FormLabel>Crop Type*</FormLabel><FormControl><Input placeholder="e.g., Maize, Tomato" {...field} /></FormControl><FormMessage /></FormItem>)}
                  />
                  <FormField control={form.control} name="variety" render={({ field }) => (
                    <FormItem><FormLabel>Variety (Optional)</FormLabel><FormControl><Input placeholder="e.g., Obaatanpa, Pectomech" {...field} /></FormControl><FormMessage /></FormItem>)}
                  />
                  <FormField control={form.control} name="datePlanted" render={({ field }) => (
                    <FormItem><FormLabel>Date Planted*</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)}
                  />
                  <FormField control={form.control} name="areaPlanted" render={({ field }) => (
                    <FormItem><FormLabel>Area Planted*</FormLabel><FormControl><Input placeholder="e.g., North Field - 2 acres" {...field} /></FormControl><FormMessage /></FormItem>)}
                  />
                   <FormField control={form.control} name="plantingMethod" render={({ field }) => (
                    <FormItem><FormLabel>Planting Method*</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select method" /></SelectTrigger></FormControl>
                        <SelectContent>{plantingMethods.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent>
                      </Select><FormMessage />
                    </FormItem>)}
                  />
                  <FormField control={form.control} name="seedSource" render={({ field }) => (
                    <FormItem><FormLabel>Seed Source (Optional)</FormLabel><FormControl><Input placeholder="e.g., MOFA, Local Market, Own Saved" {...field} /></FormControl><FormMessage /></FormItem>)}
                  />
                  <FormField control={form.control} name="notes" render={({ field }) => (
                    <FormItem><FormLabel>Notes (Optional)</FormLabel><FormControl><Textarea placeholder="Any additional details about planting conditions, spacing etc." {...field} /></FormControl><FormMessage /></FormItem>)}
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
                            <FormItem><FormLabel>Description*</FormLabel><FormControl><Input placeholder="e.g., Maize Seed (Obaatanpa)" {...f} /></FormControl><FormMessage /></FormItem>)}
                          />
                          <FormField control={form.control} name={`costItems.${index}.unit`} render={({ field: f }) => (
                            <FormItem><FormLabel>Unit*</FormLabel><FormControl><Input placeholder="e.g., kg, bag, hour" {...f} /></FormControl><FormMessage /></FormItem>)}
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
                      <Label className="text-md font-semibold">Total Planting Cost:</Label>
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
                    {editingRecord ? 'Save Changes' : 'Log Record'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </div>
        </DialogContent>
      </Dialog>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Logged Planting Records</CardTitle>
          <CardDescription>
            View all recorded planting activities and their total costs. Edit or delete as needed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {records.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Crop Type</TableHead>
                  <TableHead>Variety</TableHead>
                  <TableHead>Date Planted</TableHead>
                  <TableHead>Area Planted</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead className="text-right">Total Cost</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.sort((a,b) => parseISO(b.datePlanted).getTime() - parseISO(a.datePlanted).getTime()).map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">{record.cropType}</TableCell>
                    <TableCell>{record.variety || 'N/A'}</TableCell>
                    <TableCell>{isValid(parseISO(record.datePlanted)) ? format(parseISO(record.datePlanted), 'MMMM d, yyyy') : 'Invalid Date'}</TableCell>
                    <TableCell>{record.areaPlanted}</TableCell>
                    <TableCell>{record.plantingMethod}</TableCell>
                    <TableCell className="text-right font-semibold">
                      {record.totalPlantingCost.toFixed(2)}
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
                <Sprout className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-4 text-muted-foreground">No planting records logged yet.</p>
                <p className="text-sm text-muted-foreground">Click "Log New Planting Record" to get started.</p>
            </div>
          )}
        </CardContent>
      </Card>
      <Card className="mt-6 bg-muted/30 p-4">
        <CardHeader className="p-0 pb-2">
            <CardTitle className="text-base font-semibold text-muted-foreground">About Planting Costing</CardTitle>
        </CardHeader>
        <CardContent className="p-0 text-xs text-muted-foreground space-y-1">
            <p>&bull; This section helps track details and costs associated with planting activities.</p>
            <p>&bull; Log records for each crop, variety, area, and method. Itemize costs for seeds, labor, machinery, etc.</p>
            <p>&bull; The total cost for each planting record is automatically calculated.</p>
            <p>&bull; This data is crucial for understanding per-crop expenditure and overall farm financial health.</p>
        </CardContent>
      </Card>
    </div>
  );
}
    