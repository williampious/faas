
'use client';

import { useState, useEffect } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, CalendarClock, Trash2, Edit2, Loader2, AlertTriangle, ArrowLeft } from 'lucide-react';
import { format, parseISO, isValid, isAfter, isEqual } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import type { FinancialYear } from '@/types/financial-year';
import { useUserProfile } from '@/contexts/user-profile-context';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, orderBy } from 'firebase/firestore';

const yearFormSchema = z.object({
  name: z.string().min(3, { message: "Year name must be at least 3 characters." }).max(50),
  startDate: z.string().refine((val) => !!val && isValid(parseISO(val)), { message: "Valid start date is required." }),
  endDate: z.string().refine((val) => !!val && isValid(parseISO(val)), { message: "Valid end date is required." }),
  status: z.enum(['Active', 'Archived']),
}).refine(data => isAfter(parseISO(data.endDate), parseISO(data.startDate)) || isEqual(parseISO(data.endDate), parseISO(data.startDate)), {
  message: "End date must be on or after start date.",
  path: ["endDate"],
});

type YearFormValues = z.infer<typeof yearFormSchema>;

const FINANCIAL_YEARS_COLLECTION = 'financialYears';

export default function FinancialYearPage() {
  const [years, setYears] = useState<FinancialYear[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { userProfile, isLoading: isProfileLoading } = useUserProfile();
  const { toast } = useToast();

  const [isYearModalOpen, setIsYearModalOpen] = useState(false);
  const [editingYear, setEditingYear] = useState<FinancialYear | null>(null);

  const form = useForm<YearFormValues>({ 
    resolver: zodResolver(yearFormSchema),
    defaultValues: { name: '', startDate: '', endDate: '', status: 'Active' },
  });
  
  const tenantId = userProfile?.tenantId;

  useEffect(() => {
    if (isProfileLoading) return;
    if (!tenantId) {
      setError("Farm information not available.");
      setIsLoading(false);
      return;
    }
    const fetchYears = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const recordsPath = `tenants/${tenantId}/${FINANCIAL_YEARS_COLLECTION}`;
        const q = query(collection(db, recordsPath), orderBy("startDate", "desc"));
        const querySnapshot = await getDocs(q);
        setYears(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FinancialYear)));
      } catch (e: any) {
        setError("Failed to load financial years. Please check permissions and network.");
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchYears();
  }, [userProfile, isProfileLoading, tenantId]);

  const handleOpenModal = (year?: FinancialYear) => {
    setEditingYear(year || null);
    form.reset(year ? { name: year.name, startDate: year.startDate, endDate: year.endDate, status: year.status } : { name: '', startDate: '', endDate: '', status: 'Active' });
    setIsYearModalOpen(true);
  };

  const handleYearSubmit: SubmitHandler<YearFormValues> = async (data) => {
    if (!tenantId) return;
    
    const recordsPath = `tenants/${tenantId}/${FINANCIAL_YEARS_COLLECTION}`;
    
    try {
      if (editingYear) {
        const yearRef = doc(db, recordsPath, editingYear.id);
        await updateDoc(yearRef, { ...data, updatedAt: serverTimestamp() });
        setYears(years.map(y => y.id === editingYear.id ? { ...y, ...data, tenantId } : y));
        toast({ title: "Financial Year Updated" });
      } else {
        const newYear = { tenantId: tenantId, ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() };
        const docRef = await addDoc(collection(db, recordsPath), newYear);
        setYears([{ ...newYear, id: docRef.id, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as FinancialYear, ...years]);
        toast({ title: "Financial Year Created" });
      }
      setIsYearModalOpen(false);
    } catch (e: any) {
      toast({ title: "Error", description: `Failed to save year: ${e.message}`, variant: "destructive" });
    }
  };

  const handleDeleteYear = async (yearId: string) => {
    if (!tenantId) return;
    const recordsPath = `tenants/${tenantId}/${FINANCIAL_YEARS_COLLECTION}`;
    await deleteDoc(doc(db, recordsPath, yearId));
    setYears(years.filter(y => y.id !== yearId));
    toast({ title: "Financial Year Deleted", variant: "destructive" });
  };
  
  const formatDate = (dateStr: string) => isValid(parseISO(dateStr)) ? format(parseISO(dateStr), 'PP') : 'Invalid Date';

  if (isLoading || isProfileLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-12rem)]">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
        <p className="ml-3 text-lg text-muted-foreground">Loading financial years...</p>
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
        title="Financial Year Configuration"
        icon={CalendarClock}
        description="Define and manage financial years to structure your reporting and budgeting."
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push('/office-management/dashboard')}><ArrowLeft className="mr-2 h-4 w-4" /> Back to Office Dashboard</Button>
            <Button onClick={() => handleOpenModal()}><PlusCircle className="mr-2 h-4 w-4" /> Create Financial Year</Button>
          </div>
        }
      />
      
      <Dialog open={isYearModalOpen} onOpenChange={setIsYearModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingYear ? 'Edit' : 'Create'} Financial Year</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleYearSubmit)} className="space-y-4 py-4">
              <FormField name="name" control={form.control} render={({ field }) => (<FormItem><FormLabel>Year Name*</FormLabel><FormControl><Input placeholder="e.g., FY 2024-2025" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField name="startDate" control={form.control} render={({ field }) => (<FormItem><FormLabel>Start Date*</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField name="endDate" control={form.control} render={({ field }) => (<FormItem><FormLabel>End Date*</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <DialogFooter>
                <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                <Button type="submit">{editingYear ? 'Save Changes' : 'Create Year'}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Defined Financial Years</CardTitle>
          <CardDescription>A list of all financial years for your office.</CardDescription>
        </CardHeader>
        <CardContent>
          {years.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {years.map(year => (
                  <TableRow key={year.id}>
                    <TableCell className="font-medium">{year.name}</TableCell>
                    <TableCell>{formatDate(year.startDate)}</TableCell>
                    <TableCell>{formatDate(year.endDate)}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleOpenModal(year)}>
                        <Edit2 className="h-3.5 w-3.5 mr-1" /> Edit
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDeleteYear(year.id)}>
                        <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-10">
              <CalendarClock className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">No financial years created yet.</p>
              <p className="text-sm text-muted-foreground">Click "Create Financial Year" to get started.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
