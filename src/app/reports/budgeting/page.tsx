
'use client';

import { useState, useEffect } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Edit2, Trash2, Banknote, CalendarRange, ArrowLeft } from 'lucide-react';
import { format, parseISO, isValid, isAfter, isEqual } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import type { Budget } from '@/types/budget';
import { useRouter } from 'next/navigation';

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

const LOCAL_STORAGE_KEY = 'farmBudgets_v1';
const BUDGET_FORM_ID = 'budget-form';

export default function BudgetingPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const { toast } = useToast();
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();

  const form = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetFormSchema),
    defaultValues: {
      name: '',
      startDate: '',
      endDate: '',
      notes: '',
    },
  });

  useEffect(() => {
    setIsMounted(true);
    const storedBudgets = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (storedBudgets) {
      setBudgets(JSON.parse(storedBudgets));
    }
  }, []);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(budgets));
    }
  }, [budgets, isMounted]);

  const handleOpenModal = (budgetToEdit?: Budget) => {
    if (budgetToEdit) {
      setEditingBudget(budgetToEdit);
      form.reset({
        name: budgetToEdit.name,
        startDate: budgetToEdit.startDate,
        endDate: budgetToEdit.endDate,
        notes: budgetToEdit.notes || '',
      });
    } else {
      setEditingBudget(null);
      form.reset({
        name: '',
        startDate: '',
        endDate: '',
        notes: '',
      });
    }
    setIsModalOpen(true);
  };

  const onSubmit: SubmitHandler<BudgetFormValues> = (data) => {
    const now = new Date().toISOString();
    if (editingBudget) {
      const updatedBudget: Budget = {
        ...editingBudget,
        ...data,
        notes: data.notes || undefined,
        updatedAt: now,
      };
      setBudgets(budgets.map((b) => (b.id === editingBudget.id ? updatedBudget : b)));
      toast({ title: "Budget Updated", description: `Budget "${data.name}" has been updated.` });
    } else {
      const newBudget: Budget = {
        id: crypto.randomUUID(),
        ...data,
        notes: data.notes || undefined,
        categories: [], // Initialize with empty categories
        totalBudgetedAmount: 0, // Initial total
        createdAt: now,
        updatedAt: now,
      };
      setBudgets((prev) => [...prev, newBudget]);
      toast({ title: "Budget Created", description: `Budget "${data.name}" has been created.` });
    }
    setIsModalOpen(false);
    setEditingBudget(null);
    form.reset();
  };

  const handleDeleteBudget = (id: string) => {
    const budgetToDelete = budgets.find(b => b.id === id);
    setBudgets(budgets.filter((b) => b.id !== id));
    toast({ title: "Budget Deleted", description: `Budget "${budgetToDelete?.name}" has been removed.`, variant: "destructive" });
  };

  if (!isMounted) {
    return (
       <div className="flex justify-center items-center min-h-[calc(100vh-12rem)]">
        <Banknote className="h-12 w-12 text-primary animate-pulse" />
        <p className="ml-3 text-lg text-muted-foreground">Loading budgeting tools...</p>
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
            <DialogDescription>
              {editingBudget ? 'Update the details for this budget.' : 'Define the name and timeframe for your new budget.'}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-grow overflow-y-auto pr-2 py-4">
            <Form {...form}>
              <form id={BUDGET_FORM_ID} onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem><FormLabel>Budget Name*</FormLabel><FormControl><Input placeholder="e.g., 2024 Maize Season" {...field} /></FormControl><FormMessage /></FormItem>)}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="startDate" render={({ field }) => (
                    <FormItem><FormLabel>Start Date*</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)}
                  />
                  <FormField control={form.control} name="endDate" render={({ field }) => (
                    <FormItem><FormLabel>End Date*</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)}
                  />
                </div>
                <FormField control={form.control} name="notes" render={({ field }) => (
                  <FormItem><FormLabel>Notes (Optional)</FormLabel><FormControl><Textarea placeholder="Any additional details or goals for this budget" {...field} /></FormControl><FormMessage /></FormItem>)}
                />
                {/* Categories and Line Items will be added here in the next step */}
                <Card className="mt-4 bg-muted/30 p-3">
                    <CardDescription className="text-xs text-muted-foreground">
                        Detailed budget categories and line items will be configurable after creating the initial budget shell. This feature is coming soon.
                    </CardDescription>
                </Card>
              </form>
            </Form>
          </div>
          <DialogFooter className="py-4 px-6 border-t">
            <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
            <Button type="submit" form={BUDGET_FORM_ID}>
              {editingBudget ? 'Save Changes' : 'Create Budget'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Existing Budgets</CardTitle>
          <CardDescription>
            {budgets.length > 0 ? "Manage your farm budgets." : "No budgets created yet. Click 'Create New Budget' to start."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {budgets.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Budget Name</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Total Budgeted</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
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
                    <TableCell>GHS {budget.totalBudgetedAmount.toFixed(2)}</TableCell>
                    <TableCell>{isValid(parseISO(budget.createdAt)) ? format(parseISO(budget.createdAt), 'PP') : 'N/A'}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="sm" onClick={() => router.push(`/reports/budgeting/${budget.id}`)} disabled>
                        <Edit2 className="h-3.5 w-3.5 mr-1" /> View/Edit Details (Soon)
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleOpenModal(budget)}>
                        <CalendarRange className="h-3.5 w-3.5 mr-1" /> Edit Dates/Name
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDeleteBudget(budget.id)}>
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
              <p className="mt-4 text-muted-foreground">You haven't created any budgets yet.</p>
              <p className="text-sm text-muted-foreground">Get started by clicking the "Create New Budget" button above.</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card className="mt-6 bg-secondary/30 p-4">
        <CardHeader className="p-0 pb-2">
            <CardTitle className="text-lg font-semibold text-secondary-foreground">Budgeting Module - Next Steps</CardTitle>
        </CardHeader>
        <CardContent className="p-0 text-sm text-muted-foreground space-y-1">
            <p>&bull; <strong>Detailed Budget Breakdown:</strong> Soon, you'll be able to click "View/Edit Details" to add categories (e.g., Land Prep, Planting, Labor) and specific line items with budgeted amounts for each budget.</p>
            <p>&bull; <strong>Budget vs. Actuals:</strong> Future enhancements will link these budgets to actual income and expenses logged in other modules for variance analysis.</p>
            <p>&bull; <strong>Reporting:</strong> Generate reports to see how your spending aligns with your budget.</p>
        </CardContent>
      </Card>
    </div>
  );
}
