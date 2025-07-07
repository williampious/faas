
'use client';

import { useState, useEffect } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileArchive, PlusCircle, Edit2, Trash2, ArrowLeft, Loader2, AlertTriangle, Link as LinkIcon } from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import type { RecordsManagementRecord, RecordCategory } from '@/types/records-management';
import { recordCategories } from '@/types/records-management';
import type { OperationalTransaction } from '@/types/finance';
import { paymentSources } from '@/types/finance';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRouter } from 'next/navigation';
import { useUserProfile } from '@/contexts/user-profile-context';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, writeBatch, orderBy } from 'firebase/firestore';

const safeParseFloat = (val: any) => (val === "" || val === null || val === undefined) ? undefined : parseFloat(String(val));

const recordFormSchema = z.object({
  name: z.string().min(2, "Record name is required.").max(100),
  category: z.enum(recordCategories, { required_error: "Category is required." }),
  cost: z.preprocess(safeParseFloat, z.number().min(0, "Cost must be a positive number or zero.")),
  paymentSource: z.enum(paymentSources).optional(),
  paymentDate: z.string().refine((val) => !!val && isValid(parseISO(val)), { message: "Valid payment date is required." }),
  expiryDate: z.string().optional(),
  vendor: z.string().max(100).optional(),
  documentUrl: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
  notes: z.string().max(500).optional(),
}).refine(data => {
  if (data.cost > 0) {
    return !!data.paymentSource;
  }
  return true;
}, {
  message: "Payment Source is required when cost is greater than zero.",
  path: ["paymentSource"],
});
type RecordFormValues = z.infer<typeof recordFormSchema>;

const RECORDS_COLLECTION = 'recordsManagementRecords';
const TRANSACTIONS_COLLECTION = 'transactions';
const RECORD_FORM_ID = 'record-form';

