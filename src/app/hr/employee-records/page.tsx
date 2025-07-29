
'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, ArrowLeft, Loader2, AlertTriangle, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useUserProfile } from '@/contexts/user-profile-context';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import type { AgriFAASUserProfile } from '@/types/user';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

const USERS_COLLECTION = 'users';

export default function HREmployeeRecordsPage() {
  const router = useRouter();
  const { userProfile, isLoading: isProfileLoading } = useUserProfile();
  const [employees, setEmployees] = useState<AgriFAASUserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const tenantId = userProfile?.tenantId;

  useEffect(() => {
    if (isProfileLoading) return;
    if (!tenantId) {
      setError("Farm information is not available. Cannot load employee data.");
      setIsLoading(false);
      return;
    }

    const fetchEmployees = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const q = query(collection(db, USERS_COLLECTION), where("tenantId", "==", tenantId), orderBy("fullName"));
        const querySnapshot = await getDocs(q);
        const fetchedEmployees = querySnapshot.docs.map(doc => ({ userId: doc.id, ...doc.data() })) as AgriFAASUserProfile[];
        setEmployees(fetchedEmployees);
      } catch (err: any) {
        console.error("Error fetching employees:", err);
        setError(`Failed to fetch employee data: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEmployees();
  }, [tenantId, isProfileLoading]);

  if (isProfileLoading || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-12rem)]">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
        <p className="ml-3 text-lg text-muted-foreground">Loading employee records...</p>
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
        title="Employee Records"
        icon={Users}
        description="View all employees and staff associated with your farm."
        action={
            <Button variant="outline" onClick={() => router.push('/hr/dashboard')}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to HR Dashboard
            </Button>
        }
      />

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Employee Directory</CardTitle>
          <CardDescription>
            {employees.length > 0 ? `A list of all ${employees.length} employees on the farm.` : "No employees found."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {employees.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Full Name</TableHead>
                  <TableHead>Role(s)</TableHead>
                  <TableHead>Phone Number</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((employee) => (
                  <TableRow key={employee.userId}>
                    <TableCell className="font-medium">{employee.fullName}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {employee.role?.map(r => <Badge key={r} variant="secondary">{r}</Badge>)}
                      </div>
                    </TableCell>
                    <TableCell>{employee.phoneNumber || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge variant={employee.accountStatus === 'Active' ? 'default' : 'destructive'}>
                        {employee.accountStatus}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-10">
              <Users className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">No employee records found for this farm.</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card className="mt-6 bg-muted/30 p-4">
        <CardHeader className="p-0 pb-2">
            <CardTitle className="text-base font-semibold text-muted-foreground">Note</CardTitle>
        </CardHeader>
        <CardContent className="p-0 text-xs text-muted-foreground space-y-1">
            <p>&bull; This directory provides a read-only view of all personnel on the farm.</p>
            <p>&bull; To add, invite, or manage user roles and permissions, please use the <strong>Admin &gt; User Management</strong> dashboard.</p>
        </CardContent>
      </Card>
    </div>
  );
}
