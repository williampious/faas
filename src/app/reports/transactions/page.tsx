
'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ClipboardList, ArrowLeft, Loader2, AlertTriangle, ArrowUp, ArrowDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { format, parseISO, isValid } from 'date-fns';
import { useUserProfile } from '@/contexts/user-profile-context';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy, type OrderByDirection } from 'firebase/firestore';
import type { OperationalTransaction } from '@/types/finance';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const TRANSACTIONS_COLLECTION = 'transactions';
type SortableKeys = 'date' | 'category' | 'linkedModule' | 'amount';


export default function TransactionsLedgerPage() {
  const router = useRouter();
  const { userProfile, isLoading: isProfileLoading } = useUserProfile();
  const [transactions, setTransactions] = useState<OperationalTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: SortableKeys, direction: OrderByDirection }>({ key: 'date', direction: 'desc' });
  const tenantId = userProfile?.tenantId;

  useEffect(() => {
    if (isProfileLoading) return;
    if (!tenantId) {
      setError("Farm information is not available. Cannot load transactions.");
      setIsLoading(false);
      return;
    }

    const fetchTransactions = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const transQuery = query(
          collection(db, `tenants/${tenantId}/${TRANSACTIONS_COLLECTION}`),
          orderBy(sortConfig.key, sortConfig.direction)
        );
        const querySnapshot = await getDocs(transQuery);
        const fetchedTransactions = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as OperationalTransaction[];
        setTransactions(fetchedTransactions);
      } catch (err: any) {
        console.error("Error fetching transactions:", err);
        let message = `Failed to fetch transactions. This may be a permissions issue.`;
        if (err.code === 'failed-precondition' || err.message?.toLowerCase().includes('requires an index')) {
          message = `Failed to sort transactions by '${sortConfig.key}'. This is because a required Firestore index is missing. Please create the index in your Firebase Console for the 'transactions' collection as detailed in the README.md file.`
        }
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTransactions();
  }, [tenantId, isProfileLoading, sortConfig]);
  
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

  if (error && !isLoading) { // Show error only when not loading
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
        title="Transaction Ledger"
        icon={ClipboardList}
        description="A complete record of all income and expense transactions across your farm."
        action={
          <Button variant="outline" onClick={() => router.push('/reports/financial-dashboard')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Financial Dashboard
          </Button>
        }
      />
      
      <Card className="shadow-lg">
        <CardContent className="pt-6">
          {isLoading ? (
             <div className="flex justify-center items-center py-20">
              <Loader2 className="h-12 w-12 text-primary animate-spin" />
             </div>
          ) : transactions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('date')}>Date {getSortIcon('date')}</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('category')}>Category {getSortIcon('category')}</TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('linkedModule')}>Module {getSortIcon('linkedModule')}</TableHead>
                  <TableHead className="text-right cursor-pointer" onClick={() => handleSort('amount')}>Amount {getSortIcon('amount')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>{isValid(parseISO(t.date)) ? format(parseISO(t.date), 'PP') : 'Invalid Date'}</TableCell>
                    <TableCell className="font-medium">{t.description}</TableCell>
                    <TableCell><Badge variant="outline">{t.category}</Badge></TableCell>
                    <TableCell>{t.linkedModule}</TableCell>
                    <TableCell className={cn("text-right font-semibold", t.type === 'Income' ? 'text-green-600' : 'text-red-600')}>
                      {t.type === 'Income' ? '+' : '-'} {formatCurrency(t.amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-10">
              <ClipboardList className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">No transactions found.</p>
              <p className="text-sm text-muted-foreground">
                As you log costs and sales in other modules, they will appear here.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