export default function RecordsManagementPage() {
  const [records, setRecords] = useState<RecordsManagementRecord[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<RecordsManagementRecord | null>(null);
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { userProfile, isLoading: isProfileLoading } = useUserProfile();

  const form = useForm<RecordFormValues>({
    resolver: zodResolver(recordFormSchema),
    defaultValues: { name: '', category: undefined, cost: 0, paymentSource: undefined, paymentDate: '', expiryDate: '', vendor: '', documentUrl: '', notes: '' },
  });

  useEffect(() => {
    if (isProfileLoading) return;
    if (!userProfile?.farmId) {
      setError("Farm information is not available.");
      setIsLoading(false);
      return;
    }
    const fetchRecords = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const q = query(collection(db, RECORDS_COLLECTION), where("farmId", "==", userProfile.farmId), orderBy("paymentDate", "desc"));
        const querySnapshot = await getDocs(q);
        setRecords(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RecordsManagementRecord)));
      } catch (e: any) {
        setError("Failed to load records: " + e.message + ". An index may be required. Please check the README file.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchRecords();
  }, [userProfile, isProfileLoading]);
  
  const handleOpenModal = (recordToEdit?: RecordsManagementRecord) => {
    setEditingRecord(recordToEdit || null);
    form.reset(recordToEdit || { name: '', category: undefined, cost: 0, paymentSource: undefined, paymentDate: '', expiryDate: '', vendor: '', documentUrl: '', notes: '' });
    setIsModalOpen(true);
  };
  
  const onSubmit: SubmitHandler<RecordFormValues> = async (data) => {
    if (!userProfile?.farmId) return;

    const recordData = {
      farmId: userProfile.farmId,
      ...data,
      cost: data.cost || 0,
    };
    
    const batch = writeBatch(db);

    try {
      let recordId: string;
      if (editingRecord) {
        recordId = editingRecord.id;
        batch.update(doc(db, RECORDS_COLLECTION, recordId), { ...recordData, updatedAt: serverTimestamp() });
        
        const transQuery = query(collection(db, TRANSACTIONS_COLLECTION), where("linkedActivityId", "==", recordId));
        const oldTransSnap = await getDocs(transQuery);
        oldTransSnap.forEach(d => batch.delete(d.ref));
      } else {
        const recordRef = doc(collection(db, RECORDS_COLLECTION));
        recordId = recordRef.id;
        batch.set(recordRef, { ...recordData, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
      }

      if (recordData.cost > 0) {
        const transRef = doc(collection(db, TRANSACTIONS_COLLECTION));
        const transaction: Omit<OperationalTransaction, 'id'> = {
          farmId: userProfile.farmId,
          date: recordData.paymentDate,
          description: `Record Mgmt: ${recordData.name}`,
          amount: recordData.cost,
          type: 'Expense',
          category: 'Administrative',
          paymentSource: data.paymentSource!,
          linkedModule: 'Records Management',
          linkedActivityId: recordId,
          linkedItemId: recordId,
        };
        batch.set(transRef, transaction);
      }

      await batch.commit();

      toast({ title: editingRecord ? "Record Updated" : "Record Created", description: `"${data.name}" has been saved.` });
      
      // Re-fetch to get the latest data
      const q = query(collection(db, RECORDS_COLLECTION), where("farmId", "==", userProfile.farmId), orderBy("paymentDate", "desc"));
      const querySnapshot = await getDocs(q);
      setRecords(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RecordsManagementRecord)));
      
      setIsModalOpen(false);
    } catch (e: any) {
      toast({ title: "Error", description: `Failed to save record: ${e.message}`, variant: "destructive" });
    }
  };

  const handleDelete = async (recordId: string) => {
    const batch = writeBatch(db);
    batch.delete(doc(db, RECORDS_COLLECTION, recordId));
    
    const transQuery = query(collection(db, TRANSACTIONS_COLLECTION), where("linkedActivityId", "==", recordId));
    const oldTransSnap = await getDocs(transQuery);
    oldTransSnap.forEach(d => batch.delete(d.ref));

    await batch.commit();
    toast({ title: "Record Deleted", variant: "destructive" });
    setRecords(records.filter(a => a.id !== recordId));
  };

  return (
    <div>
      <PageHeader
        title="Records Management"
        icon={FileArchive}
        description="Handle licensing, filing systems, audit trails, and document retention."
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push('/office-management/dashboard')}><ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard</Button>
            <Button onClick={() => handleOpenModal()}><PlusCircle className="mr-2 h-4 w-4" /> Log New Record</Button>
          </div>
        }
      />
      
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] flex flex-col">
          <DialogHeader><DialogTitle>{editingRecord ? 'Edit' : 'Log New'} Administrative Record</DialogTitle></DialogHeader>
          <div className="flex-grow overflow-y-auto pr-2 py-4">
            <Form {...form}>
              <form id={RECORD_FORM_ID} onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField name="name" control={form.control} render={({ field }) => (<FormItem><FormLabel>Record/Item Name*</FormLabel><FormControl><Input placeholder="e.g., Business Operating Permit 2024" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField name="category" control={form.control} render={({ field }) => (<FormItem><FormLabel>Category*</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger></FormControl><SelectContent>{recordCategories.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                <div className="grid grid-cols-2 gap-4">
                    <FormField name="cost" control={form.control} render={({ field }) => (<FormItem><FormLabel>Cost (GHS)*</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField name="paymentDate" control={form.control} render={({ field }) => (<FormItem><FormLabel>Payment Date*</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)} />
                </div>
                 <FormField name="paymentSource" control={form.control} render={({ field }) => (<FormItem><FormLabel>Payment Source</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value} disabled={form.watch('cost') === 0}><FormControl><SelectTrigger><SelectValue placeholder="Select source" /></SelectTrigger></FormControl><SelectContent>{paymentSources.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                <FormField name="vendor" control={form.control} render={({ field }) => (<FormItem><FormLabel>Vendor/Authority (Optional)</FormLabel><FormControl><Input placeholder="e.g., Registrar General, EPA" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField name="expiryDate" control={form.control} render={({ field }) => (<FormItem><FormLabel>Expiry Date (Optional)</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField name="documentUrl" control={form.control} render={({ field }) => (<FormItem><FormLabel>Document Link (Optional)</FormLabel><FormControl><Input type="url" placeholder="https://..." {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField name="notes" control={form.control} render={({ field }) => (<FormItem><FormLabel>Notes</FormLabel><FormControl><Textarea placeholder="Any other relevant details" {...field} /></FormControl><FormMessage /></FormItem>)} />
              </form>
            </Form>
          </div>
          <DialogFooter className="border-t pt-4"><DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose><Button type="submit" form={RECORD_FORM_ID}>{editingRecord ? 'Save Changes' : 'Add Record'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Card className="shadow-lg">
        <CardHeader><CardTitle>Administrative Records</CardTitle><CardDescription>A list of all logged administrative expenses and documents.</CardDescription></CardHeader>
        <CardContent>
          {isLoading ? (<div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary"/></div>) :
           error ? (<div className="text-destructive p-4 text-center">{error}</div>) :
           records.length === 0 ? (<div className="text-center py-10"><FileArchive className="mx-auto h-12 w-12 text-muted-foreground"/><p className="mt-4">No administrative records found.</p></div>) :
          (<Table>
            <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Category</TableHead><TableHead>Payment Date</TableHead><TableHead className="text-right">Cost</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {records.map(record => (
                <TableRow key={record.id}>
                  <TableCell className="font-medium">{record.name}</TableCell>
                  <TableCell>{record.category}</TableCell>
                  <TableCell>{format(parseISO(record.paymentDate), 'PP')}</TableCell>
                  <TableCell className="text-right">{new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS' }).format(record.cost)}</TableCell>
                  <TableCell className="text-right space-x-2">
                    {record.documentUrl && <a href={record.documentUrl} target="_blank" rel="noopener noreferrer"><Button variant="outline" size="icon" className="h-8 w-8"><LinkIcon className="h-4 w-4" /></Button></a>}
                    <Button variant="outline" size="sm" onClick={() => handleOpenModal(record)}><Edit2 className="h-3.5 w-3.5 mr-1"/>Edit</Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(record.id)}><Trash2 className="h-3.5 w-3.5 mr-1"/>Delete</Button>
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
