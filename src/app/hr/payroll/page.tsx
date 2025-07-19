
// src/app/hr/payroll/page.tsx
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Banknote, PlusCircle, Edit2, Trash2, ArrowLeft, Loader2, AlertTriangle, CalendarIcon } from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import type { PayrollRecord, PaymentMethod } from '@/types/payroll';
import { paymentMethods } from '@/types/payroll';
import type { AgriFAASUserProfile } from '@/types/user';
import { useRouter } from 'next/navigation';
import { useUserProfile } from '@/contexts/user-profile-context';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, writeBatch, orderBy } from 'firebase/firestore';
import type { OperationalTransaction } from '@/types/finance';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

const safeParseFloat = (val: any) => (val === "" || val === null || val === undefined) ? undefined : parseFloat(String(val));

const payrollFormSchema = z.object({
  userId: z.string().min(1, "Employee selection is required."),
  payPeriod: z.string().min(3, "Pay period is required (e.g., 'October 2024')."),
  paymentDate: z.date({ required_error: "A payment date is required." }),
  grossAmount: z.preprocess(safeParseFloat, z.number().min(0.01, "Gross amount must be greater than 0.")),
  deductions: z.preprocess(safeParseFloat, z.number().min(0, "Deductions cannot be negative.")),
  paymentMethod: z.enum(paymentMethods, { required_error: "Payment method is required." }),
  notes: z.string().max(500).optional(),
}).refine(data => {
    const gross = data.grossAmount || 0;
    const deductions = data.deductions || 0;
    return gross >= deductions;
}, {
  message: "Deductions cannot be greater than the gross amount.",
  path: ["deductions"],
});

type PayrollFormValues = z.infer<typeof payrollFormSchema>;

const PAYROLL_RECORDS_COLLECTION = 'payrollRecords';
const TRANSACTIONS_COLLECTION = 'transactions';
const USERS_COLLECTION = 'users';
const PAYROLL_FORM_ID = 'payroll-form';

