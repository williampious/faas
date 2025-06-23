
'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@/components/layout/page-header';
import { Home as HomeIcon, PlusCircle, Trash2, Edit2, ArrowLeft } from 'lucide-react';
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
import type { HousingRecord, CostItem } from '@/types/livestock'; // Adjusted import
import { housingTypes } from '@/types/livestock'; // Adjusted import
import { costCategories, paymentSources } from '@/types/finance';

// CostItem schema, can be shared or defined here
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


const housingRecordFormSchema = z.object({
  name: z.string().min(1, "Housing unit name is required").max(100),
  housingType: z.enum(housingTypes, { required_error: "Housing type is required." }),
  capacity: z.preprocess(val => parseInt(String(val), 10), z.number().min(1, "Capacity must be at least 1.")),
  capacityUnit: z.string().min(1, "Capacity unit is required (e.g., birds, head)").max(50),
  dateEstablished: z.string().refine((val) => !!val && isValid(parseISO(val)), { message: "Valid date is required." }),
  ventilationDetails: z.string().max(500).optional(),
  lightingDetails: z.string().max(500).optional(),
  shelterDetails: z.string().max(500).optional(),
  biosecurityMeasures: z.string().max(500).optional(),
  predatorProtection: z.string().max(500).optional(),
  notes: z.string().max(1000).optional(),
  costItems: z.array(costItemSchema).optional(),
});

type HousingRecordFormValues = z.infer<typeof housingRecordFormSchema>;

const LOCAL_STORAGE_KEY = 'animalHousingRecords_v1';
const ACTIVITY_FORM_ID = 'housing-record-form';

