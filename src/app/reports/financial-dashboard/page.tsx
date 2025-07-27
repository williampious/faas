
'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DollarSign, TrendingUp, TrendingDown, FileText, BarChart2, Percent, PieChartIcon, Loader2, AlertTriangle, Filter, ClipboardList, ClipboardCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import type { OperationalTransaction } from '@/types/finance';
import { FARM_OPS_MODULES, OFFICE_OPS_MODULES } from '@/types/finance';
import { useRouter } from 'next/navigation';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { format, parseISO, subMonths } from 'date-fns';
import { useUserProfile } from '@/contexts/user-profile-context';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy, type QueryConstraint, doc, getDoc } from 'firebase/firestore';
import type { FarmingYear } from '@/types/season';
import type { Farm } from '@/types/farm';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';


interface MonthlyData {
  month: string;
  income: number;
  expense: number;
}

interface CategoryData {
  name: string;
  total: number;
  percentage: number;
  fill: string;
}

const PIE_CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--chart-1) / 0.7)",
  "hsl(var(--chart-2) / 0.7)",
];

const TRANSACTIONS_COLLECTION = 'transactions';
const FARMING_YEARS_COLLECTION = 'farmingYears';
type BudgetFilterType = 'all' | 'farmOps' | 'officeOps';

export default function FinancialDashboardPage() {
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [totalIncome, setTotalIncome] = useState(0);
  const [netProfitLoss, setNetProfitLoss] = useState(0);
  const [profitMargin, setProfitMargin] = useState(0);
  const [monthlyChartData, setMonthlyChartData] = useState<MonthlyData[]>([]);
  const [expenseBreakdownData, setExpenseBreakdownData] = useState<CategoryData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { userProfile, isLoading: isProfileLoading } = useUserProfile();
  const { toast } = useToast();
  
  const [farmProfile, setFarmProfile] = useState<Farm | null>(null);

  const [farmingYears, setFarmingYears] = useState<FarmingYear[]>([]);
  const [selectedYearId, setSelectedYearId] = useState<string>('last12months');
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>('all');
  const [budgetFilter, setBudgetFilter] = useState<BudgetFilterType>('all');

  useEffect(() => {
    if (!userProfile?.farmId) return;

    const fetchFarmAndYearData = async () => {
        try {
            const farmDocRef = doc(db, 'farms', userProfile.farmId);
            const farmDocSnap = await getDoc(farmDocRef);
            if(farmDocSnap.exists()) {
                setFarmProfile(farmDocSnap.data() as Farm);
            }

            const yearsQuery = query(collection(db, FARMING_YEARS_COLLECTION), where("farmId", "==", userProfile.farmId), orderBy("startDate", "desc"));
            const yearsSnapshot = await getDocs(yearsQuery);
            const fetchedYears = yearsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FarmingYear));
            setFarmingYears(fetchedYears);
        } catch (err: any) {
            console.error("Error fetching farm/year data:", err);
            toast({ title: "Could not load filter data", description: err.message, variant: "destructive" });
        }
    };
    fetchFarmAndYearData();
  }, [userProfile, toast]);

  useEffect(() => {
    if (isProfileLoading) return;
    if (!userProfile?.farmId) {
      setError("Farm information not available. Cannot load financial data.");
      setIsLoading(false);
      return;
    }

    const fetchAndProcessTransactions = async () => {
      setIsLoading(true);
      setError(null);

      try {
        let startDate: Date;
        let endDate: Date;

        if (selectedYearId === 'last12months') {
            endDate = new Date();
            startDate = subMonths(endDate, 11);
            startDate.setDate(1); 
        } else {
            const selectedYear = farmingYears.find(y => y.id === selectedYearId);
            if (!selectedYear) { setIsLoading(false); return; }
            if (selectedSeasonId === 'all' || !selectedYear.seasons) {
                startDate = parseISO(selectedYear.startDate);
                endDate = parseISO(selectedYear.endDate);
            } else {
                const selectedSeason = selectedYear.seasons.find(s => s.id === selectedSeasonId);
                if (!selectedSeason) { setIsLoading(false); return; }
                startDate = parseISO(selectedSeason.startDate);
                endDate = parseISO(selectedSeason.endDate);
            }
        }
        
        const queryConstraints: QueryConstraint[] = [
            where("farmId", "==", userProfile.farmId),
            where("date", ">=", format(startDate, 'yyyy-MM-dd')),
            where("date", "<=", format(endDate, 'yyyy-MM-dd'))
        ];

        if (budgetFilter === 'farmOps') {
            queryConstraints.push(where("linkedModule", "in", FARM_OPS_MODULES));
        } else if (budgetFilter === 'officeOps') {
            queryConstraints.push(where("linkedModule", "in", OFFICE_OPS_MODULES));
        }

        const transQuery = query(collection(db, TRANSACTIONS_COLLECTION), ...queryConstraints);
        const querySnapshot = await getDocs(transQuery);
        const transactions = querySnapshot.docs.map(doc => doc.data() as OperationalTransaction);
        
        const monthlyAggregates: { [key: string]: { income: number; expense: number } } = {};
        const expenseByCategory: { [key: string]: number } = {};
        
        transactions.forEach(t => {
          const monthKey = format(parseISO(t.date), 'yyyy-MM');
          if (!monthlyAggregates[monthKey]) {
            monthlyAggregates[monthKey] = { income: 0, expense: 0 };
          }
          if (t.type === 'Income') {
            monthlyAggregates[monthKey].income += t.amount;
          } else {
            monthlyAggregates[monthKey].expense += t.amount;
            if (!expenseByCategory[t.category]) expenseByCategory[t.category] = 0;
            expenseByCategory[t.category] += t.amount;
          }
        });
        
        const currentTotalIncome = transactions.filter(t=>t.type==='Income').reduce((sum, t) => sum + t.amount, 0);
        const currentTotalExpenses = transactions.filter(t=>t.type==='Expense').reduce((sum, t) => sum + t.amount, 0);
        const currentNetProfitLoss = currentTotalIncome - currentTotalExpenses;
        const currentProfitMargin = currentTotalIncome > 0 ? (currentNetProfitLoss / currentTotalIncome) * 100 : 0;

        setTotalIncome(currentTotalIncome);
        setTotalExpenses(currentTotalExpenses);
        setNetProfitLoss(currentNetProfitLoss);
        setProfitMargin(currentProfitMargin);
        
        const monthlyData = Object.entries(monthlyAggregates)
          .map(([key, value]) => ({ month: format(parseISO(`${key}-01`), 'MMM yy'), income: value.income, expense: value.expense }))
          .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());
          
        const categoryData = Object.entries(expenseByCategory)
          .map(([name, total], index) => ({ name, total, percentage: currentTotalExpenses > 0 ? (total / currentTotalExpenses) * 100 : 0, fill: PIE_CHART_COLORS[index % PIE_CHART_COLORS.length] }))
          .sort((a, b) => b.total - a.total);
        
        setMonthlyChartData(monthlyData);
        setExpenseBreakdownData(categoryData);

      } catch(err: any) {
        console.error("Error fetching financial data:", err);
        let message = `Failed to load financial data. Please check your internet connection.`;
        if (err.message && (err.message.toLowerCase().includes('requires an index') || err.message.toLowerCase().includes('permission-denied') || err.message.toLowerCase().includes('backend didn\'t respond'))) {
            message = "Failed to load financial data. This is likely because a required Firestore index is missing or your internet connection is unstable. A missing index can cause queries to time out. Please check the developer console for a link to create it, or refer to the README for instructions on required indexes."
        }
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAndProcessTransactions();
  }, [userProfile, isProfileLoading, farmingYears, selectedYearId, selectedSeasonId, budgetFilter]);

  const handleYearChange = (yearId: string) => {
    setSelectedYearId(yearId);
    setSelectedSeasonId('all'); // Reset season when year changes
  };

  const selectedYearData = farmingYears.find(y => y.id === selectedYearId);
  const formatCurrency = (amount: number) => {
    const currencyCode = farmProfile?.currency || 'GHS';
    // A simple mapping for locale. For a real app, this would be more robust.
    const locale = currencyCode === 'USD' ? 'en-US' : 'en-GH';
    return new Intl.NumberFormat(locale, { style: 'currency', currency: currencyCode }).format(amount);
  };
  
  const getSelectedPeriodDescription = () => {
    let budgetDesc = 'All Operations / ';
    if (budgetFilter === 'farmOps') budgetDesc = 'Farm Operations / ';
    if (budgetFilter === 'officeOps') budgetDesc = 'Office Operations / ';

    if (selectedYearId === 'last12months') return `${budgetDesc}Last 12 Months`;
    if (!selectedYearData) return "Selected Period";
    if (selectedSeasonId === 'all') return `${budgetDesc}${selectedYearData.name}`;
    const season = selectedYearData.seasons.find(s => s.id === selectedSeasonId);
    return season ? `${budgetDesc}${selectedYearData.name} - ${season.name}` : `${budgetDesc}${selectedYearData.name}`;
  };

  if (isProfileLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-12rem)]">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
        <p className="ml-3 text-lg text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (error) {
     return (
        <div className="container mx-auto py-10">
         <Card className="w-full max-w-xl mx-auto text-center shadow-lg">
            <CardHeader><CardTitle className="flex items-center justify-center text-xl text-destructive"><AlertTriangle className="mr-2 h-6 w-6" /> Financial Report Error</CardTitle></CardHeader>
            <CardContent><p className="text-muted-foreground mb-2">{error}</p></CardContent>
         </Card>
        </div>
     );
  }

  return (
    <div>
      <PageHeader
        title="Financial Dashboard"
        icon={FileText}
        description={`Displaying financial performance for: ${getSelectedPeriodDescription()}`}
        action={
          <div className="flex gap-2">
             <Button variant="outline" onClick={() => router.push('/reports/transactions')}>
                <ClipboardList className="mr-2 h-4 w-4" /> View Ledger
            </Button>
            <Button variant="outline" onClick={() => router.push('/reports/profitability')}>
                <ClipboardCheck className="mr-2 h-4 w-4" /> Profitability Report
            </Button>
            <Button onClick={() => router.push('/reports/budgeting')}>Manage Budgets</Button>
          </div>
        }
      />
      
      <Card className="mb-6 shadow-md">
        <CardHeader className='pb-2'>
          <CardTitle className="text-lg flex items-center"><Filter className="mr-2 h-5 w-5"/>Filter Report</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row gap-4 pt-2">
          <div className="flex-1">
            <Label htmlFor="budget-filter">Budget Type</Label>
            <Select value={budgetFilter} onValueChange={(value) => setBudgetFilter(value as BudgetFilterType)}>
              <SelectTrigger id="budget-filter"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Transactions</SelectItem>
                <SelectItem value="farmOps">Farm Operations</SelectItem>
                <SelectItem value="officeOps">Office Management</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <Label htmlFor="year-filter">Farming Year</Label>
            <Select value={selectedYearId} onValueChange={handleYearChange}><SelectTrigger id="year-filter"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="last12months">Last 12 Months</SelectItem>
                {farmingYears.map(year => <SelectItem key={year.id} value={year.id}>{year.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <Label htmlFor="season-filter">Season</Label>
            <Select value={selectedSeasonId} onValueChange={setSelectedSeasonId} disabled={selectedYearId === 'last12months' || !selectedYearData}>
              <SelectTrigger id="season-filter"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Seasons</SelectItem>
                {selectedYearData?.seasons.map(season => <SelectItem key={season.id} value={season.id}>{season.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
      
      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-12 w-12 text-primary animate-spin" />
          <p className="ml-3 text-lg text-muted-foreground">Loading financial data for selected period...</p>
        </div>
      ) : (
      <>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="shadow-lg hover:shadow-xl transition-shadow bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">Total Income</CardTitle><TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" /></CardHeader>
            <CardContent><div className="text-2xl font-bold text-green-800 dark:text-green-200">{formatCurrency(totalIncome)}</div></CardContent>
          </Card>
          <Card className="shadow-lg hover:shadow-xl transition-shadow bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium text-red-700 dark:text-red-300">Total Expenses</CardTitle><TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" /></CardHeader>
            <CardContent><div className="text-2xl font-bold text-red-800 dark:text-red-200">{formatCurrency(totalExpenses)}</div></CardContent>
          </Card>
          <Card className={`shadow-lg hover:shadow-xl transition-shadow ${netProfitLoss >= 0 ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700' : 'bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-700'}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className={`text-sm font-medium ${netProfitLoss >=0 ? 'text-blue-700 dark:text-blue-300' : 'text-orange-700 dark:text-orange-300'}`}>Net Profit / Loss</CardTitle><DollarSign className={`h-5 w-5 ${netProfitLoss >=0 ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'}`} /></CardHeader>
            <CardContent><div className={`text-2xl font-bold ${netProfitLoss >=0 ? 'text-blue-800 dark:text-blue-200' : 'text-orange-800 dark:text-orange-200'}`}>{formatCurrency(netProfitLoss)}</div></CardContent>
          </Card>
          <Card className={`shadow-lg hover:shadow-xl transition-shadow ${profitMargin >= 0 ? 'bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-700' : 'bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-700'}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className={`text-sm font-medium ${profitMargin >=0 ? 'text-purple-700 dark:text-purple-300' : 'text-orange-700 dark:text-orange-300'}`}>Profit Margin</CardTitle><Percent className={`h-5 w-5 ${profitMargin >=0 ? 'text-purple-600 dark:text-purple-400' : 'text-orange-600 dark:text-orange-400'}`} /></CardHeader>
            <CardContent><div className={`text-2xl font-bold ${profitMargin >=0 ? 'text-purple-800 dark:text-purple-200' : 'text-orange-800 dark:text-orange-200'}`}>{profitMargin.toFixed(1)}%</div></CardContent>
          </Card>
        </div>
        <Separator className="my-8" />
        <div className="grid lg:grid-cols-2 gap-8">
          <Card><CardHeader><CardTitle>Monthly Income vs. Expense</CardTitle><CardDescription>A visual summary of your cash flow for the selected period.</CardDescription></CardHeader>
            <CardContent>
              {monthlyChartData.length > 0 ? (<div className="w-full h-[300px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={monthlyChartData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} /><YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value: number) => formatCurrency(value)} /><Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)'}} formatter={(value: number) => formatCurrency(value)} /><Legend /><Bar dataKey="income" fill="hsl(var(--chart-2))" name="Income" radius={[4, 4, 0, 0]} /><Bar dataKey="expense" fill="hsl(var(--chart-1))" name="Expense" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div>
              ) : (<div className="text-center py-10"><BarChart2 className="mx-auto h-12 w-12 text-muted-foreground" /><p className="mt-4 text-muted-foreground">No financial data available for monthly trends in this period.</p></div>)}
            </CardContent>
          </Card>
          <Card><CardHeader><CardTitle>Expense Breakdown by Category</CardTitle><CardDescription>See where your money is going across different operational categories.</CardDescription></CardHeader>
            <CardContent>
            {expenseBreakdownData.length > 0 ? (<div className="w-full h-[300px]"><ResponsiveContainer width="100%" height="100%"><PieChart><Tooltip content={({ active, payload }) => { if (active && payload && payload.length) { const data = payload[0].payload as CategoryData; return (<div className="rounded-lg border bg-background p-2 shadow-sm"><div className="grid grid-cols-2 gap-2"><div className="flex flex-col"><span className="text-[0.70rem] uppercase text-muted-foreground">Category</span><span className="font-bold text-muted-foreground">{data.name}</span></div><div className="flex flex-col"><span className="text-[0.70rem] uppercase text-muted-foreground">Amount</span><span className="font-bold">{formatCurrency(data.total)}</span></div><div className="flex flex-col"><span className="text-[0.70rem] uppercase text-muted-foreground">Percentage</span><span className="font-bold">{data.percentage.toFixed(1)}%</span></div></div></div>); } return null; }} /><Pie data={expenseBreakdownData} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`} outerRadius={100} dataKey="total" nameKey="name">{expenseBreakdownData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.fill} />))}</Pie><Legend iconSize={12} /></PieChart></ResponsiveContainer></div>
            ) : (<div className="text-center py-10"><PieChartIcon className="mx-auto h-12 w-12 text-muted-foreground" /><p className="mt-4 text-muted-foreground">No expense data available to display breakdown.</p></div>)}
            </CardContent>
          </Card>
        </div>
        <Card className="mt-6 bg-muted/30 p-4">
          <CardHeader className="p-0 pb-2"><CardTitle className="text-base font-semibold text-muted-foreground">About This Dashboard</CardTitle></CardHeader>
          <CardContent className="p-0 text-xs text-muted-foreground space-y-1">
              <p>&bull; This dashboard provides a financial summary based on data stored centrally in Firestore.</p>
              <p>&bull; Income and expense data is aggregated from all the operational modules (Land Prep, Planting, Harvesting, etc.).</p>
              <p>&bull; As you log costs and sales across the app, this dashboard will update automatically to reflect the changes.</p>
          </CardContent>
        </Card>
      </>
      )}
    </div>
  );
}
