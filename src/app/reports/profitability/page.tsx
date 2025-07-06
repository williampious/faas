
'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ClipboardCheck, ArrowLeft, Loader2, AlertTriangle, ArrowUp, ArrowDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { format, parseISO, isValid } from 'date-fns';
import { useUserProfile } from '@/contexts/user-profile-context';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy, type OrderByDirection } from 'firebase/firestore';
import type { HarvestingRecord } from '@/types/harvesting';
import { cn } from '@/lib/utils';

const HARVESTING_RECORDS_COLLECTION = 'harvestingRecords';
type SortableKeys = 'dateHarvested' | 'cropType' | 'totalSalesIncome' | 'totalHarvestCost' | 'netProfit';


export default function ProfitabilityReportPage() {
  const router = useRouter();
  const { userProfile, isLoading: isProfileLoading } = useUserProfile();
  const [records, setRecords] = useState<(HarvestingRecord & { netProfit: number })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: SortableKeys, direction: OrderByDirection }>({ key: 'dateHarvested', direction: 'desc' });

  useEffect(() => {
    if (isProfileLoading) return;
    if (!userProfile?.farmId) {
      setError("Farm information is not available. Cannot load report.");
      setIsLoading(false);
      return;
    }

    const fetchRecords = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const recordsQuery = query(
          collection(db, HARVESTING_RECORDS_COLLECTION),
          where("farmId", "==", userProfile.farmId),
          orderBy(sortConfig.key === 'netProfit' ? 'dateHarvested' : sortConfig.key, sortConfig.direction) // Firestore can't sort by calculated field
        );
        const querySnapshot = await getDocs(recordsQuery);
        let fetchedRecords = querySnapshot.docs.map(doc => {
          const data = doc.data() as HarvestingRecord;
          const netProfit = (data.totalSalesIncome || 0) - (data.totalHarvestCost || 0);
          return { id: doc.id, ...data, netProfit };
        });

        // Manual sort for netProfit
        if (sortConfig.key === 'netProfit') {
          fetchedRecords.sort((a, b) => {
            if (sortConfig.direction === 'asc') {
              return a.netProfit - b.netProfit;
            }
            return b.netProfit - a.netProfit;
          });
        }
        
        setRecords(fetchedRecords);

      } catch (err: any) {
        console.error("Error fetching profitability data:", err);
        setError(`Failed to fetch report data: ${err.message}. An index might be required for sorting.`);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRecords();
  }, [userProfile, isProfileLoading, sortConfig]);
  
  const handleSort = (key: SortableKeys) => {
    let direction: OrderByDirection = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: SortableKeys) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? <ArrowUp className="h-4 w-4 ml-2" /> : <ArrowDown className="h-4 w-4 ml-2" />;
  };

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS' }).format(amount);

  if (isProfileLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-12rem)]">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
      </div>
    );
  }

  if (error && !isLoading) {
    return (
      <div className="container mx-auto py-10">
        <Card className="w-full max-w-lg mx-auto text-center shadow-lg">
          <CardHeader><CardTitle className="flex items-center justify-center text-xl text-destructive"><AlertTriangle className="mr-2 h-6 w-6" /> Loading Error</CardTitle></CardHeader>
          <CardContent><p className="text-muted-foreground mb-2">{error}</p></CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Profitability Per Harvest Report"
        icon={ClipboardCheck}
        description="Analyze the profitability of each harvest record based on logged costs and sales."
        action={
          <Button variant="outline" onClick={() => router.push('/reports/financial-dashboard')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Financial Dashboard
          </Button>
        }
      />
      
      <Card className="shadow-lg">
        <CardHeader>
            <CardTitle>Harvest Analysis</CardTitle>
            <CardDescription>
                {isLoading ? "Loading report data..." : 
                 records.length > 0 ? `Showing profitability for ${records.length} harvest records.` 
                                    : "No harvest records with cost and sales data found."}
            </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
             <div className="flex justify-center items-center py-20">
              <Loader2 className="h-12 w-12 text-primary animate-spin" />
             </div>
          ) : records.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('dateHarvested')}>Date {getSortIcon('dateHarvested')}</TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('cropType')}>Crop {getSortIcon('cropType')}</TableHead>
                  <TableHead>Yield</TableHead>
                  <TableHead className="text-right cursor-pointer" onClick={() => handleSort('totalSalesIncome')}>Income {getSortIcon('totalSalesIncome')}</TableHead>
                  <TableHead className="text-right cursor-pointer" onClick={() => handleSort('totalHarvestCost')}>Cost {getSortIcon('totalHarvestCost')}</TableHead>
                  <TableHead className="text-right cursor-pointer" onClick={() => handleSort('netProfit')}>Net Profit {getSortIcon('netProfit')}</TableHead>
                  <TableHead className="text-right">Cost Per Unit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((record) => {
                    const costPerUnit = record.yieldQuantity > 0 ? record.totalHarvestCost / record.yieldQuantity : 0;
                    return (
                        <TableRow key={record.id}>
                            <TableCell>{isValid(parseISO(record.dateHarvested)) ? format(parseISO(record.dateHarvested), 'PP') : 'Invalid Date'}</TableCell>
                            <TableCell className="font-medium">{record.cropType} {record.variety && `(${record.variety})`}</TableCell>
                            <TableCell>{record.yieldQuantity} {record.yieldUnit}</TableCell>
                            <TableCell className="text-right text-green-600">{formatCurrency(record.totalSalesIncome)}</TableCell>
                            <TableCell className="text-right text-red-600">{formatCurrency(record.totalHarvestCost)}</TableCell>
                            <TableCell className={cn("text-right font-bold", record.netProfit >= 0 ? 'text-blue-600' : 'text-orange-600')}>
                                {formatCurrency(record.netProfit)}
                            </TableCell>
                            <TableCell className="text-right">{formatCurrency(costPerUnit)} / {record.yieldUnit}</TableCell>
                        </TableRow>
                    );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-10">
              <ClipboardCheck className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">No harvest data found to generate this report.</p>
              <p className="text-sm text-muted-foreground">
                Log harvest activities with costs and sales in the Farm Management module.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
