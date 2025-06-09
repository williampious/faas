
'use client';

import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import type { AgriFAASUserProfile } from '@/types/user'; // Adjusted path
import { UserCircle, Mail, Phone, MapPin, Briefcase, Building, ShieldCheck, Settings, Bell } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils'; // Added import for cn

// Mock User Data - Replace with actual data fetching later
const mockUser: AgriFAASUserProfile = {
  userId: 'user-uuid-12345',
  fullName: 'Kwame Farmer',
  role: ['Farmer', 'Farm Manager'],
  gender: 'Male',
  dateOfBirth: '1985-07-15',
  nationalId: 'GHA-123456789-0',
  avatarUrl: 'https://placehold.co/100x100.png',
  primaryLanguage: 'en',
  phoneNumber: '+233 24 123 4567',
  emailAddress: 'kwame.farmer@example.com',
  address: {
    street: '123 Farm Lane',
    city: 'Kumasi',
    region: 'Ashanti',
    country: 'Ghana',
  },
  gpsCoordinates: { latitude: 6.6885, longitude: -1.6244 },
  preferredCommunicationChannel: 'WhatsApp',
  farmDetails: {
    linkedFarmHubId: 'hub-ash-001',
    allocatedLandSizeAcres: 50,
    cropTypesBeingGrown: ['Maize', 'Cassava', 'Plantain'],
    yieldData: [{ expected: 100, actual: 0, unit: 'bags', season: '2024 Main', cropType: 'Maize' }], // Adjusted to be an array
    irrigationAccess: true,
    productivityScore: 78,
    previousSeasonPerformance: 'Good harvest, met 90% of expected yield.',
  },
  firebaseUid: 'firebase-uid-abcdef',
  accountStatus: 'Active',
  registrationDate: '2024-05-10T10:00:00.000Z', // Static ISO string
  createdAt: '2024-04-10T10:00:00.000Z', // Static ISO string (30 days ago from a fixed point)
  updatedAt: '2024-05-09T12:30:00.000Z', // Static ISO string
  notificationPreferences: { email: true, sms: false, push: true, whatsApp: true},
  languagePreference: 'en',
  alertsToggle: { dailySummary: true, pestAlerts: true},
  receiveAgriculturalTips: true,
  receiveWeatherUpdates: true,
};


export default function UserProfilePage() {
  const user = mockUser; // In a real app, this would come from auth/API

  return (
    <div>
      <PageHeader
        title="User Profile"
        icon={UserCircle}
        description="View and manage your account details."
      />

      <div className="grid md:grid-cols-3 gap-6">
        {/* Left Column: Avatar & Basic Info */}
        <div className="md:col-span-1 space-y-6">
          <Card className="shadow-lg">
            <CardHeader className="items-center text-center">
              <Avatar className="w-24 h-24 mb-4 border-2 border-primary">
                <AvatarImage src={user.avatarUrl} alt={user.fullName} data-ai-hint="profile person" />
                <AvatarFallback>{user.fullName?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>
              <CardTitle className="font-headline">{user.fullName}</CardTitle>
              <div className="flex flex-wrap justify-center gap-2 mt-1">
                {user.role.map(r => <Badge key={r} variant="secondary">{r}</Badge>)}
              </div>
            </CardHeader>
            <CardContent className="text-sm">
              <InfoItem icon={Mail} label="Email" value={user.emailAddress || 'Not provided'} />
              <InfoItem icon={Phone} label="Phone" value={user.phoneNumber} />
              {user.dateOfBirth && <InfoItem label="Date of Birth" value={format(new Date(user.dateOfBirth), 'MMMM d, yyyy')} />}
              {user.nationalId && <InfoItem label="National ID" value={user.nationalId} />}
              {user.address && (
                <InfoItem icon={MapPin} label="Location" value={`${user.address.city}, ${user.address.region}`} />
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
              <InfoItem label="Member Since" value={user.createdAt ? format(new Date(user.createdAt), 'MMMM d, yyyy') : 'N/A'} />
              <InfoItem label="Last Updated" value={user.updatedAt ? format(new Date(user.updatedAt), 'PPpp') : 'N/A'} />
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Detailed Info Tabs/Sections */}
        <div className="md:col-span-2 space-y-6">
          {user.farmDetails && (
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
                <InfoItem label="Irrigation Access" value={user.farmDetails.irrigationAccess ? 'Yes' : 'No'} />
                <InfoItem label="Productivity Score" value={user.farmDetails.productivityScore?.toString()} />
                {user.farmDetails.previousSeasonPerformance && <InfoItem label="Previous Season" value={user.farmDetails.previousSeasonPerformance} className="whitespace-pre-line"/>}
              </CardContent>
            </Card>
          )}

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="font-headline text-lg flex items-center">
                <Settings className="mr-2 h-5 w-5 text-primary" /> Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <InfoItem label="Primary Language" value={user.primaryLanguage} />
              <InfoItem label="Preferred Communication" value={user.preferredCommunicationChannel} />
              <h4 className="font-medium pt-2 text-muted-foreground">Notification Channels:</h4>
              <ul className="list-disc list-inside pl-2">
                {user.notificationPreferences?.email && <li>Email</li>}
                {user.notificationPreferences?.sms && <li>SMS</li>}
                {user.notificationPreferences?.push && <li>Push Notifications</li>}
                {user.notificationPreferences?.whatsApp && <li>WhatsApp</li>}
              </ul>
               <h4 className="font-medium pt-2 text-muted-foreground">Alerts:</h4>
              <ul className="list-disc list-inside pl-2">
                {user.alertsToggle?.dailySummary && <li>Daily Summary</li>}
                {user.alertsToggle?.pestAlerts && <li>Pest Alerts</li>}
              </ul>
              <InfoItem label="Agricultural Tips" value={user.receiveAgriculturalTips ? 'Subscribed' : 'Not Subscribed'} />
              <InfoItem label="Weather Updates" value={user.receiveWeatherUpdates ? 'Subscribed' : 'Not Subscribed'} />
            </CardContent>
          </Card>
          {/* Add more cards for Financial, HR, System Info etc. as needed */}
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
  if (!value && typeof value !== 'boolean' && typeof value !== 'number') return null; // Don't render if value is empty, unless boolean or number 0
  return (
    <div className={cn("py-2 flex justify-between items-start border-b border-border/50 last:border-b-0", className)}>
      <span className="font-medium text-muted-foreground flex items-center">
        {Icon && <Icon className="mr-2 h-4 w-4 text-primary/80" />}
        {label}:
      </span>
      {typeof value === 'string' ? <span className="text-right text-foreground">{value}</span> : <div className="text-right text-foreground">{value}</div>}
    </div>
  );
}

