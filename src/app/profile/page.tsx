
'use client';

import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import type { AgriFAASUserProfile } from '@/types/user';
import { UserCircle, Mail, Phone, MapPin, Briefcase, Building, ShieldCheck, Settings, Bell, Loader2, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useUserProfile } from '@/contexts/user-profile-context';
import { Button } from '@/components/ui/button'; // For potential future edit button
import { Alert, AlertTitle, AlertDescription as ShadcnAlertDescription } from '@/components/ui/alert';

export default function UserProfilePage() {
  const { userProfile, isLoading, error } = useUserProfile();

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-10rem)] p-4 text-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-10 flex justify-center">
        <Card className="w-full max-w-lg text-center shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center justify-center text-xl text-destructive">
              <AlertTriangle className="mr-2 h-6 w-6" />
              Error Loading Profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-2">Could not load your user profile due to an error:</p>
            <p className="text-sm text-destructive bg-destructive/10 p-2 rounded-md">{error}</p>
            <p className="mt-4 text-sm text-muted-foreground">Please try refreshing the page. If the issue persists, contact support.</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (!userProfile) {
    return (
      <div className="container mx-auto py-10 flex justify-center">
        <Card className="w-full max-w-lg text-center shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center justify-center text-xl">
              <UserCircle className="mr-2 h-6 w-6 text-muted-foreground" />
              Profile Not Found
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">We couldn't find your profile data. This might be a temporary issue or your profile setup might be incomplete.</p>
             <p className="mt-4 text-sm text-muted-foreground">Please try refreshing or contact support if this persists.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const user = userProfile; // Use the loaded userProfile

  return (
    <div>
      <PageHeader
        title="User Profile"
        icon={UserCircle}
        description="View and manage your account details."
        // Action button for editing can be added here later
        // action={<Button variant="outline"><Edit2 className="mr-2 h-4 w-4" /> Edit Profile</Button>}
      />

      <div className="grid md:grid-cols-3 gap-6">
        {/* Left Column: Avatar & Basic Info */}
        <div className="md:col-span-1 space-y-6">
          <Card className="shadow-lg">
            <CardHeader className="items-center text-center">
              <Avatar className="w-24 h-24 mb-4 border-2 border-primary">
                <AvatarImage src={user.avatarUrl} alt={user.fullName} data-ai-hint="profile person" />
                <AvatarFallback>{user.fullName?.charAt(0)?.toUpperCase() || 'U'}</AvatarFallback>
              </Avatar>
              <CardTitle className="font-headline">{user.fullName}</CardTitle>
              <div className="flex flex-wrap justify-center gap-2 mt-1">
                {user.role?.map(r => <Badge key={r} variant={r === 'Admin' ? 'default' : 'secondary'}>{r}</Badge>) ?? <Badge variant="outline">No Role</Badge>}
              </div>
            </CardHeader>
            <CardContent className="text-sm">
              <InfoItem icon={Mail} label="Email" value={user.emailAddress || 'Not provided'} />
              <InfoItem icon={Phone} label="Phone" value={user.phoneNumber || 'Not set'} />
              {user.dateOfBirth && <InfoItem label="Date of Birth" value={format(new Date(user.dateOfBirth), 'MMMM d, yyyy')} />}
              {user.nationalId && <InfoItem label="National ID" value={user.nationalId} />}
              {user.address && (
                <InfoItem icon={MapPin} label="Location" value={`${user.address.city || 'N/A City'}, ${user.address.region || 'N/A Region'}`} />
              )}
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="font-headline text-lg flex items-center">
                <ShieldCheck className="mr-2 h-5 w-5 text-primary" /> Account Status
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <InfoItem label="Status" value={<Badge variant={user.accountStatus === 'Active' ? 'default' : 'destructive'}>{user.accountStatus}</Badge>} />
              <InfoItem label="Member Since" value={user.registrationDate ? format(new Date(user.registrationDate), 'MMMM d, yyyy') : 'N/A'} />
              <InfoItem label="Last Updated" value={user.updatedAt ? format(new Date(user.updatedAt), 'PPpp') : 'N/A'} />
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Detailed Info Tabs/Sections */}
        <div className="md:col-span-2 space-y-6">
          {user.farmDetails && Object.keys(user.farmDetails).length > 0 && (
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="font-headline text-lg flex items-center">
                  <Building className="mr-2 h-5 w-5 text-primary" /> Farm & Hub Details
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <InfoItem label="Farm Hub ID" value={user.farmDetails.linkedFarmHubId} />
                <InfoItem label="Allocated Land" value={user.farmDetails.allocatedLandSizeAcres ? `${user.farmDetails.allocatedLandSizeAcres} acres` : 'N/A'} />
                <InfoItem label="Crops Grown" value={user.farmDetails.cropTypesBeingGrown?.join(', ')} />
                <InfoItem label="Irrigation Access" value={user.farmDetails.irrigationAccess !== undefined ? (user.farmDetails.irrigationAccess ? 'Yes' : 'No') : 'N/A'} />
                <InfoItem label="Productivity Score" value={user.farmDetails.productivityScore?.toString()} />
                {user.farmDetails.previousSeasonPerformance && <InfoItem label="Previous Season" value={user.farmDetails.previousSeasonPerformance} className="whitespace-pre-line"/>}
              </CardContent>
            </Card>
          )}

          {(user.notificationPreferences || user.languagePreference || user.alertsToggle || user.receiveAgriculturalTips !== undefined || user.receiveWeatherUpdates !== undefined) && (
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="font-headline text-lg flex items-center">
                  <Settings className="mr-2 h-5 w-5 text-primary" /> Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <InfoItem label="Primary Language" value={user.primaryLanguage || user.languagePreference} />
                <InfoItem label="Preferred Communication" value={user.preferredCommunicationChannel} />
                
                {user.notificationPreferences && Object.values(user.notificationPreferences).some(v => v) && (
                  <>
                    <h4 className="font-medium pt-2 text-muted-foreground">Notification Channels:</h4>
                    <ul className="list-disc list-inside pl-2">
                      {user.notificationPreferences?.email && <li>Email</li>}
                      {user.notificationPreferences?.sms && <li>SMS</li>}
                      {user.notificationPreferences?.push && <li>Push Notifications</li>}
                      {user.notificationPreferences?.whatsApp && <li>WhatsApp</li>}
                    </ul>
                  </>
                )}
                
                {user.alertsToggle && Object.values(user.alertsToggle).some(v => v) && (
                   <>
                    <h4 className="font-medium pt-2 text-muted-foreground">Alerts:</h4>
                    <ul className="list-disc list-inside pl-2">
                        {user.alertsToggle?.dailySummary && <li>Daily Summary</li>}
                        {user.alertsToggle?.weeklySummary && <li>Weekly Summary</li>}
                        {user.alertsToggle?.pestAlerts && <li>Pest Alerts</li>}
                        {user.alertsToggle?.priceAlerts && <li>Price Alerts</li>}
                    </ul>
                   </>
                )}
                <InfoItem label="Agricultural Tips" value={user.receiveAgriculturalTips !== undefined ? (user.receiveAgriculturalTips ? 'Subscribed' : 'Not Subscribed') : 'N/A'} />
                <InfoItem label="Weather Updates" value={user.receiveWeatherUpdates !== undefined ? (user.receiveWeatherUpdates ? 'Subscribed' : 'Not Subscribed') : 'N/A'} />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

interface InfoItemProps {
  icon?: React.ElementType;
  label: string;
  value?: string | React.ReactNode;
  className?: string;
}

function InfoItem({ icon: Icon, label, value, className }: InfoItemProps) {
  if (value === undefined || value === null || (typeof value === 'string' && value.trim() === '')) {
     // Still render if it's a boolean false or number 0
    if (typeof value === 'boolean' || typeof value === 'number') {
      // Allow to proceed
    } else {
      return null; // Don't render if value is truly empty/undefined/null string
    }
  }
  return (
    <div className={cn("py-2 flex justify-between items-start border-b border-border/50 last:border-b-0", className)}>
      <span className="font-medium text-muted-foreground flex items-center whitespace-nowrap mr-2">
        {Icon && <Icon className="mr-2 h-4 w-4 text-primary/80 shrink-0" />}
        {label}:
      </span>
      {typeof value === 'string' ? <span className="text-right text-foreground break-words">{value}</span> : <div className="text-right text-foreground break-words">{value}</div>}
    </div>
  );
}