export default function PayrollPage() {
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([]);
  const [employees, setEmployees] = useState<AgriFAASUserProfile[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<PayrollRecord | null>(null);
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { userProfile, isLoading: isProfileLoading } = useUserProfile();

  const form = useForm<PayrollFormValues>({
    resolver: zodResolver(payrollFormSchema),
    defaultValues: { userId: '', payPeriod: '', grossAmount: undefined, deductions: undefined, paymentMethod: undefined, notes: '' },
  });
  
  const watchedGrossAmount = form.watch("grossAmount");
  const watchedDeductions = form.watch("deductions");

  useEffect(() => {
    if (isProfileLoading) return;
    if (!userProfile?.farmId) {
      setError("Farm information is not available. Cannot load data.");
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        if (!userProfile.farmId) throw new Error("User is not associated with a farm.");
        
        // Fetch Payroll Records
        const payrollQuery = query(collection(db, PAYROLL_RECORDS_COLLECTION), where("farmId", "==", userProfile.farmId), orderBy("paymentDate", "desc"));
        const payrollSnapshot = await getDocs(payrollQuery);
        const fetchedRecords = payrollSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as PayrollRecord[];
        setPayrollRecords(fetchedRecords);

        // Fetch Employees
        const usersQuery = query(collection(db, USERS_COLLECTION), where("farmId", "==", userProfile.farmId), orderBy("fullName", "asc"));
        const usersSnapshot = await getDocs(usersQuery);
        const fetchedUsers = usersSnapshot.docs.map(doc => doc.data() as AgriFAASUserProfile);
        setEmployees(fetchedUsers);
        
      } catch (err: any) {
        console.error("Error fetching data:", err);
        setError(`Failed to fetch data: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [userProfile, isProfileLoading]);

  const handleOpenModal = (recordToEdit?: PayrollRecord) => {
    if (recordToEdit) {
      setEditingRecord(recordToEdit);
      form.reset({
        userId: recordToEdit.userId,
        payPeriod: recordToEdit.payPeriod,
        paymentDate: parseISO(recordToEdit.paymentDate),
        grossAmount: recordToEdit.grossAmount,
        deductions: recordToEdit.deductions,
        paymentMethod: recordToEdit.paymentMethod,
        notes: recordToEdit.notes || '',
      });
    } else {
      form.reset({ userId: '', payPeriod: '', grossAmount: undefined, deductions: undefined, paymentMethod: undefined, notes: '' });
    }
    setIsModalOpen(true);
  };
  
  const onSubmit: SubmitHandler<PayrollFormValues> = async (data) => {
    if (!userProfile?.farmId || !db) {
      toast({ title: "Error", description: "Cannot save. Farm/database information is missing.", variant: "destructive" });
      return;
    }

    const employee = employees.find(e => e.userId === data.userId);
    if (!employee) {
      toast({ title: "Error", description: "Selected employee not found.", variant: "destructive" });
      return;
    }

    const grossAmount = data.grossAmount || 0;
    const deductions = data.deductions || 0;
    const netAmount = grossAmount - deductions;

    const recordData = {
      farmId: userProfile.farmId,
      ...data,
      paymentDate: format(data.paymentDate, 'yyyy-MM-dd'),
      grossAmount,
      deductions,
      userName: employee.fullName,
      netAmount,
      updatedAt: serverTimestamp(),
    };

    const batch = writeBatch(db);

    try {
      let recordId: string;
      if (editingRecord) {
        recordId = editingRecord.id;
        const recordRef = doc(db, PAYROLL_RECORDS_COLLECTION, recordId);
        batch.update(recordRef, recordData);
        
        const transQuery = query(collection(db, TRANSACTIONS_COLLECTION), where("linkedActivityId", "==", recordId));
        const oldTransSnap = await getDocs(transQuery);
        oldTransSnap.forEach(doc => batch.delete(doc.ref));

      } else {
        const recordRef = doc(collection(db, PAYROLL_RECORDS_COLLECTION));
        recordId = recordRef.id;
        batch.set(recordRef, { ...recordData, createdAt: serverTimestamp() });
      }

      // Add financial transaction for the gross amount
      const transRef = doc(collection(db, TRANSACTIONS_COLLECTION));
      const newTransaction: Omit<OperationalTransaction, 'id'> = {
        farmId: userProfile.farmId,
        date: recordData.paymentDate,
        description: `Payroll for ${employee.fullName} - ${data.payPeriod}`,
        amount: grossAmount,
        type: 'Expense',
        category: 'Payroll',
        paymentSource: data.paymentMethod,
        linkedModule: 'Payroll',
        linkedActivityId: recordId,
        linkedItemId: recordId,
      };
      batch.set(transRef, newTransaction);

      await batch.commit();

      if (editingRecord) {
        setPayrollRecords(records => records.map(r => r.id === recordId ? { ...r, ...recordData, id: recordId } : r));
        toast({ title: "Payroll Record Updated", description: `Payroll for ${employee.fullName} has been updated.` });
      } else {
        setPayrollRecords(records => [...records, { ...recordData, id: recordId, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }]);
        toast({ title: "Payroll Record Created", description: `Payroll for ${employee.fullName} has been created.` });
      }
      setIsModalOpen(false);
      form.reset();
    } catch (err: any) {
      console.error("Error saving payroll record:", err);
      toast({ title: "Save Failed", description: `Could not save record. Error: ${err.message}`, variant: "destructive" });
    }
  };

  const handleDeleteRecord = async (id: string) => {
    const recordToDelete = payrollRecords.find(r => r.id === id);
    if (!recordToDelete || !db) return;

    const batch = writeBatch(db);
    try {
        batch.delete(doc(db, PAYROLL_RECORDS_COLLECTION, id));
        
        const transQuery = query(collection(db, TRANSACTIONS_COLLECTION), where("linkedActivityId", "==", id));
        const transSnap = await getDocs(transQuery);
        transSnap.forEach(doc => batch.delete(doc.ref));

        await batch.commit();
        setPayrollRecords(records => records.filter((r) => r.id !== id));
        toast({ title: "Record Deleted", description: `Payroll record for "${recordToDelete.userName}" has been removed.`, variant: "destructive" });
    } catch(err: any) {
        console.error("Error deleting payroll record:", err);
        toast({ title: "Deletion Failed", description: `Could not delete record. Error: ${err.message}`, variant: "destructive" });
    }
  };

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS' }).format(amount);

  if (isProfileLoading || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-12rem)]">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
        <p className="ml-3 text-lg text-muted-foreground">Loading payroll data...</p>
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
        title="Payroll Management"
        icon={Banknote}
        description="Create and manage payroll for your employees. Records are linked to financial reports."
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push('/hr/dashboard')}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to HR Dashboard
            </Button>
            <Button onClick={() => handleOpenModal()}>
              <PlusCircle className="mr-2 h-4 w-4" /> Create Payroll Record
            </Button>
          </div>
        }
      />

      <Dialog open={isModalOpen} onOpenChange={(isOpen) => {
        setIsModalOpen(isOpen);
        if (!isOpen) { form.reset(); setEditingRecord(null); }
      }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{editingRecord ? 'Edit Payroll Record' : 'Create New Payroll Record'}</DialogTitle>
          </DialogHeader>
          <div className="flex-grow overflow-y-auto pr-2 py-4">
            <Form {...form}>
              <form id={PAYROLL_FORM_ID} onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="userId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Employee*</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select an employee" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {employees.map(emp => <SelectItem key={emp.userId} value={emp.userId}>{emp.fullName}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="payPeriod" render={({ field }) => (
                  <FormItem><FormLabel>Pay Period*</FormLabel><FormControl><Input placeholder="e.g., October 2024" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                 <FormField control={form.control} name="paymentDate" render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Payment Date*</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
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
                  </FormItem>
                )} />
                <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="grossAmount" render={({ field }) => (
                        <FormItem><FormLabel>Gross Amount (GHS)*</FormLabel><FormControl><Input type="number" step="0.01" placeholder="0.00" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="deductions" render={({ field }) => (
                        <FormItem><FormLabel>Deductions (GHS)*</FormLabel><FormControl><Input type="number" step="0.01" placeholder="0.00" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                </div>
                <div>
                  <FormLabel>Net Amount</FormLabel>
                  <Input readOnly disabled value={formatCurrency((watchedGrossAmount || 0) - (watchedDeductions || 0))} className="font-semibold bg-input" />
                </div>
                 <FormField control={form.control} name="paymentMethod" render={({ field }) => (
                  <FormItem><FormLabel>Payment Method*</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select method" /></SelectTrigger></FormControl>
                      <SelectContent>{paymentMethods.map(method => <SelectItem key={method} value={method}>{method}</SelectItem>)}</SelectContent>
                    </Select><FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="notes" render={({ field }) => (
                  <FormItem><FormLabel>Notes (Optional)</FormLabel><FormControl><Textarea placeholder="e.g., Bonus included, final payment..." {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </form>
            </Form>
          </div>
          <DialogFooter className="border-t pt-4">
            <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
            <Button type="submit" form={PAYROLL_FORM_ID}>
              {editingRecord ? 'Save Changes' : 'Create Record'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Payroll History</CardTitle>
          <CardDescription>
            {payrollRecords.length > 0 ? "A list of all processed payroll records." : "No payroll records found."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {payrollRecords.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead><TableHead>Pay Period</TableHead>
                  <TableHead>Payment Date</TableHead><TableHead className="text-right">Net Amount</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payrollRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">{record.userName}</TableCell>
                    <TableCell>{record.payPeriod}</TableCell>
                    <TableCell>{isValid(parseISO(record.paymentDate)) ? format(parseISO(record.paymentDate), 'PP') : 'Invalid Date'}</TableCell>
                    <TableCell className="text-right font-semibold">{formatCurrency(record.netAmount)}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleOpenModal(record)}>
                        <Edit2 className="h-3.5 w-3.5 mr-1" /> Edit
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDeleteRecord(record.id)}>
                        <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-10">
              <Banknote className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">No payroll records have been created yet.</p>
              <p className="text-sm text-muted-foreground">Click "Create Payroll Record" to get started.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
