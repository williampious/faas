
'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart3, ArrowLeft, Loader2, AlertTriangle, Eye, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useUserProfile } from '@/contexts/user-profile-context';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import type { AgriFAASUserProfile } from '@/types/user';
import Link from 'next/link';

const USERS_COLLECTION = 'users';

export default function AEOReportsPage() {
  const router = useRouter();
  const { userProfile: aeoProfile, isLoading: isAeoProfileLoading } = useUserProfile();
  const [farmers, setFarmers] = useState<AgriFAASUserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAeoProfileLoading) return;
    if (!aeoProfile?.userId) {
      if (!isAeoProfileLoading) setError("AEO profile not found. Cannot fetch farmers.");
      setIsLoading(false);
      return;
    }

    const fetchFarmers = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const q = query(
          collection(db, USERS_COLLECTION),
          where('managedByAEO', '==', aeoProfile.userId),
          orderBy('fullName')
        );
        const querySnapshot = await getDocs(q);
        const fetchedFarmers = querySnapshot.docs.map(doc => ({ userId: doc.id, ...doc.data() } as AgriFAASUserProfile));
        setFarmers(fetchedFarmers);
      } catch (err: any) {
        console.error("Error fetching farmers for report:", err);
        setError(`Failed to fetch farmers: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFarmers();
  }, [aeoProfile, isAeoProfileLoading]);

  if (isAeoProfileLoading || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-12rem)]">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
        <p className="ml-3 text-lg text-muted-foreground">Generating Farmer Report...</p>
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
        title="AEO Farmer Summary Report"
        icon={BarChart3}
        description={`A summary of all farmers managed by you in ${aeoProfile?.assignedRegion || 'your region'}.`}
        action={
          <Button variant="outline" onClick={() => router.push('/aeo/dashboard')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to AEO Dashboard
          </Button>
        }
      />
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Farmer Portfolio Overview</CardTitle>
          <CardDescription>
            {farmers.length > 0 ? `Displaying key metrics for ${farmers.length} farmers.` : "No farmers found in your portfolio."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {farmers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Farmer Name</TableHead>
                  <TableHead>Community</TableHead>
                  <TableHead>Land Size (Acres)</TableHead>
                  <TableHead>Crops Grown</TableHead>
                  <TableHead className="text-center">Needs</TableHead>
                  <TableHead className="text-center">Challenges</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {farmers.map(farmer => (
                  <TableRow key={farmer.userId}>
                    <TableCell className="font-medium">{farmer.fullName}</TableCell>
                    <TableCell>{farmer.address?.community || 'N/A'}</TableCell>
                    <TableCell>{farmer.farmDetails?.allocatedLandSizeAcres?.toString() || 'N/A'}</TableCell>
                    <TableCell>{farmer.farmDetails?.cropTypesBeingGrown?.join(', ') || 'N/A'}</TableCell>
                    <TableCell className="text-center">{farmer.farmerNeeds?.length || 0}</TableCell>
                    <TableCell className="text-center">{farmer.farmChallenges?.length || 0}</TableCell>
                    <TableCell className="text-right">
                      <Link href={`/aeo/farmer-profile/${farmer.userId}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="h-3.5 w-3.5 mr-1" /> View Profile
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-10">
              <Users className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">No farmers found in your directory.</p>
              <p className="text-sm text-muted-foreground">
                Go to the <Link href="/aeo/farmer-directory" className="text-primary hover:underline">Farmer Directory</Link> to add farmers.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
