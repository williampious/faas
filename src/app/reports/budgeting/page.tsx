
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
import { PlusCircle, CalendarRange, Trash2, Banknote, ArrowLeft, Eye, Loader2, AlertTriangle } from 'lucide-react';
import { format, parseISO, isValid, isAfter, isEqual, isWithinInterval } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import type { Budget } from '@/types/budget';
import type { OperationalTransaction } from '@/types/finance';
import { useRouter } from 'next/navigation';
import { useUserProfile } from '@/contexts/user-profile-context';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';

const budgetFormSchema = z.object({
  name: z.string().min(3, { message: "Budget name must be at least 3 characters." }).max(100),
  startDate: z.string().refine((val) => !!val && isValid(parseISO(val)), { message: "Valid start date is required." }),
  endDate: z.string().refine((val) => !!val && isValid(parseISO(val)), { message: "Valid end date is required." }),
  notes: z.string().max(500).optional(),
}).refine(data => {
  const start = parseISO(data.startDate);
  const end = parseISO(data.endDate);
  return isAfter(end, start) || isEqual(end, start);
}, {
  message: "End date must be on or after start date.",
  path: ["endDate"], 
});

type BudgetFormValues = z.infer<typeof budgetFormSchema>;

const BUDGETS_COLLECTION = 'budgets';
const TRANSACTIONS_COLLECTION = 'transactions';
const BUDGET_FORM_ID = 'budget-form';

