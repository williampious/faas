
'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DollarSign, TrendingUp, TrendingDown, FileText, BarChart2, Percent, PieChartIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import type { OperationalTransaction } from '@/types/finance';
import { useRouter } from 'next/navigation';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { ChartContainer } from '@/components/ui/chart';
import { format, parseISO } from 'date-fns';
import { useUserProfile } from '@/contexts/user-profile-context';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

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

export default function FinancialDashboardPage() {
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [totalIncome, setTotalIncome] = useState(0);
  const [netProfitLoss, setNetProfitLoss] = useState(0);
  const [profitMargin, setProfitMargin] = useState(0);
  const [monthlyChartData, setMonthlyChartData] = useState<MonthlyData[]>([]);
  const [expenseBreakdownData, setExpenseBreakdownData] = useState<CategoryData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { userProfile, isLoading: isProfileLoading } = useUserProfile();


  useEffect(() => {
    if (isProfileLoading) return;
    if (!userProfile?.farmId) {
      setIsLoading(false);
      return;
    }

    const fetchAndProcessTransactions = async () => {
      setIsLoading(true);
      let currentTotalIncome = 0;
      let currentTotalExpenses = 0;
      const monthlyAggregates: { [key: string]: { income: number; expense: number } } = {};
      const expenseByCategory: { [key: string]: number } = {};

      try {
        const transQuery = query(collection(db, TRANSACTIONS_COLLECTION), where("farmId", "==", userProfile.farmId));
        const querySnapshot = await getDocs(transQuery);
        const transactions = querySnapshot.docs.map(doc => doc.data() as OperationalTransaction);
        
        transactions.forEach(t => {
          const monthKey = format(parseISO(t.date), 'yyyy-MM');
          if (!monthlyAggregates[monthKey]) {
            monthlyAggregates[monthKey] = { income: 0, expense: 0 };
          }

          if (t.type === 'Income') {
            monthlyAggregates[monthKey].income += t.amount || 0;
          } else {
            monthlyAggregates[monthKey].expense += t.amount || 0;
            if (!expenseByCategory[t.category]) {
              expenseByCategory[t.category] = 0;
            }
            expenseByCategory[t.category] += t.amount || 0;
          }
        });
        
        currentTotalIncome = Object.values(monthlyAggregates).reduce((sum, m) => sum + m.income, 0);
        currentTotalExpenses = Object.values(monthlyAggregates).reduce((sum, m) => sum + m.expense, 0);

      } catch(err) {
        console.error("Error fetching financial data:", err);
      }

      const currentNetProfitLoss = currentTotalIncome - currentTotalExpenses;
      const currentProfitMargin = currentTotalIncome > 0 ? (currentNetProfitLoss / currentTotalIncome) * 100 : 0;

      setTotalIncome(currentTotalIncome);
      setTotalExpenses(currentTotalExpenses);
      setNetProfitLoss(currentNetProfitLoss);
      setProfitMargin(currentProfitMargin);
      
      const monthlyData = Object.entries(monthlyAggregates)
        .map(([key, value]) => ({
          month: format(parseISO(`${key}-01`), 'MMM yy'),
          income: value.income,
          expense: value.expense,
        }))
        .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());
        
      const categoryData = Object.entries(expenseByCategory)
        .map(([name, total], index) => ({ 
          name, 
          total,
          percentage: currentTotalExpenses > 0 ? (total / currentTotalExpenses) * 100 : 0,
          fill: PIE_CHART_COLORS[index % PIE_CHART_COLORS.length],
        }))
        .sort((a, b) => b.total - a.total);
      
      setMonthlyChartData(monthlyData);
      setExpenseBreakdownData(categoryData);
      
      setIsLoading(false);
    };

    fetchAndProcessTransactions();
  }, [userProfile, isProfileLoading]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS' }).format(amount);
  };
  
  if (isProfileLoading || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-12rem)]">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
        <p className="ml-3 text-lg text-muted-foreground">Loading financial summary...</p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Financial Dashboard"
        icon={FileText}
        description="Overview of your farm's financial performance based on centrally stored data."
        action={
            <Button onClick={() => router.push('/reports/budgeting')}>
                Manage Budgets
            </Button>
        }
      />

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="shadow-lg hover:shadow-xl transition-shadow bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">Total Income</CardTitle>
            <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-800 dark:text-green-200">{formatCurrency(totalIncome)}</div>
            <p className="text-xs text-green-600 dark:text-green-400">Sum of all sales income</p>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-700 dark:text-red-300">Total Expenses</CardTitle>
            <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-800 dark:text-red-200">{formatCurrency(totalExpenses)}</div>
            <p className="text-xs text-red-600 dark:text-red-400">Sum of all operational costs</p>
          </CardContent>
        </Card>

        <Card className={`shadow-lg hover:shadow-xl transition-shadow ${netProfitLoss >= 0 ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700' : 'bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-700'}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className={`text-sm font-medium ${netProfitLoss >=0 ? 'text-blue-700 dark:text-blue-300' : 'text-orange-700 dark:text-orange-300'}`}>Net Profit / Loss</CardTitle>
            <DollarSign className={`h-5 w-5 ${netProfitLoss >=0 ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netProfitLoss >=0 ? 'text-blue-800 dark:text-blue-200' : 'text-orange-800 dark:text-orange-200'}`}>{formatCurrency(netProfitLoss)}</div>
            <p className={`text-xs ${netProfitLoss >=0 ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'}`}>
              {netProfitLoss >= 0 ? 'Income minus Expenses' : 'Expenses exceed Income'}
            </p>
          </CardContent>
        </Card>
        
        <Card className={`shadow-lg hover:shadow-xl transition-shadow ${profitMargin >= 0 ? 'bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-700' : 'bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-700'}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className={`text-sm font-medium ${profitMargin >=0 ? 'text-purple-700 dark:text-purple-300' : 'text-orange-700 dark:text-orange-300'}`}>Profit Margin</CardTitle>
            <Percent className={`h-5 w-5 ${profitMargin >=0 ? 'text-purple-600 dark:text-purple-400' : 'text-orange-600 dark:text-orange-400'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${profitMargin >=0 ? 'text-purple-800 dark:text-purple-200' : 'text-orange-800 dark:text-orange-200'}`}>{profitMargin.toFixed(1)}%</div>
            <p className={`text-xs ${profitMargin >=0 ? 'text-purple-600 dark:text-purple-400' : 'text-orange-600 dark:text-orange-400'}`}>
              Profit as a percentage of income.
            </p>
          </CardContent>
        </Card>
      </div>
      
      <Separator className="my-8" />
      
      <div className="grid lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Income vs. Expense (Coming Soon)</CardTitle>
            <CardDescription>A visual summary of your cash flow over recent months.</CardDescription>
          </CardHeader>
          <CardContent>
            {monthlyChartData.length > 0 ? (
              <div className="text-center py-10 opacity-50">
                <BarChart2 className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-4 text-muted-foreground">Monthly Trend Chart is under development.</p>
              </div>
            ) : (
              <div className="text-center py-10">
                <BarChart2 className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-4 text-muted-foreground">No financial data available for monthly trends.</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle>Expense Breakdown by Category</CardTitle>
                <CardDescription>See where your money is going across different operational categories.</CardDescription>
            </CardHeader>
            <CardContent>
            {expenseBreakdownData.length > 0 ? (
                <div className="w-full h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Tooltip
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        const data = payload[0].payload as CategoryData;
                                        return (
                                        <div className="rounded-lg border bg-background p-2 shadow-sm">
                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="flex flex-col">
                                                    <span className="text-[0.70rem] uppercase text-muted-foreground">Category</span>
                                                    <span className="font-bold text-muted-foreground">{data.name}</span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[0.70rem] uppercase text-muted-foreground">Amount</span>
                                                    <span className="font-bold">{formatCurrency(data.total)}</span>
                                                </div>
                                                 <div className="flex flex-col">
                                                    <span className="text-[0.70rem] uppercase text-muted-foreground">Percentage</span>
                                                    <span className="font-bold">{data.percentage.toFixed(1)}%</span>
                                                </div>
                                            </div>
                                        </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            <Pie
                                data={expenseBreakdownData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                                outerRadius={100}
                                dataKey="total"
                                nameKey="name"
                            >
                                {expenseBreakdownData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                            </Pie>
                            <Legend iconSize={12} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            ) : (
                <div className="text-center py-10">
                    <PieChartIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                    <p className="mt-4 text-muted-foreground">No expense data available to display breakdown.</p>
                </div>
            )}
            </CardContent>
        </Card>
      </div>

       <Card className="mt-6 bg-muted/30 p-4">
        <CardHeader className="p-0 pb-2">
            <CardTitle className="text-base font-semibold text-muted-foreground">About This Dashboard</CardTitle>
        </CardHeader>
        <CardContent className="p-0 text-xs text-muted-foreground space-y-1">
            <p>&bull; This dashboard provides a financial summary based on data stored centrally in Firestore.</p>
            <p>&bull; Income and expense data is aggregated from all the operational modules (Land Prep, Planting, Harvesting, etc.).</p>
            <p>&bull; As you log costs and sales across the app, this dashboard will update automatically to reflect the changes.</p>
        </CardContent>
      </Card>
    </div>
  );
}
