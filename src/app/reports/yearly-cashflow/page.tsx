
'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, Loader2, AlertTriangle, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, parseISO, isWithinInterval } from 'date-fns';
import { useUserProfile } from '@/contexts/user-profile-context';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import type { FarmingYear } from '@/types/season';
import type { OperationalTransaction } from '@/types/finance';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';


interface YearlyData {
  name: string;
  income: number;
  expense: number;
  net: number;
}

const TRANSACTIONS_COLLECTION = 'transactions';
const FARMING_YEARS_COLLECTION = 'farmingYears';

export default function YearlyCashflowReportPage() {
  const [reportData, setReportData] = useState<YearlyData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { userProfile, isLoading: isProfileLoading } = useUserProfile();

  useEffect(() => {
    if (isProfileLoading) return;
    if (!userProfile?.farmId) {
      setError("Farm information not available. Cannot generate report.");
      setIsLoading(false);
      return;
    }

    const generateReport = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const farmId = userProfile.farmId;

        // 1. Fetch all farming years
        const yearsQuery = query(collection(db, FARMING_YEARS_COLLECTION), where("farmId", "==", farmId), orderBy("startDate", "asc"));
        const yearsSnapshot = await getDocs(yearsQuery);
        const years = yearsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FarmingYear));

        if (years.length === 0) {
            setReportData([]);
            setIsLoading(false);
            return;
        }

        // 2. Fetch all transactions for the farm
        const transQuery = query(collection(db, TRANSACTIONS_COLLECTION), where("farmId", "==", farmId));
        const transSnapshot = await getDocs(transQuery);
        const transactions = transSnapshot.docs.map(doc => doc.data() as OperationalTransaction);

        // 3. Process data
        const yearlyAggregates = new Map<string, { income: number; expense: number }>();

        transactions.forEach(t => {
            const transactionDate = parseISO(t.date);
            const associatedYear = years.find(y => 
                isWithinInterval(transactionDate, { start: parseISO(y.startDate), end: parseISO(y.endDate) })
            );

            if (associatedYear) {
                if (!yearlyAggregates.has(associatedYear.id)) {
                    yearlyAggregates.set(associatedYear.id, { income: 0, expense: 0 });
                }
                const yearData = yearlyAggregates.get(associatedYear.id)!;
                if (t.type === 'Income') {
                    yearData.income += t.amount;
                } else {
                    yearData.expense += t.amount;
                }
            }
        });

        const formattedData = years.map(year => {
            const data = yearlyAggregates.get(year.id) || { income: 0, expense: 0 };
            return {
                name: year.name,
                income: data.income,
                expense: data.expense,
                net: data.income - data.expense,
            };
        });

        setReportData(formattedData);

      } catch (err: any) {
        console.error("Error generating yearly report:", err);
        setError(`Failed to generate report: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    generateReport();
  }, [userProfile, isProfileLoading]);

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS' }).format(amount);

  if (isProfileLoading || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-12rem)]">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
        <p className="ml-3 text-lg text-muted-foreground">Generating yearly report...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-10">
        <Card className="w-full max-w-lg mx-auto text-center shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center justify-center text-xl text-destructive">
              <AlertTriangle className="mr-2 h-6 w-6" /> Report Error
            </CardTitle>
          </CardHeader>
          <CardContent><p className="text-muted-foreground mb-2">{error}</p></CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Yearly Cash Flow Report"
        icon={BarChart3}
        description="Compare income, expenses, and net profit/loss across your defined farming years."
        action={
          <Button variant="outline" onClick={() => router.push('/reports/financial-dashboard')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Financial Dashboard
          </Button>
        }
      />

      <Card className="mb-6 shadow-lg">
        <CardHeader>
          <CardTitle>Year-over-Year Performance</CardTitle>
          <CardDescription>A visual comparison of your financial performance for each farming year.</CardDescription>
        </CardHeader>
        <CardContent>
          {reportData.length > 0 ? (
            <div className="w-full h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={reportData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value: number) => formatCurrency(value)} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)' }}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Legend />
                  <Bar dataKey="income" fill="hsl(var(--chart-2))" name="Income" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expense" fill="hsl(var(--chart-1))" name="Expense" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-center py-10">
              <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">No data available for comparison.</p>
              <p className="text-sm text-muted-foreground">
                Ensure you have created Farming Years and logged financial transactions within those periods.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Detailed Breakdown</CardTitle>
          <CardDescription>A table view of your financial performance per year.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Farming Year</TableHead>
                <TableHead className="text-right">Total Income</TableHead>
                <TableHead className="text-right">Total Expenses</TableHead>
                <TableHead className="text-right">Net Profit / Loss</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportData.map((year) => (
                <TableRow key={year.name}>
                  <TableCell className="font-medium">{year.name}</TableCell>
                  <TableCell className="text-right text-green-600">{formatCurrency(year.income)}</TableCell>
                  <TableCell className="text-right text-red-600">{formatCurrency(year.expense)}</TableCell>
                  <TableCell className={`text-right font-bold ${year.net >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                    {formatCurrency(year.net)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

    </div>
  );
}