export default function BudgetingPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { userProfile, isLoading: isProfileLoading } = useUserProfile();

  const form = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetFormSchema),
    defaultValues: { name: '', startDate: '', endDate: '', notes: '' },
  });

  useEffect(() => {
    if (isProfileLoading) return;
    if (!userProfile?.farmId) {
      setError("Farm information is not available. Cannot load data.");
      setIsLoading(false);
      return;
    }

    const fetchBudgetsAndTransactions = async () => {
      setIsLoading(true);
      setError(null);
      try {
        if (!userProfile.farmId) throw new Error("User is not associated with a farm.");

        const budgetsQuery = query(collection(db, BUDGETS_COLLECTION), where("farmId", "==", userProfile.farmId));
        const transactionsQuery = query(collection(db, TRANSACTIONS_COLLECTION), where("farmId", "==", userProfile.farmId));

        const [budgetsSnapshot, transactionsSnapshot] = await Promise.all([
          getDocs(budgetsQuery),
          getDocs(transactionsQuery)
        ]);

        const fetchedBudgets = budgetsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Budget));
        const allTransactions = transactionsSnapshot.docs.map(doc => doc.data() as OperationalTransaction);

        const updatedBudgets = fetchedBudgets.map(budget => {
          const totalBudgetedAmount = budget.categories.reduce((sum, cat) => sum + (cat.budgetedAmount || 0), 0);
          
          const budgetInterval = { start: parseISO(budget.startDate), end: parseISO(budget.endDate) };
          const relevantExpenses = allTransactions
            .filter(t => t.type === 'Expense' && isWithinInterval(parseISO(t.date), budgetInterval));
          const totalActualSpending = relevantExpenses.reduce((sum, t) => sum + (t.amount || 0), 0);
          
          return {
            ...budget,
            totalBudgetedAmount,
            totalActualSpending,
            totalVariance: totalBudgetedAmount - totalActualSpending,
          };
        });

        setBudgets(updatedBudgets);
      } catch (err: any) {
        console.error("Error fetching data:", err);
        setError(`Failed to fetch budget data: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBudgetsAndTransactions();
  }, [userProfile, isProfileLoading]);

  const handleOpenModal = (budgetToEdit?: Budget) => {
    if (budgetToEdit) {
      setEditingBudget(budgetToEdit);
      form.reset({ name: budgetToEdit.name, startDate: budgetToEdit.startDate, endDate: budgetToEdit.endDate, notes: budgetToEdit.notes || '' });
    } else {
      setEditingBudget(null);
      form.reset({ name: '', startDate: '', endDate: '', notes: '' });
    }
    setIsModalOpen(true);
  };

  const onSubmit: SubmitHandler<BudgetFormValues> = async (data) => {
    if (!userProfile?.farmId || !db) {
      toast({ title: "Error", description: "Cannot save. Farm/database information is missing.", variant: "destructive" });
      return;
    }
    
    try {
      if (editingBudget) {
        const budgetRef = doc(db, BUDGETS_COLLECTION, editingBudget.id);
        await updateDoc(budgetRef, {
            ...data,
            notes: data.notes || '',
            updatedAt: serverTimestamp(),
        });
        setBudgets(budgets.map(b => b.id === editingBudget.id ? {...b, ...data, notes: data.notes || undefined} : b));
        toast({ title: "Budget Updated", description: `Budget "${data.name}" has been updated.` });
      } else {
        const newBudgetData = {
          farmId: userProfile.farmId,
          ...data,
          notes: data.notes || '',
          categories: [],
          totalBudgetedAmount: 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
        const docRef = await addDoc(collection(db, BUDGETS_COLLECTION), newBudgetData);
        const newBudgetForState: Budget = { ...newBudgetData, id: docRef.id, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
        setBudgets(prev => [...prev, newBudgetForState]);
        toast({ title: "Budget Created", description: `Budget "${data.name}" has been created.` });
      }
      setIsModalOpen(false);
      setEditingBudget(null);
      form.reset();
    } catch (err: any) {
      console.error("Error saving budget:", err);
      toast({ title: "Save Failed", description: `Could not save budget. Error: ${err.message}`, variant: "destructive" });
    }
  };

  const handleDeleteBudget = async (id: string) => {
    const budgetToDelete = budgets.find(b => b.id === id);
    if (!budgetToDelete) return;
    try {
      await deleteDoc(doc(db, BUDGETS_COLLECTION, id));
      setBudgets(budgets.filter(b => b.id !== id));
      toast({ title: "Budget Deleted", description: `Budget "${budgetToDelete.name}" has been removed.`, variant: "destructive" });
    } catch(err: any) {
      console.error("Error deleting budget:", err);
      toast({ title: "Deletion Failed", description: `Could not delete budget. Error: ${err.message}`, variant: "destructive" });
    }
  };
  
  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS' }).format(amount);

  if (isProfileLoading || isLoading) {
    return (
       <div className="flex justify-center items-center min-h-[calc(100vh-12rem)]">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
        <p className="ml-3 text-lg text-muted-foreground">Loading budgeting tools...</p>
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
        title="Farm Budgeting & Forecasting"
        icon={Banknote}
        description="Plan, create, and manage your farm budgets for upcoming seasons or years."
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push('/reports/financial-dashboard')}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Financial Dashboard
            </Button>
            <Button onClick={() => handleOpenModal()}>
              <PlusCircle className="mr-2 h-4 w-4" /> Create New Budget
            </Button>
          </div>
        }
      />

      <Dialog open={isModalOpen} onOpenChange={(isOpen) => {
        setIsModalOpen(isOpen);
        if (!isOpen) { form.reset(); setEditingBudget(null); }
      }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{editingBudget ? 'Edit Budget' : 'Create New Budget'}</DialogTitle>
            <DialogDescription>{editingBudget ? 'Update the details for this budget.' : 'Define the name and timeframe for your new budget.'}</DialogDescription>
          </DialogHeader>
          <div className="flex-grow overflow-y-auto pr-2 py-4">
            <Form {...form}>
              <form id={BUDGET_FORM_ID} onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Budget Name*</FormLabel><FormControl><Input placeholder="e.g., 2024 Maize Season" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="startDate" render={({ field }) => (<FormItem><FormLabel>Start Date*</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="endDate" render={({ field }) => (<FormItem><FormLabel>End Date*</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)} />
                </div>
                <FormField control={form.control} name="notes" render={({ field }) => (<FormItem><FormLabel>Notes (Optional)</FormLabel><FormControl><Textarea placeholder="Any additional details or goals for this budget" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <Card className="mt-4 bg-muted/30 p-3"><CardDescription className="text-xs text-muted-foreground">Detailed budget categories are managed after creating the budget. Click "View/Manage Details" to proceed.</CardDescription></Card>
              </form>
            </Form>
          </div>
          <DialogFooter className="py-4 px-6 border-t">
            <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
            <Button type="submit" form={BUDGET_FORM_ID}>{editingBudget ? 'Save Changes' : 'Create Budget'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Existing Budgets</CardTitle>
          <CardDescription>{budgets.length > 0 ? "Manage your farm budgets. Click 'View/Manage Details' to add categories." : "No budgets created yet. Click 'Create New Budget' to start."}</CardDescription>
        </CardHeader>
        <CardContent>
          {budgets.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Budget Name</TableHead><TableHead>Period</TableHead><TableHead>Budgeted</TableHead>
                  <TableHead>Actual</TableHead><TableHead>Variance</TableHead><TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {budgets.sort((a,b) => parseISO(b.createdAt).getTime() - parseISO(a.createdAt).getTime()).map((budget) => (
                  <TableRow key={budget.id}>
                    <TableCell className="font-medium">{budget.name}</TableCell>
                    <TableCell>
                      {isValid(parseISO(budget.startDate)) ? format(parseISO(budget.startDate), 'PP') : 'N/A'} - 
                      {isValid(parseISO(budget.endDate)) ? format(parseISO(budget.endDate), 'PP') : 'N/A'}
                    </TableCell>
                    <TableCell>{formatCurrency(budget.totalBudgetedAmount || 0)}</TableCell>
                    <TableCell>{formatCurrency(budget.totalActualSpending || 0)}</TableCell>
                    <TableCell className={(budget.totalVariance || 0) < 0 ? 'text-red-600' : 'text-green-600'}>{formatCurrency(budget.totalVariance || 0)}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="sm" onClick={() => router.push(`/reports/budgeting/${budget.id}`)}><Eye className="h-3.5 w-3.5 mr-1" /> Details</Button>
                      <Button variant="outline" size="sm" onClick={() => handleOpenModal(budget)}><CalendarRange className="h-3.5 w-3.5 mr-1" /> Edit</Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDeleteBudget(budget.id)}><Trash2 className="h-3.5 w-3.5 mr-1" /> Delete</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-10">
              <Banknote className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">You haven't created any budgets yet.</p>
              <p className="text-sm text-muted-foreground">Get started by clicking the "Create New Budget" button above.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
