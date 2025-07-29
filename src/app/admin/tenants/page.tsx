
'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Building2, ArrowLeft, Loader2, AlertTriangle, ArrowUp, ArrowDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { Farm } from '@/types/farm';
import { useUserProfile } from '@/contexts/user-profile-context';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, type OrderByDirection } from 'firebase/firestore';
import { format, parseISO, isValid } from 'date-fns';

const TENANTS_COLLECTION = 'tenants';
type SortableKeys = 'name' | 'country' | 'region' | 'createdAt';

export default function TenantManagementPage() {
  const router = useRouter();
  const { userProfile, isLoading: isProfileLoading } = useUserProfile();
  const [tenants, setTenants] = useState<Farm[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: SortableKeys, direction: OrderByDirection }>({ key: 'createdAt', direction: 'desc' });

  useEffect(() => {
    if (isProfileLoading) return;
    if (!userProfile?.role.includes('Super Admin')) {
      setError("You do not have permission to view this page.");
      setIsLoading(false);
      return;
    }

    const fetchTenants = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const tenantsQuery = query(collection(db, TENANTS_COLLECTION), orderBy(sortConfig.key, sortConfig.direction));
        const querySnapshot = await getDocs(tenantsQuery);
        const fetchedTenants = querySnapshot.docs.map(doc => doc.data() as Farm);
        setTenants(fetchedTenants);
      } catch (err: any) {
        console.error("Error fetching tenants:", err);
        setError(`Failed to fetch tenants. An index might be required for sorting by '${sortConfig.key}'.`);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTenants();
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
    return sortConfig.direction === 'asc' ? <ArrowUp className="h-4 w-4 ml-1" /> : <ArrowDown className="h-4 w-4 ml-1" />;
  };

  const formatDate = (timestamp: any): string => {
    if (!timestamp) return 'N/A';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : parseISO(timestamp);
      if (isValid(date)) return format(date, 'PP');
    } catch (e) {
      console.error("Date formatting error:", e);
    }
    return 'Invalid Date';
  };

  if (isProfileLoading || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-12rem)]">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
        <p className="ml-3 text-lg text-muted-foreground">Loading tenants...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-10">
        <Card className="w-full max-w-lg mx-auto text-center shadow-lg">
          <CardHeader><CardTitle className="flex items-center justify-center text-xl text-destructive"><AlertTriangle className="mr-2 h-6 w-6" /> Error</CardTitle></CardHeader>
          <CardContent><p className="text-muted-foreground mb-2">{error}</p></CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Platform Tenant Management"
        icon={Building2}
        description="A complete list of all farms (tenants) registered on the platform."
        action={
          <Button variant="outline" onClick={() => router.push('/admin/dashboard')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
          </Button>
        }
      />
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>All Tenants ({tenants.length})</CardTitle>
          <CardDescription>Click on table headers to sort the data.</CardDescription>
        </CardHeader>
        <CardContent>
          {tenants.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('name')}>
                    <div className="flex items-center">Name {getSortIcon('name')}</div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('country')}>
                    <div className="flex items-center">Country {getSortIcon('country')}</div>
                  </TableHead>
                   <TableHead className="cursor-pointer" onClick={() => handleSort('region')}>
                    <div className="flex items-center">Region {getSortIcon('region')}</div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('createdAt')}>
                    <div className="flex items-center">Created On {getSortIcon('createdAt')}</div>
                  </TableHead>
                  <TableHead>Owner ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tenants.map((tenant) => (
                  <TableRow key={tenant.id}>
                    <TableCell className="font-medium">{tenant.name}</TableCell>
                    <TableCell>{tenant.country}</TableCell>
                    <TableCell>{tenant.region}</TableCell>
                    <TableCell>{formatDate(tenant.createdAt)}</TableCell>
                    <TableCell className="text-xs font-mono">{tenant.ownerId}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-10">
              <Building2 className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">No tenants found on the platform.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
