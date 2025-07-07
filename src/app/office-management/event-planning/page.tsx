
'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, PlusCircle, Edit2, Trash2, ArrowLeft, Loader2, AlertTriangle } from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Separator } from '@/components/ui/separator';
import type { OfficeEvent } from '@/types/office-event';
import { officeEventCategories } from '@/types/office-event';
import type { OperationalTransaction, CostItem } from '@/types/finance';
import { paymentSources, costCategories } from '@/types/finance';
import { useUserProfile } from '@/contexts/user-profile-context';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, writeBatch, orderBy } from 'firebase/firestore';

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


const eventFormSchema = z.object({
  name: z.string().min(2, "Event name is required.").max(100),
  category: z.enum(officeEventCategories, { required_error: "Category is required." }),
  eventDate: z.string().refine((val) => !!val && isValid(parseISO(val)), { message: "Valid event date is required." }),
  budgetedAmount: z.preprocess(safeParseFloat, z.number().min(0, "Budget must be a positive number or zero.")),
  notes: z.string().max(1000).optional(),
  costItems: z.array(costItemSchema).optional(),
});
type EventFormValues = z.infer<typeof eventFormSchema>;

const RECORDS_COLLECTION = 'officeEvents';
const TRANSACTIONS_COLLECTION = 'transactions';
const EVENT_FORM_ID = 'event-form';

