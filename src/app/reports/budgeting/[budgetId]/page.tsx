
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
import { Banknote, ArrowLeft, PlusCircle, Edit2, Trash2, FolderKanban, DollarSign } from 'lucide-react';
import { format, parseISO, isValid, isWithinInterval } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import type { Budget, BudgetCategory } from '@/types/budget';
import type { OperationalTransaction } from '@/types/finance';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';

const LOCAL_STORAGE_KEY_BUDGETS = 'farmBudgets_v1';
const LOCAL_STORAGE_KEY_TRANSACTIONS = 'farmTransactions_v1';

const categoryFormSchema = z.object({
  name: z.string().min(2, { message: "Category name must be at least 2 characters." }).max(100),
  budgetedAmount: z.preprocess(
    (val) => parseFloat(String(val)),
    z.number().min(0, "Budgeted amount cannot be negative.")
  ),
});
type CategoryFormValues = z.infer<typeof categoryFormSchema>;

const CATEGORY_FORM_ID = 'category-form';

export default function BudgetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const budgetId = params.budgetId as string;
  const { toast } = useToast();

  const [budget, setBudget] = useState<Budget | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<BudgetCategory | null>(null);

  const categoryForm = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: { name: '', budgetedAmount: 0 },
  });

  const loadBudget = useCallback(() => {
    if (!budgetId || !isMounted) return;
    setIsLoading(true);
    
    const storedBudgets = localStorage.getItem(LOCAL_STORAGE_KEY_BUDGETS);
    const storedTransactions = localStorage.getItem(LOCAL_STORAGE_KEY_TRANSACTIONS);

    if (storedBudgets) {
      const budgets: Budget[] = JSON.parse(storedBudgets);
      const currentBudget = budgets.find(b => b.id === budgetId);
      
      if (currentBudget) {
        let allTransactions: OperationalTransaction[] = storedTransactions ? JSON.parse(storedTransactions) : [];
        
        const budgetInterval = {
          start: parseISO(currentBudget.startDate),
          end: parseISO(currentBudget.endDate)
        };
        
        const relevantExpenses = allTransactions
          .filter(t => 
            t.type === 'Expense' && 
            isWithinInterval(parseISO(t.date), budgetInterval)
          );
        
        const actualSpending = relevantExpenses.reduce((sum, t) => sum + (t.amount || 0), 0);
        const totalBudgeted = currentBudget.categories.reduce((sum, cat) => sum + (cat.budgetedAmount || 0), 0);

        currentBudget.totalBudgetedAmount = totalBudgeted;
        currentBudget.totalActualSpending = actualSpending;
        currentBudget.totalVariance = totalBudgeted - actualSpending;

        setBudget(currentBudget);
      } else {
        toast({ title: "Error", description: "Budget not found.", variant: "destructive" });
        router.push('/reports/budgeting');
      }
    } else {
      router.push('/reports/budgeting');
    }
    setIsLoading(false);
  }, [budgetId, router, toast, isMounted]);

  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  useEffect(() => {
    if (isMounted) {
      loadBudget();
    }
  }, [isMounted, loadBudget]);


  const saveBudgetsToLocalStorage = (updatedBudgets: Budget[]) => {
    localStorage.setItem(LOCAL_STORAGE_KEY_BUDGETS, JSON.stringify(updatedBudgets));
  };
  
  const updateBudgetInList = (updatedBudget: Budget) => {
    const storedBudgets = localStorage.getItem(LOCAL_STORAGE_KEY_BUDGETS);
    let budgets: Budget[] = storedBudgets ? JSON.parse(storedBudgets) : [];
    const budgetIndex = budgets.findIndex(b => b.id === updatedBudget.id);
    if (budgetIndex > -1) {
      budgets[budgetIndex] = updatedBudget;
    } else {
      budgets.push(updatedBudget); 
    }
    saveBudgetsToLocalStorage(budgets);
    loadBudget(); // Reload to recalculate totals
  };


  const handleCategorySubmit: SubmitHandler<CategoryFormValues> = (data) => {
    if (!budget) return;

    let updatedCategories: BudgetCategory[];
    if (editingCategory) {
      updatedCategories = budget.categories.map(cat =>
        cat.id === editingCategory.id ? { ...cat, ...data } : cat
      );
      toast({ title: "Category Updated", description: `Category "${data.name}" updated.` });
    } else {
      const newCategory: BudgetCategory = {
        id: crypto.randomUUID(),
        ...data,
        lineItems: [], 
      };
      updatedCategories = [...budget.categories, newCategory];
      toast({ title: "Category Added", description: `Category "${data.name}" added.` });
    }
    
    const newTotalBudgetedAmount = updatedCategories.reduce((sum, cat) => sum + (cat.budgetedAmount || 0), 0);
    const updatedBudget = { 
      ...budget, 
      categories: updatedCategories, 
      totalBudgetedAmount: newTotalBudgetedAmount,
      updatedAt: new Date().toISOString(),
    };
    updateBudgetInList(updatedBudget);
    
    setIsCategoryModalOpen(false);
    setEditingCategory(null);
    categoryForm.reset({ name: '', budgetedAmount: 0 });
  };

  const handleOpenCategoryModal = (categoryToEdit?: BudgetCategory) => {
    if (categoryToEdit) {
      setEditingCategory(categoryToEdit);
      categoryForm.reset({ name: categoryToEdit.name, budgetedAmount: categoryToEdit.budgetedAmount });
    } else {
      setEditingCategory(null);
      categoryForm.reset({ name: '', budgetedAmount: 0 });
    }
    setIsCategoryModalOpen(true);
  };

  const handleDeleteCategory = (categoryId: string) => {
    if (!budget) return;
    const categoryToDelete = budget.categories.find(c => c.id === categoryId);
    if (!categoryToDelete) return;

    const updatedCategories = budget.categories.filter(cat => cat.id !== categoryId);
    const newTotalBudgetedAmount = updatedCategories.reduce((sum, cat) => sum + (cat.budgetedAmount || 0), 0);
    const updatedBudget = { 
      ...budget, 
      categories: updatedCategories,
      totalBudgetedAmount: newTotalBudgetedAmount,
      updatedAt: new Date().toISOString(),
    };
    updateBudgetInList(updatedBudget);
    toast({ title: "Category Deleted", description: `Category "${categoryToDelete.name}" removed.`, variant: "destructive" });
  };

  if (!isMounted || isLoading || !budget) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-12rem)]">
        <Banknote className="h-12 w-12 text-primary animate-pulse" />
        <p className="ml-3 text-lg text-muted-foreground">Loading budget details...</p>
      </div>
    );
  }

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS' }).format(amount);
  const budgetUtilization = budget.totalBudgetedAmount > 0 ? ((budget.totalActualSpending || 0) / budget.totalBudgetedAmount) * 100 : 0;


  return (
    <div>
      <PageHeader
        title={`Budget: ${budget.name}`}
        icon={FolderKanban}
        description={`Manage categories for the period: ${format(parseISO(budget.startDate), 'PP')} - ${format(parseISO(budget.endDate), 'PP')}`}
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push('/reports/budgeting')}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Budgets List
            </Button>
            <Button onClick={() => handleOpenCategoryModal()}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Category
            </Button>
          </div>
        }
      />

      <Dialog open={isCategoryModalOpen} onOpenChange={(isOpen) => {
        setIsCategoryModalOpen(isOpen);
        if (!isOpen) { categoryForm.reset({ name: '', budgetedAmount: 0 }); setEditingCategory(null); }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCategory ? 'Edit Category' : 'Add New Category'}</DialogTitle>
          </DialogHeader>
          <Form {...categoryForm}>
            <form id={CATEGORY_FORM_ID} onSubmit={categoryForm.handleSubmit(handleCategorySubmit)} className="space-y-4 py-4">
              <FormField control={categoryForm.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>Category Name*</FormLabel><FormControl><Input placeholder="e.g., Planting Inputs" {...field} /></FormControl><FormMessage /></FormItem>)}
              />
              <FormField control={categoryForm.control} name="budgetedAmount" render={({ field }) => (
                <FormItem><FormLabel>Budgeted Amount (GHS)*</FormLabel><FormControl><Input type="number" step="0.01" placeholder="0.00" {...field} /></FormControl><FormMessage /></FormItem>)}
              />
            </form>
          </Form>
          <DialogFooter>
            <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
            <Button type="submit" form={CATEGORY_FORM_ID}>
              {editingCategory ? 'Save Changes' : 'Add Category'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
       <Card className="mb-6 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl">Budget vs. Actual Summary</CardTitle>
          <CardDescription>A high-level overview of this budget's performance.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                <p className="text-sm font-medium text-blue-600 dark:text-blue-300">Total Budgeted</p>
                <p className="text-2xl font-bold text-blue-800 dark:text-blue-200">{formatCurrency(budget.totalBudgetedAmount)}</p>
            </div>
            <div className="p-4 bg-green-50 dark:bg-green-900/30 rounded-lg">
                <p className="text-sm font-medium text-green-600 dark:text-green-300">Total Actual Spending</p>
                <p className="text-2xl font-bold text-green-800 dark:text-green-200">{formatCurrency(budget.totalActualSpending || 0)}</p>
            </div>
            <div className={`p-4 rounded-lg ${ (budget.totalVariance || 0) >= 0 ? 'bg-purple-50 dark:bg-purple-900/30' : 'bg-red-50 dark:bg-red-900/30'}`}>
                <p className={`text-sm font-medium ${ (budget.totalVariance || 0) >= 0 ? 'text-purple-600 dark:text-purple-300' : 'text-red-600 dark:text-red-300'}`}>
                    {(budget.totalVariance || 0) >= 0 ? 'Remaining Budget' : 'Over Budget'}
                </p>
                <p className={`text-2xl font-bold ${ (budget.totalVariance || 0) >= 0 ? 'text-purple-800 dark:text-purple-200' : 'text-red-800 dark:text-red-200'}`}>
                    {formatCurrency(budget.totalVariance || 0)}
                </p>
            </div>
          </div>
          <div className="space-y-2 pt-2">
            <Label>Budget Utilization</Label>
            <Progress value={budgetUtilization} className="h-4" />
            <p className="text-sm text-muted-foreground text-right">{budgetUtilization.toFixed(1)}% of budget used</p>
          </div>
        </CardContent>
      </Card>

      <Separator className="my-6" />

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Budget Categories</CardTitle>
          <CardDescription>
            {budget.categories.length > 0 ? "Manage your budget categories. Actual spending per category is coming soon." : "No categories added yet. Click 'Add Category' to start."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {budget.categories.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category Name</TableHead>
                  <TableHead className="text-right">Budgeted Amount</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {budget.categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell className="text-right">{formatCurrency(category.budgetedAmount)}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleOpenCategoryModal(category)}>
                        <Edit2 className="h-3.5 w-3.5 mr-1" /> Edit
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDeleteCategory(category.id)}>
                        <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-10">
              <DollarSign className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">This budget has no categories defined.</p>
              <p className="text-sm text-muted-foreground">Click "Add Category" to start populating your budget.</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card className="mt-6 bg-muted/30 p-4">
        <CardHeader className="p-0 pb-2">
            <CardTitle className="text-base font-semibold text-muted-foreground">Future Enhancement: Per-Category Analysis</CardTitle>
        </CardHeader>
        <CardContent className="p-0 text-xs text-muted-foreground space-y-1">
            <p>&bull; Currently, the dashboard shows the overall "Budget vs. Actual" for the entire budget period.</p>
            <p>&bull; The next major enhancement will be to track actual spending against each specific category you define (e.g., "Planting Inputs", "Labor").</p>
            <p>&bull; This will require a way to tag expenses from other modules to these specific budget categories when logging them.</p>
        </CardContent>
      </Card>
    </div>
  );
}
