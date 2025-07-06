
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription as ShadcnAlertDescription } from '@/components/ui/alert';
import { Loader2, AlertTriangle, User, ArrowLeft, Edit, MapPin, Phone, Mail, CalendarDaysIcon, Leaf, ShieldAlert, Target, TractorIcon } from 'lucide-react';
import type { AgriFAASUserProfile } from '@/types/user';
import { db, isFirebaseClientConfigured } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useUserProfile } from '@/contexts/user-profile-context';
import { format, parseISO, isValid } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface InfoItemProps {
  icon?: React.ElementType;
  label: string;
  value?: string | React.ReactNode;
  className?: string;
  hideIfEmpty?: boolean;
}

function InfoItem({ icon: Icon, label, value, className, hideIfEmpty = true }: InfoItemProps) {
  const isConsideredEmpty = value === undefined || value === null || (typeof value === 'string' && value.trim() === '') || (Array.isArray(value) && value.length === 0);
  
  if (hideIfEmpty && isConsideredEmpty && typeof value !== 'boolean' && typeof value !== 'number') {
    return null; 
  }

  let displayValue = value;
  if (typeof value === 'boolean') {
    displayValue = value ? "Yes" : "No";
  } else if (Array.isArray(value)) {
    displayValue = value.length > 0 ? (
      <ul className="list-disc list-inside pl-1">
        {value.map((item, index) => <li key={index}>{String(item)}</li>)}
      </ul>
    ) : "N/A";
  } else if (value === undefined || value === null || (typeof value === 'string' && value.trim() === '')) {
    displayValue = "N/A";
  }


  return (
    <div className={cn("py-2 flex flex-col sm:flex-row sm:justify-between sm:items-start border-b border-border/50 last:border-b-0", className)}>
      <span className="font-medium text-muted-foreground flex items-center whitespace-nowrap mb-1 sm:mb-0 sm:mr-2">
        {Icon && <Icon className="mr-2 h-4 w-4 text-primary/80 shrink-0" />}
        {label}:
      </span>
      {typeof displayValue === 'string' ? <span className="sm:text-right text-foreground break-words">{displayValue}</span> : <div className="sm:text-right text-foreground break-words">{displayValue}</div>}
    </div>
  );
}