export default function EventPlanningPage() {
  const [events, setEvents] = useState<OfficeEvent[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<OfficeEvent | null>(null);
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { userProfile, isLoading: isProfileLoading } = useUserProfile();

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: { name: '', category: undefined, eventDate: '', budgetedAmount: 0, notes: '', costItems: [] },
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
      setError("Farm information is not available.");
      setIsLoading(false);
      return;
    }
    const fetchEvents = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const q = query(collection(db, RECORDS_COLLECTION), where("farmId", "==", userProfile.farmId), orderBy("eventDate", "desc"));
        const querySnapshot = await getDocs(q);
        setEvents(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as OfficeEvent)));
      } catch (e: any) {
        setError("Failed to load events: " + e.message + ". An index may be required. Check README.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchEvents();
  }, [userProfile, isProfileLoading]);

  const handleOpenModal = (eventToEdit?: OfficeEvent) => {
    setEditingEvent(eventToEdit || null);
    if (eventToEdit) {
      form.reset({
        ...eventToEdit,
        costItems: eventToEdit.costItems?.map(ci => ({...ci, id: ci.id || uuidv4()})) || [],
      });
    } else {
      form.reset({ name: '', category: undefined, eventDate: '', budgetedAmount: 0, notes: '', costItems: [] });
    }
    setIsModalOpen(true);
  };
  
  const onSubmit: SubmitHandler<EventFormValues> = async (data) => {
    if (!userProfile?.farmId) return;

    const totalActualCost = calculateTotalCost(data.costItems);
    const eventData: any = {
      farmId: userProfile.farmId,
      ...data,
      totalActualCost,
      costItems: (data.costItems || []).map(ci => ({...ci, total: (Number(ci.quantity) || 0) * (Number(ci.unitPrice) || 0), id: ci.id || uuidv4()})),
    };
    
    const batch = writeBatch(db);

    try {
      let eventId: string;
      if (editingEvent) {
        eventId = editingEvent.id;
        batch.update(doc(db, RECORDS_COLLECTION, eventId), { ...eventData, updatedAt: serverTimestamp() });
        const transQuery = query(collection(db, TRANSACTIONS_COLLECTION), where("linkedActivityId", "==", eventId));
        const oldTransSnap = await getDocs(transQuery);
        oldTransSnap.forEach(d => batch.delete(d.ref));
      } else {
        const eventRef = doc(collection(db, RECORDS_COLLECTION));
        eventId = eventRef.id;
        batch.set(eventRef, { ...eventData, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
      }

      eventData.costItems.forEach((item: CostItem) => {
        const transRef = doc(collection(db, TRANSACTIONS_COLLECTION));
        const transaction: Omit<OperationalTransaction, 'id'> = {
          farmId: userProfile.farmId,
          date: data.eventDate,
          description: `Event: ${data.name} - ${item.description}`,
          amount: item.total,
          type: 'Expense',
          category: 'Events',
          paymentSource: item.paymentSource,
          linkedModule: 'Event Planning',
          linkedActivityId: eventId,
          linkedItemId: item.id,
        };
        batch.set(transRef, transaction);
      });

      await batch.commit();

      toast({ title: editingEvent ? "Event Updated" : "Event Created", description: `"${data.name}" has been saved.` });
      
      const q = query(collection(db, RECORDS_COLLECTION), where("farmId", "==", userProfile.farmId), orderBy("eventDate", "desc"));
      const querySnapshot = await getDocs(q);
      setEvents(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as OfficeEvent)));
      
      setIsModalOpen(false);
    } catch (e: any) {
      toast({ title: "Error", description: `Failed to save event: ${e.message}`, variant: "destructive" });
    }
  };
  
  const handleDelete = async (eventId: string) => {
    const batch = writeBatch(db);
    batch.delete(doc(db, RECORDS_COLLECTION, eventId));
    
    const transQuery = query(collection(db, TRANSACTIONS_COLLECTION), where("linkedActivityId", "==", eventId));
    const oldTransSnap = await getDocs(transQuery);
    oldTransSnap.forEach(d => batch.delete(d.ref));

    await batch.commit();
    toast({ title: "Event Deleted", variant: "destructive" });
    setEvents(events.filter(e => e.id !== eventId));
  };
  
  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS' }).format(amount);

  return (
    <div>
      <PageHeader
        title="Event Planning"
        icon={Calendar}
        description="Manage event budgets, vendor payments, and schedules for office events."
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push('/office-management/dashboard')}><ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard</Button>
            <Button onClick={() => handleOpenModal()}><PlusCircle className="mr-2 h-4 w-4" /> Log New Event</Button>
          </div>
        }
      />
      
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col">
          <DialogHeader><DialogTitle>{editingEvent ? 'Edit' : 'Log New'} Office Event</DialogTitle></DialogHeader>
          <div className="flex-grow overflow-y-auto pr-2 py-4">
            <Form {...form}>
              <form id={EVENT_FORM_ID} onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <section className="space-y-4 p-4 border rounded-lg">
                  <h3 className="text-lg font-semibold text-primary">Event Details</h3>
                  <FormField name="name" control={form.control} render={({ field }) => (<FormItem><FormLabel>Event Name*</FormLabel><FormControl><Input placeholder="e.g., Q4 Strategy Meeting" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField name="category" control={form.control} render={({ field }) => (<FormItem><FormLabel>Category*</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger></FormControl><SelectContent>{officeEventCategories.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField name="eventDate" control={form.control} render={({ field }) => (<FormItem><FormLabel>Event Date*</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField name="budgetedAmount" control={form.control} render={({ field }) => (<FormItem><FormLabel>Budget (GHS)*</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  </div>
                  <FormField name="notes" control={form.control} render={({ field }) => (<FormItem><FormLabel>Notes</FormLabel><FormControl><Textarea placeholder="Event objectives, attendees, location, etc." {...field} /></FormControl><FormMessage /></FormItem>)} />
                </section>
                <section className="space-y-4 p-4 border rounded-lg">
                  <div className="flex justify-between items-center"><h3 className="text-lg font-semibold text-primary">Associated Costs</h3><Button type="button" size="sm" variant="outline" onClick={() => append({ description: '', category: 'Services', paymentSource: 'Cash', unit: 'item', quantity: 1, unitPrice: 0 })}><PlusCircle className="mr-2 h-4 w-4" /> Add Cost</Button></div>
                  {fields.map((field, index) => (
                    <div key={field.id} className="p-3 border rounded-md space-y-3 bg-muted/20 relative">
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                         <FormField control={form.control} name={`costItems.${index}.category`} render={({ field: f }) => (<FormItem><FormLabel>Category*</FormLabel><Select onValueChange={f.onChange} defaultValue={f.value}><FormControl><SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger></FormControl><SelectContent>{costCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                         <FormField control={form.control} name={`costItems.${index}.description`} render={({ field: f }) => (<FormItem><FormLabel>Description*</FormLabel><FormControl><Input placeholder="e.g., Venue Rental, Catering" {...f} /></FormControl><FormMessage /></FormItem>)} />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
                        <FormField control={form.control} name={`costItems.${index}.paymentSource`} render={({ field: f }) => (<FormItem><FormLabel>Payment Source*</FormLabel><Select onValueChange={f.onChange} defaultValue={f.value}><FormControl><SelectTrigger><SelectValue placeholder="Select source" /></SelectTrigger></FormControl><SelectContent>{paymentSources.map(src => <SelectItem key={src} value={src}>{src}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name={`costItems.${index}.unit`} render={({ field: f }) => (<FormItem><FormLabel>Unit*</FormLabel><FormControl><Input placeholder="e.g., Day, Person" {...f} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name={`costItems.${index}.quantity`} render={({ field: f }) => (<FormItem><FormLabel>Quantity*</FormLabel><FormControl><Input type="number" step="0.01" {...f} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name={`costItems.${index}.unitPrice`} render={({ field: f }) => (<FormItem><FormLabel>Unit Price*</FormLabel><FormControl><Input type="number" step="0.01" {...f} /></FormControl><FormMessage /></FormItem>)} />
                        <div><Label>Item Total</Label><Input value={((form.watch(`costItems.${index}.quantity`) || 0) * (form.watch(`costItems.${index}.unitPrice`) || 0)).toFixed(2)} readOnly disabled className="font-semibold bg-input" /></div>
                      </div>
                      <Button type="button" variant="ghost" size="icon" className="absolute top-1 right-1 text-destructive hover:bg-destructive/10" onClick={() => remove(index)}><Trash2 className="h-4 w-4" /><span className="sr-only">Remove Item</span></Button>
                    </div>
                  ))}
                  {fields.length === 0 && <p className="text-sm text-muted-foreground text-center py-2">No costs added for this event.</p>}
                  <Separator className="my-4" />
                  <div className="flex justify-end items-center space-x-3"><Label className="text-md font-semibold">Total Actual Cost:</Label><Input value={calculateTotalCost(watchedCostItems).toFixed(2)} readOnly disabled className="w-32 font-bold text-lg text-right bg-input" /></div>
                </section>
              </form>
            </Form>
          </div>
          <DialogFooter className="border-t pt-4"><DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose><Button type="submit" form={EVENT_FORM_ID}>{editingEvent ? 'Save Changes' : 'Add Event'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Card className="shadow-lg">
        <CardHeader><CardTitle>Planned Events</CardTitle><CardDescription>A list of all planned office events.</CardDescription></CardHeader>
        <CardContent>
          {isLoading ? (<div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary"/></div>) :
           error ? (<div className="text-destructive p-4 text-center">{error}</div>) :
           events.length === 0 ? (<div className="text-center py-10"><Calendar className="mx-auto h-12 w-12 text-muted-foreground"/><p className="mt-4">No events found.</p></div>) :
          (<Table>
            <TableHeader><TableRow><TableHead>Event Name</TableHead><TableHead>Category</TableHead><TableHead>Event Date</TableHead><TableHead className="text-right">Budget</TableHead><TableHead className="text-right">Actual Cost</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {events.map(event => (
                <TableRow key={event.id}>
                  <TableCell className="font-medium">{event.name}</TableCell>
                  <TableCell>{event.category}</TableCell>
                  <TableCell>{format(parseISO(event.eventDate), 'PP')}</TableCell>
                  <TableCell className="text-right">{formatCurrency(event.budgetedAmount)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(event.totalActualCost)}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleOpenModal(event)}><Edit2 className="h-3.5 w-3.5 mr-1"/>Edit</Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(event.id)}><Trash2 className="h-3.5 w-3.5 mr-1"/>Delete</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>)}
        </CardContent>
      </Card>
    </div>
  );
}