export default function HousingInfrastructurePage() {
  const [records, setRecords] = useState<HousingRecord[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<HousingRecord | null>(null);
  const { toast } = useToast();
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();

  const form = useForm<HousingRecordFormValues>({
    resolver: zodResolver(housingRecordFormSchema),
    defaultValues: {
      name: '',
      housingType: undefined,
      capacity: 0,
      capacityUnit: 'birds',
      dateEstablished: '',
      ventilationDetails: '',
      lightingDetails: '',
      shelterDetails: '',
      biosecurityMeasures: '',
      predatorProtection: '',
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

  const handleOpenModal = (recordToEdit?: HousingRecord) => {
    if (recordToEdit) {
      setEditingRecord(recordToEdit);
      form.reset({
        ...recordToEdit,
        // Ensure optional fields are reset properly if they were undefined
        ventilationDetails: recordToEdit.ventilationDetails || '',
        lightingDetails: recordToEdit.lightingDetails || '',
        shelterDetails: recordToEdit.shelterDetails || '',
        biosecurityMeasures: recordToEdit.biosecurityMeasures || '',
        predatorProtection: recordToEdit.predatorProtection || '',
        notes: recordToEdit.notes || '',
        costItems: recordToEdit.costItems.map(ci => ({...ci, id: ci.id || crypto.randomUUID(), category: ci.category || costCategories[0] })) || [],
      });
    } else {
      setEditingRecord(null);
      form.reset({
        name: '',
        housingType: undefined,
        capacity: 0,
        capacityUnit: 'birds',
        dateEstablished: '',
        ventilationDetails: '',
        lightingDetails: '',
        shelterDetails: '',
        biosecurityMeasures: '',
        predatorProtection: '',
        notes: '',
        costItems: [],
      });
    }
    setIsModalOpen(true);
  };

  const onSubmit: SubmitHandler<HousingRecordFormValues> = (data) => {
    const now = new Date().toISOString();
    const processedCostItems: CostItem[] = (data.costItems || []).map(ci => ({
      ...ci,
      id: ci.id || crypto.randomUUID(),
      category: ci.category || costCategories[0],
      paymentSource: ci.paymentSource,
      quantity: Number(ci.quantity),
      unitPrice: Number(ci.unitPrice),
      total: (Number(ci.quantity) || 0) * (Number(ci.unitPrice) || 0),
    }));

    const totalHousingCost = processedCostItems.reduce((sum, item) => sum + item.total, 0);

    if (editingRecord) {
      setRecords(
        records.map((rec) =>
          rec.id === editingRecord.id ? { ...editingRecord, ...data, costItems: processedCostItems, totalHousingCost, updatedAt: now } : rec
        )
      );
      toast({ title: "Housing Record Updated", description: `Record for ${data.name} has been updated.` });
    } else {
      const newRecord: HousingRecord = {
        id: crypto.randomUUID(),
        ...data,
        // Ensure optional text fields become undefined if empty, not empty string
        ventilationDetails: data.ventilationDetails || undefined,
        lightingDetails: data.lightingDetails || undefined,
        shelterDetails: data.shelterDetails || undefined,
        biosecurityMeasures: data.biosecurityMeasures || undefined,
        predatorProtection: data.predatorProtection || undefined,
        notes: data.notes || undefined,
        costItems: processedCostItems,
        totalHousingCost,
        createdAt: now,
        updatedAt: now,
      };
      setRecords(prev => [...prev, newRecord]);
      toast({ title: "Housing Record Logged", description: `Record for ${data.name} has been successfully logged.` });
    }
    setIsModalOpen(false);
    setEditingRecord(null);
    form.reset();
  };

  const handleDeleteRecord = (id: string) => {
    const recordToDelete = records.find(r => r.id === id);
    setRecords(records.filter((rec) => rec.id !== id));
    toast({ title: "Record Deleted", description: `Housing record "${recordToDelete?.name}" has been removed.`, variant: "destructive" });
  };
  
  if (!isMounted) {
    return (
       <div className="flex justify-center items-center min-h-[calc(100vh-12rem)]">
        <HomeIcon className="h-12 w-12 text-primary animate-pulse" />
        <p className="ml-3 text-lg text-muted-foreground">Loading housing data...</p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Housing & Infrastructure Management"
        icon={HomeIcon}
        description="Log and manage housing units, infrastructure details, and associated costs."
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push('/animal-production')}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Animal Production
            </Button>
            <Button onClick={() => handleOpenModal()}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Housing Record
            </Button>
          </div>
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
            <DialogTitle>{editingRecord ? 'Edit Housing Record' : 'Log New Housing Record'}</DialogTitle>
            <DialogDescription>
              {editingRecord ? 'Update details for this housing unit.' : 'Enter details for the new housing unit and its costs.'}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-grow overflow-y-auto pr-2 py-4">
            <Form {...form}>
              <form id={ACTIVITY_FORM_ID} onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Housing Details Section */}
                <section className="space-y-4 p-4 border rounded-lg">
                  <h3 className="text-lg font-semibold text-primary">Housing Unit Details</h3>
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem><FormLabel>Name/Identifier*</FormLabel><FormControl><Input placeholder="e.g., Broiler House 1, Pen Alpha" {...field} /></FormControl><FormMessage /></FormItem>)}
                  />
                  <FormField control={form.control} name="housingType" render={({ field }) => (
                    <FormItem><FormLabel>Housing Type*</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select housing type" /></SelectTrigger></FormControl>
                        <SelectContent>{housingTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent>
                      </Select><FormMessage />
                    </FormItem>)}
                  />
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="capacity" render={({ field }) => (
                        <FormItem><FormLabel>Capacity*</FormLabel><FormControl><Input type="number" placeholder="e.g., 500" {...field} /></FormControl><FormMessage /></FormItem>)}
                    />
                    <FormField control={form.control} name="capacityUnit" render={({ field }) => (
                        <FormItem><FormLabel>Capacity Unit*</FormLabel><FormControl><Input placeholder="e.g., birds, head, units" {...field} /></FormControl><FormMessage /></FormItem>)}
                    />
                  </div>
                  <FormField control={form.control} name="dateEstablished" render={({ field }) => (
                    <FormItem><FormLabel>Date Established/Updated*</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)}
                  />
                  <FormField control={form.control} name="ventilationDetails" render={({ field }) => (
                    <FormItem><FormLabel>Ventilation Details (Optional)</FormLabel><FormControl><Textarea placeholder="Describe ventilation system (e.g., Natural, Fans, Curtain-sided)" {...field} /></FormControl><FormMessage /></FormItem>)}
                  />
                  <FormField control={form.control} name="lightingDetails" render={({ field }) => (
                    <FormItem><FormLabel>Lighting Details (Optional)</FormLabel><FormControl><Textarea placeholder="Describe lighting system (e.g., LED bulbs, natural light hours)" {...field} /></FormControl><FormMessage /></FormItem>)}
                  />
                   <FormField control={form.control} name="shelterDetails" render={({ field }) => (
                    <FormItem><FormLabel>Shelter Details (Optional)</FormLabel><FormControl><Textarea placeholder="Flooring, roofing, materials used, etc." {...field} /></FormControl><FormMessage /></FormItem>)}
                  />
                  <FormField control={form.control} name="biosecurityMeasures" render={({ field }) => (
                    <FormItem><FormLabel>Biosecurity Measures (Optional)</FormLabel><FormControl><Textarea placeholder="Footbaths, disinfection protocols, access control, etc." {...field} /></FormControl><FormMessage /></FormItem>)}
                  />
                  <FormField control={form.control} name="predatorProtection" render={({ field }) => (
                    <FormItem><FormLabel>Predator Protection (Optional)</FormLabel><FormControl><Textarea placeholder="Fencing, netting, guard animals, etc." {...field} /></FormControl><FormMessage /></FormItem>)}
                  />
                  <FormField control={form.control} name="notes" render={({ field }) => (
                    <FormItem><FormLabel>General Notes (Optional)</FormLabel><FormControl><Textarea placeholder="Any additional observations or comments" {...field} /></FormControl><FormMessage /></FormItem>)}
                  />
                </section>

                {/* Cost Items Section */}
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
                            <FormItem><FormLabel>Description*</FormLabel><FormControl><Input placeholder="e.g., Cement, Roofing Sheets, Labor for construction" {...f} /></FormControl><FormMessage /></FormItem>)}
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
                           <FormField control={form.control} name={`costItems.${index}.paymentSource`} render={({ field: f }) => (<FormItem><FormLabel>Source*</FormLabel><Select onValueChange={f.onChange} defaultValue={f.value}><FormControl><SelectTrigger><SelectValue placeholder="Paid from..." /></SelectTrigger></FormControl><SelectContent>{paymentSources.map(src => <SelectItem key={src} value={src}>{src}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                          <FormField control={form.control} name={`costItems.${index}.unit`} render={({ field: f }) => (
                            <FormItem><FormLabel>Unit*</FormLabel><FormControl><Input placeholder="e.g., Bag, Piece, Hour" {...f} /></FormControl><FormMessage /></FormItem>)}
                          />
                           <FormField control={form.control} name={`costItems.${index}.quantity`} render={({ field: f }) => (
                            <FormItem><FormLabel>Quantity*</FormLabel><FormControl><Input type="number" step="0.01" placeholder="0.00" {...f} onChange={e => {f.onChange(parseFloat(e.target.value)); form.setValue(`costItems.${index}.total`, parseFloat(e.target.value) * (form.getValues(`costItems.${index}.unitPrice`) || 0) ) }} /></FormControl><FormMessage /></FormItem>)}
                          />
                           <FormField control={form.control} name={`costItems.${index}.unitPrice`} render={({ field: f }) => (
                            <FormItem><FormLabel>Unit Price*</FormLabel><FormControl><Input type="number" step="0.01" placeholder="0.00" {...f} onChange={e => {f.onChange(parseFloat(e.target.value)); form.setValue(`costItems.${index}.total`, parseFloat(e.target.value) * (form.getValues(`costItems.${index}.quantity`) || 0) ) }} /></FormControl><FormMessage /></FormItem>)}
                          />
                          <div><Label>Item Total</Label><Input value={itemTotal.toFixed(2)} readOnly disabled className="font-semibold bg-input" /></div>
                        </div>
                        <Button type="button" variant="ghost" size="icon" className="absolute top-1 right-1 text-destructive hover:bg-destructive/10" onClick={() => remove(index)}>
                          <Trash2 className="h-4 w-4" /><span className="sr-only">Remove Item</span>
                        </Button>
                      </div>
                    );
                  })}
                  {fields.length === 0 && <p className="text-sm text-muted-foreground text-center py-2">No cost items added for this housing unit yet.</p>}
                   <Separator className="my-4" />
                   <div className="flex justify-end items-center space-x-3"><Label className="text-md font-semibold">Total Housing Cost:</Label>
                    <Input value={calculateTotalCost(watchedCostItems).toFixed(2)} readOnly disabled className="w-32 font-bold text-lg text-right bg-input" />
                  </div>
                </section>
              </form>
            </Form>
          </div>
          <DialogFooter className="py-4 px-6 border-t">
            <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
            <Button type="submit" form={ACTIVITY_FORM_ID}>
              {editingRecord ? 'Save Changes' : 'Log Housing Record'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Logged Housing & Infrastructure Records</CardTitle>
          <CardDescription>
            View all recorded housing units and their total costs. Edit or delete as needed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {records.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Date Established</TableHead>
                  <TableHead className="text-right">Total Cost</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.sort((a,b) => parseISO(b.createdAt).getTime() - parseISO(a.createdAt).getTime()).map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">{record.name}</TableCell>
                    <TableCell>{record.housingType}</TableCell>
                    <TableCell>{record.capacity} {record.capacityUnit}</TableCell>
                    <TableCell>{isValid(parseISO(record.dateEstablished)) ? format(parseISO(record.dateEstablished), 'PP') : 'Invalid Date'}</TableCell>
                    <TableCell className="text-right font-semibold">
                      {record.totalHousingCost.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="icon" onClick={() => handleOpenModal(record)} className="h-8 w-8"><Edit2 className="h-4 w-4" /><span className="sr-only">Edit</span></Button>
                      <Button variant="destructive" size="icon" onClick={() => handleDeleteRecord(record.id)} className="h-8 w-8"><Trash2 className="h-4 w-4" /><span className="sr-only">Delete</span></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
             <div className="text-center py-10">
                <HomeIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-4 text-muted-foreground">No housing records logged yet.</p>
                <p className="text-sm text-muted-foreground">Click "Add Housing Record" to get started.</p>
            </div>
          )}
        </CardContent>
      </Card>
      <Card className="mt-6 bg-muted/30 p-4">
        <CardHeader className="p-0 pb-2"><CardTitle className="text-base font-semibold text-muted-foreground">About Housing Costing</CardTitle></CardHeader>
        <CardContent className="p-0 text-xs text-muted-foreground space-y-1">
            <p>&bull; This section helps track the setup and major renovation costs for animal housing and infrastructure.</p>
            <p>&bull; Log details for each housing unit, including type, capacity, and specific features.</p>
            <p>&bull; Itemize costs for materials (cement, wood, roofing), labor, equipment used, etc., for construction or significant upgrades.</p>
            <p>&bull; Ongoing minor maintenance costs might be better suited for a general "Operational Expenses" or a specific "Maintenance" module if created later.</p>
        </CardContent>
      </Card>
    </div>
  );
}
    
