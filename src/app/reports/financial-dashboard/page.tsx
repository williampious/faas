
'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DollarSign, TrendingUp, TrendingDown, FileText, BarChart2, Percent } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import type { OperationalTransaction } from '@/types/finance';
import { useRouter } from 'next/navigation';

const LOCAL_STORAGE_KEY_TRANSACTIONS = 'farmTransactions_v1';

export default function FinancialDashboardPage() {
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [totalIncome, setTotalIncome] = useState(0);
  const [netProfitLoss, setNetProfitLoss] = useState(0);
  const [profitMargin, setProfitMargin] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    setIsLoading(true);
    
    const storedTransactions = localStorage.getItem(LOCAL_STORAGE_KEY_TRANSACTIONS);
    let currentTotalIncome = 0;
    let currentTotalExpenses = 0;

    if (storedTransactions) {
      const transactions: OperationalTransaction[] = JSON.parse(storedTransactions);
      
      currentTotalIncome = transactions
        .filter(t => t.type === 'Income')
        .reduce((sum, t) => sum + (t.amount || 0), 0);
      
      currentTotalExpenses = transactions
        .filter(t => t.type === 'Expense')
        .reduce((sum, t) => sum + (t.amount || 0), 0);
    }
    
    const currentNetProfitLoss = currentTotalIncome - currentTotalExpenses;
    const currentProfitMargin = currentTotalIncome > 0 ? (currentNetProfitLoss / currentTotalIncome) * 100 : 0;

    setTotalIncome(currentTotalIncome);
    setTotalExpenses(currentTotalExpenses);
    setNetProfitLoss(currentNetProfitLoss);
    setProfitMargin(currentProfitMargin);
    
    setIsLoading(false);

  }, [isMounted]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS' }).format(amount);
  };

  if (!isMounted || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-12rem)]">
        <BarChart2 className="h-12 w-12 text-primary animate-pulse" />
        <p className="ml-3 text-lg text-muted-foreground">Loading financial summary...</p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Financial Dashboard"
        icon={FileText}
        description="Overview of your farm's financial performance based on logged activities and sales."
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
            <p className="text-xs text-green-600 dark:text-green-400">Sum of all sales income from harvests</p>
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
              {netProfitLoss >= 0 ? 'Total Income minus Total Expenses' : 'Total Expenses exceed Total Income'}
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
              Shows profit as a percentage of total income.
            </p>
          </CardContent>
        </Card>

      </div>
      
      <Separator className="my-8" />

      <Card className="shadow-lg">
        <CardHeader>
            <CardTitle className="font-headline">Future Reporting Features</CardTitle>
            <CardDescription>We plan to expand this dashboard with more detailed reports and ratios.</CardDescription>
        </CardHeader>
        <CardContent>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Detailed breakdown of expenses by category (Material, Labor, etc.).</li>
                <li>Cost and income analysis per crop or per field/plot.</li>
                <li>Comparison of budgeted vs. actual expenses and income.</li>
                <li>Visual charts and graphs for trends over time.</li>
                <li>Liquidity ratios (like Current Ratio) once asset and liability tracking is added.</li>
                <li>Exportable reports (e.g., CSV, PDF).</li>
            </ul>
        </CardContent>
      </Card>

       <Card className="mt-6 bg-muted/30 p-4">
        <CardHeader className="p-0 pb-2">
            <CardTitle className="text-base font-semibold text-muted-foreground">About This Dashboard</CardTitle>
        </CardHeader>
        <CardContent className="p-0 text-xs text-muted-foreground space-y-1">
            <p>&bull; This dashboard provides a high-level financial summary based on data logged in the Farm Management modules.</p>
            <p>&bull; All data is currently sourced from your browser's local storage. Ensure you use the same browser to maintain data continuity.</p>
            <p>&bull; To add more data, log costs and sales in the "Harvesting" module, or costs in the "Land Preparation" module. Other modules will be integrated soon.</p>
        </CardContent>
      </Card>
    </div>
  );
}