export default function FarmerProfilePage() {
  const params = useParams();
  const router = useRouter();
  const farmerId = params.farmerId as string;
  
  const { userProfile: aeoProfile, isLoading: isAeoProfileLoading } = useUserProfile();
  const [farmer, setFarmer] = useState<AgriFAASUserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!farmerId) {
      setError("Farmer ID is missing from the URL.");
      setIsLoading(false);
      return;
    }

    if (isAeoProfileLoading) return; // Wait for AEO profile to load

    if (!aeoProfile || !aeoProfile.role?.includes('Agric Extension Officer')) {
      // This check might be redundant if aeo/layout handles it, but good for direct access attempts
      setError("You do not have permission to view this page.");
      setIsLoading(false);
      // Optionally redirect: router.replace('/aeo/dashboard');
      return;
    }
    
    if (!isFirebaseClientConfigured || !db) {
      setError("Firebase is not configured. Cannot fetch farmer details.");
      setIsLoading(false);
      return;
    }

    const fetchFarmer = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const farmerDocRef = doc(db, 'users', farmerId);
        const docSnap = await getDoc(farmerDocRef);

        if (docSnap.exists()) {
          const farmerData = { userId: docSnap.id, ...docSnap.data() } as AgriFAASUserProfile;
          // Security check: Ensure AEO manages this farmer (or is admin - future enhancement)
          if (farmerData.managedByAEO !== aeoProfile.userId) {
             setError("You are not authorized to view this farmer's profile.");
             setFarmer(null);
          } else {
             setFarmer(farmerData);
          }
        } else {
          setError("Farmer profile not found.");
          setFarmer(null);
        }
      } catch (err: any) {
        console.error("Error fetching farmer profile:", err);
        setError(`Failed to fetch farmer profile: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFarmer();
  }, [farmerId, aeoProfile, isAeoProfileLoading, router]);

  if (isLoading || isAeoProfileLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-10rem)] py-10">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="ml-3 text-lg text-muted-foreground">Loading farmer profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-10">
        <Alert variant="destructive" className="max-w-xl mx-auto">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle>Error Loading Profile</AlertTitle>
          <ShadcnAlertDescription>{error}</ShadcnAlertDescription>
          <Button variant="outline" onClick={() => router.push('/aeo/farmer-directory')} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Go Back to Directory
          </Button>
        </Alert>
      </div>
    );
  }

  if (!farmer) {
    return (
      <div className="container mx-auto py-10 text-center">
        <User className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <p className="text-xl text-muted-foreground">Farmer profile could not be displayed.</p>
         <Button variant="outline" onClick={() => router.push('/aeo/farmer-directory')} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Go Back to Directory
        </Button>
      </div>
    );
  }

  const farmerAddress = [
    farmer.address?.street,
    farmer.address?.community,
    farmer.address?.city,
    farmer.address?.region,
    farmer.address?.country,
  ].filter(Boolean).join(', ') || 'N/A';

  return (
    <div>
      <PageHeader
        title={`Farmer Profile: ${farmer.fullName}`}
        icon={User}
        description={`Detailed information for ${farmer.fullName}. Managed by AEO: ${aeoProfile?.fullName || 'Unknown'}`}
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push('/aeo/farmer-directory')}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Directory
            </Button>
            <Link href={`/aeo/farmer-profile/${farmer.userId}/edit`}>
              <Button>
                <Edit className="mr-2 h-4 w-4" /> Edit Profile
              </Button>
            </Link>
          </div>
        }
      />

      <div className="grid md:grid-cols-3 gap-6">
        {/* Left Column: Basic Info & Contact */}
        <div className="md:col-span-1 space-y-6">
          <Card className="shadow-lg">
            <CardHeader className="items-center text-center">
              <Avatar className="w-28 h-28 mb-4 border-4 border-primary shadow-md">
                <AvatarImage src={farmer.avatarUrl || `https://placehold.co/100x100.png?text=${farmer.fullName.charAt(0)}`} alt={farmer.fullName} data-ai-hint="profile person" />
                <AvatarFallback>{farmer.fullName?.charAt(0)?.toUpperCase() || 'F'}</AvatarFallback>
              </Avatar>
              <CardTitle className="text-2xl font-bold font-headline">{farmer.fullName}</CardTitle>
              <Badge variant={farmer.accountStatus === 'Active' ? 'default' : 'outline'} className="mt-1">
                {farmer.accountStatus}
              </Badge>
            </CardHeader>
            <CardContent className="text-sm space-y-1">
              <InfoItem icon={Mail} label="Email" value={farmer.emailAddress} />
              <InfoItem icon={Phone} label="Phone" value={farmer.phoneNumber} />
              <InfoItem icon={User} label="Gender" value={farmer.gender} />
              {farmer.dateOfBirth && isValid(parseISO(farmer.dateOfBirth)) && (
                <InfoItem icon={CalendarDaysIcon} label="Date of Birth" value={format(parseISO(farmer.dateOfBirth), 'MMMM d, yyyy')} />
              )}
              <Separator className="my-2" />
              <InfoItem icon={MapPin} label="Full Address" value={farmerAddress} />
              <InfoItem label="Community" value={farmer.address?.community} />
              <InfoItem label="District" value={farmer.assignedDistrict} />
              <InfoItem label="Region" value={farmer.assignedRegion} />
              {farmer.gpsCoordinates && (
                <InfoItem 
                    label="GPS Coordinates" 
                    value={`${farmer.gpsCoordinates.latitude.toFixed(4)}, ${farmer.gpsCoordinates.longitude.toFixed(4)}`} 
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Farming Details, Challenges, Needs etc. */}
        <div className="md:col-span-2 space-y-6">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="font-headline text-xl flex items-center"><TractorIcon className="mr-2 h-5 w-5 text-primary" /> Farming Practices & Details</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-1">
              <InfoItem label="Crops Grown" value={farmer.farmDetails?.cropTypesBeingGrown} />
              <InfoItem label="Land Size" value={farmer.farmDetails?.allocatedLandSizeAcres ? `${farmer.farmDetails.allocatedLandSizeAcres} acres` : undefined} />
              <InfoItem label="Irrigation Access" value={farmer.farmDetails?.irrigationAccess} />
              <InfoItem label="Soil Type" value={farmer.farmDetails?.soilType} />
              <InfoItem label="Farming Techniques" value={farmer.farmDetails?.farmingTechniquesUsed} />
              {/* Add more from farmDetails as needed */}
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="font-headline text-xl flex items-center"><ShieldAlert className="mr-2 h-5 w-5 text-destructive" /> Challenges</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <InfoItem label="Reported Challenges" value={farmer.farmChallenges} hideIfEmpty={false} />
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="font-headline text-xl flex items-center"><Target className="mr-2 h-5 w-5 text-blue-500" /> Needs</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
               <InfoItem label="Identified Needs" value={farmer.farmerNeeds} hideIfEmpty={false} />
            </CardContent>
          </Card>
          
          {/* Placeholder for future sections like Production History, Resources, etc. */}
          <Card className="shadow-md opacity-70">
            <CardHeader>
                <CardTitle className="text-lg text-muted-foreground">More Details (Coming Soon)</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground">Detailed sections for Resources, Production History, Marketing Practices, and Intervention Outcomes will be available here soon.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
