
'use client';

import { useState, useEffect } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import type { AgriFAASUserProfile, UserRole, Gender, CommunicationChannel } from '@/types/user';
import { UserCircle, Mail, Phone, MapPin, Briefcase, Building, ShieldCheck, Settings, Bell, Loader2, AlertTriangle, Edit3, Save, XCircle, CalendarIcon } from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';
import { cn } from '@/lib/utils';
import { useUserProfile } from '@/contexts/user-profile-context';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription as ShadcnAlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { db } from '@/lib/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';


const genderOptions: Gender[] = ['Male', 'Female', 'Other', 'PreferNotToSay'];
const communicationChannelOptions: CommunicationChannel[] = ['SMS', 'AppNotification', 'WhatsApp'];

const profileFormSchema = z.object({
  fullName: z.string().min(2, { message: "Full name must be at least 2 characters." }),
  phoneNumber: z.string().optional().or(z.literal('')),
  dateOfBirth: z.date().optional(),
  gender: z.enum([...genderOptions, ""] as [string, ...string[]]).optional(),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    region: z.string().optional(),
    country: z.string().optional(),
    postalCode: z.string().optional(),
  }).optional(),
  primaryLanguage: z.string().optional(),
  preferredCommunicationChannel: z.enum([...communicationChannelOptions, ""] as [string, ...string[]]).optional(),
  notificationPreferences: z.object({
    email: z.boolean().optional(),
    sms: z.boolean().optional(),
    push: z.boolean().optional(),
    whatsApp: z.boolean().optional(),
  }).optional(),
  alertsToggle: z.object({
    dailySummary: z.boolean().optional(),
    weeklySummary: z.boolean().optional(),
    priceAlerts: z.boolean().optional(),
    pestAlerts: z.boolean().optional(),
  }).optional(),
  receiveAgriculturalTips: z.boolean().optional(),
  receiveWeatherUpdates: z.boolean().optional(),
  assignedRegion: z.string().optional(),
  assignedDistrict: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

interface InfoItemProps {
  icon?: React.ElementType;
  label: string;
  value?: string | React.ReactNode;
  className?: string;
}

function InfoItem({ icon: Icon, label, value, className }: InfoItemProps) {
  const isConsideredEmpty = value === undefined || value === null || (typeof value === 'string' && value.trim() === '');
  
  if (isConsideredEmpty && typeof value !== 'boolean' && typeof value !== 'number') {
    return null; 
  }

  let displayValue = value;
  if (typeof value === 'boolean') {
    displayValue = value ? "Yes" : "No";
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


export default function UserProfilePage() {
  const { userProfile, isLoading: isProfileLoading, error: profileError, user } = useUserProfile();
  const { toast } = useToast();
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isAEO = userProfile?.role?.includes('Agric Extension Officer') || false;

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {},
  });

  useEffect(() => {
    if (userProfile) {
      let dob: Date | undefined;
      const dobValue = userProfile.dateOfBirth as any;
      if (dobValue) {
          if (typeof dobValue.toDate === 'function') { // Firestore Timestamp
              dob = dobValue.toDate();
          } else if (typeof dobValue === 'string') { // ISO String
              const parsed = parseISO(dobValue);
              if (isValid(parsed)) {
                  dob = parsed;
              }
          }
      }
      
      form.reset({
        fullName: userProfile.fullName || '',
        phoneNumber: userProfile.phoneNumber || '',
        dateOfBirth: dob,
        gender: userProfile.gender || "",
        address: {
          street: userProfile.address?.street || '',
          city: userProfile.address?.city || '',
          region: userProfile.address?.region || '',
          country: userProfile.address?.country || '',
          postalCode: userProfile.address?.postalCode || '',
        },
        primaryLanguage: userProfile.primaryLanguage || '',
        preferredCommunicationChannel: userProfile.preferredCommunicationChannel || "",
        notificationPreferences: {
          email: userProfile.notificationPreferences?.email || false,
          sms: userProfile.notificationPreferences?.sms || false,
          push: userProfile.notificationPreferences?.push || false,
          whatsApp: userProfile.notificationPreferences?.whatsApp || false,
        },
        alertsToggle: {
          dailySummary: userProfile.alertsToggle?.dailySummary || false,
          weeklySummary: userProfile.alertsToggle?.weeklySummary || false,
          priceAlerts: userProfile.alertsToggle?.priceAlerts || false,
          pestAlerts: userProfile.alertsToggle?.pestAlerts || false,
        },
        receiveAgriculturalTips: userProfile.receiveAgriculturalTips || false,
        receiveWeatherUpdates: userProfile.receiveWeatherUpdates || false,
        assignedRegion: userProfile.assignedRegion || '',
        assignedDistrict: userProfile.assignedDistrict || '',
      });
    }
  }, [userProfile, form, isEditMode]);

  const onSubmit: SubmitHandler<ProfileFormValues> = async (data) => {
    if (!user || !userProfile) {
      toast({ title: "Error", description: "User not found. Cannot save profile.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const profileDataToUpdate: Partial<AgriFAASUserProfile> = {
        ...data,
        dateOfBirth: data.dateOfBirth ? format(data.dateOfBirth, 'yyyy-MM-dd') : undefined,
        updatedAt: serverTimestamp() as any,
      };
      
      if (profileDataToUpdate.phoneNumber === '') delete profileDataToUpdate.phoneNumber;
      if (profileDataToUpdate.gender === '') delete profileDataToUpdate.gender;
      if (!isAEO) {
        delete profileDataToUpdate.assignedRegion;
        delete profileDataToUpdate.assignedDistrict;
      } else {
        profileDataToUpdate.assignedRegion = data.assignedRegion || '';
        profileDataToUpdate.assignedDistrict = data.assignedDistrict || '';
      }

      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, profileDataToUpdate);

      toast({ title: "Profile Updated", description: "Your profile has been successfully updated." });
      setIsEditMode(false);
    } catch (err: any) {
      console.error("Error updating profile:", err);
      toast({ title: "Update Failed", description: err.message || "Could not update profile. Please try again.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleResetLocalData = () => {
    const keysToRemove = [
      'farmTasks_v2', 'weatherLocation', 'farmEvents'
    ];

    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });

    toast({
      title: "Local Data Reset",
      description: "Remaining local data has been cleared from your browser. The page will now reload.",
    });

    // Reload the page to reflect the cleared state
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  };

  if (isProfileLoading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-10rem)] p-4 text-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  if (profileError) {
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
            <p className="text-sm text-destructive bg-destructive/10 p-2 rounded-md">{profileError}</p>
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

  const currentProfile = userProfile;

  const formatTimestamp = (timestamp: any, dateFormat: string = 'PPpp'): string => {
    if (!timestamp) return 'N/A';

    if (typeof timestamp.toDate === 'function') { // Firestore Timestamp
      const dateObj = timestamp.toDate();
      return isValid(dateObj) ? format(dateObj, dateFormat) : 'Invalid Date';
    }
    if (timestamp instanceof Date) { // JavaScript Date Object
      return isValid(timestamp) ? format(timestamp, dateFormat) : 'Invalid JS Date';
    }
    if (typeof timestamp === 'string') { // ISO String
      const parsedDate = parseISO(timestamp);
      return isValid(parsedDate) ? format(parsedDate, dateFormat) : 'Invalid Date String';
    }
    if (typeof timestamp === 'number') { // Number (milliseconds epoch)
      const dateFromNum = new Date(timestamp);
      return isValid(dateFromNum) ? format(dateFromNum, dateFormat) : 'Invalid Timestamp Number';
    }
    console.warn("UserProfilePage: Timestamp field is of an unexpected type:", timestamp);
    return 'Invalid Date Format';
  };


  return (
    <div>
      <PageHeader
        title="User Profile"
        icon={UserCircle}
        description={isEditMode ? "Update your account details." : "View and manage your account details."}
        action={!isEditMode && (
          <Button variant="outline" onClick={() => setIsEditMode(true)}>
            <Edit3 className="mr-2 h-4 w-4" /> Edit Profile
          </Button>
        )}
      />

      {isEditMode ? (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline">Edit Your Profile</CardTitle>
            <CardDescription>Make changes to your personal information and preferences.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                {/* Basic Information Section */}
                <section className="space-y-4 p-4 border rounded-lg">
                  <h3 className="text-lg font-semibold text-primary">Basic Information</h3>
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl><Input placeholder="Your full name" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phoneNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl><Input type="tel" placeholder="Your phone number" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="dateOfBirth"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Date of Birth</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-[240px] pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) =>
                                date > new Date() || date < new Date("1900-01-01")
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gender</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Select your gender" /></SelectTrigger></FormControl>
                          <SelectContent>
                            {genderOptions.map(option => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </section>

                 {isAEO && (
                  <section className="space-y-4 p-4 border rounded-lg">
                    <h3 className="text-lg font-semibold text-primary">AEO Assignment</h3>
                    <FormField
                      control={form.control}
                      name="assignedRegion"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Assigned Region</FormLabel>
                          <FormControl><Input placeholder="e.g., Volta Region" {...field} /></FormControl>
                          <FormDescription>The primary region you are assigned to as an AEO.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="assignedDistrict"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Assigned District</FormLabel>
                          <FormControl><Input placeholder="e.g., South Tongu" {...field} /></FormControl>
                          <FormDescription>The primary district you are assigned to within your region.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </section>
                )}

                <section className="space-y-4 p-4 border rounded-lg">
                  <h3 className="text-lg font-semibold text-primary">Address</h3>
                  <FormField control={form.control} name="address.street" render={({ field }) => (<FormItem><FormLabel>Street</FormLabel><FormControl><Input placeholder="Street address" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="address.city" render={({ field }) => (<FormItem><FormLabel>City</FormLabel><FormControl><Input placeholder="City" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="address.region" render={({ field }) => (<FormItem><FormLabel>Region/State</FormLabel><FormControl><Input placeholder="Region or State" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="address.country" render={({ field }) => (<FormItem><FormLabel>Country</FormLabel><FormControl><Input placeholder="Country" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="address.postalCode" render={({ field }) => (<FormItem><FormLabel>Postal Code</FormLabel><FormControl><Input placeholder="Postal Code" {...field} /></FormControl><FormMessage /></FormItem>)} />
                </section>

                <section className="space-y-4 p-4 border rounded-lg">
                  <h3 className="text-lg font-semibold text-primary">Preferences</h3>
                  <FormField control={form.control} name="primaryLanguage" render={({ field }) => (<FormItem><FormLabel>Primary Language</FormLabel><FormControl><Input placeholder="e.g., English, Twi" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField
                    control={form.control}
                    name="preferredCommunicationChannel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preferred Communication Channel</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Select channel" /></SelectTrigger></FormControl>
                          <SelectContent>
                            {communicationChannelOptions.map(option => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="space-y-2">
                    <FormLabel>Notification Preferences</FormLabel>
                    <FormField control={form.control} name="notificationPreferences.email" render={({ field }) => (<FormItem className="flex flex-row items-center space-x-3 space-y-0"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel className="font-normal">Email Notifications</FormLabel></FormItem>)} />
                    <FormField control={form.control} name="notificationPreferences.sms" render={({ field }) => (<FormItem className="flex flex-row items-center space-x-3 space-y-0"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel className="font-normal">SMS Notifications</FormLabel></FormItem>)} />
                    <FormField control={form.control} name="notificationPreferences.push" render={({ field }) => (<FormItem className="flex flex-row items-center space-x-3 space-y-0"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel className="font-normal">Push Notifications (In-App)</FormLabel></FormItem>)} />
                    <FormField control={form.control} name="notificationPreferences.whatsApp" render={({ field }) => (<FormItem className="flex flex-row items-center space-x-3 space-y-0"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel className="font-normal">WhatsApp Notifications</FormLabel></FormItem>)} />
                  </div>
                   <div className="space-y-2">
                    <FormLabel>Alert Subscriptions</FormLabel>
                    <FormField control={form.control} name="alertsToggle.dailySummary" render={({ field }) => (<FormItem className="flex flex-row items-center space-x-3 space-y-0"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel className="font-normal">Daily Summary Alerts</FormLabel></FormItem>)} />
                    <FormField control={form.control} name="alertsToggle.weeklySummary" render={({ field }) => (<FormItem className="flex flex-row items-center space-x-3 space-y-0"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel className="font-normal">Weekly Summary Alerts</FormLabel></FormItem>)} />
                    <FormField control={form.control} name="alertsToggle.priceAlerts" render={({ field }) => (<FormItem className="flex flex-row items-center space-x-3 space-y-0"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel className="font-normal">Price Alerts</FormLabel></FormItem>)} />
                    <FormField control={form.control} name="alertsToggle.pestAlerts" render={({ field }) => (<FormItem className="flex flex-row items-center space-x-3 space-y-0"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel className="font-normal">Pest Alerts</FormLabel></FormItem>)} />
                  </div>
                   <FormField
                    control={form.control}
                    name="receiveAgriculturalTips"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                          <FormLabel>Agricultural Tips</FormLabel>
                          <FormDescription>Receive useful agricultural tips and news.</FormDescription>
                        </div>
                        <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="receiveWeatherUpdates"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                          <FormLabel>Weather Updates</FormLabel>
                          <FormDescription>Receive weather updates relevant to your location.</FormDescription>
                        </div>
                        <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                      </FormItem>
                    )}
                  />
                </section>

                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsEditMode(false)} disabled={isSubmitting}>
                    <XCircle className="mr-2 h-4 w-4" /> Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save Changes
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-1 space-y-6">
            <Card className="shadow-lg">
              <CardHeader className="items-center text-center">
                <Avatar className="w-24 h-24 mb-4 border-2 border-primary">
                  <AvatarImage src={currentProfile.avatarUrl} alt={currentProfile.fullName} data-ai-hint="profile person" />
                  <AvatarFallback>{currentProfile.fullName?.charAt(0)?.toUpperCase() || 'U'}</AvatarFallback>
                </Avatar>
                <CardTitle className="font-headline">{currentProfile.fullName}</CardTitle>
                <div className="flex flex-wrap justify-center gap-2 mt-1">
                  {currentProfile.role?.map(r => <Badge key={r} variant={r === 'Admin' ? 'default' : 'secondary'}>{r}</Badge>) ?? <Badge variant="outline">No Role</Badge>}
                </div>
              </CardHeader>
              <CardContent className="text-sm">
                <InfoItem icon={Mail} label="Email" value={currentProfile.emailAddress || 'Not provided'} />
                <InfoItem icon={Phone} label="Phone" value={currentProfile.phoneNumber || 'Not set'} />
                {currentProfile.dateOfBirth && <InfoItem icon={CalendarDaysIcon} label="Date of Birth" value={formatTimestamp(currentProfile.dateOfBirth, 'MMMM d, yyyy')} />}
                <InfoItem icon={Briefcase} label="Gender" value={currentProfile.gender || 'Not specified'}/>
                {currentProfile.nationalId && <InfoItem label="National ID" value={currentProfile.nationalId} />}
                {currentProfile.address && (
                  <InfoItem icon={MapPin} label="Location" value={
                    [currentProfile.address.street, currentProfile.address.city, currentProfile.address.region, currentProfile.address.country, currentProfile.address.postalCode].filter(Boolean).join(', ') || 'Not set'
                  } />
                )}
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="font-headline text-lg flex items-center">
                  <ShieldCheck className="mr-2 h-5 w-5 text-primary" /> Account Details
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <InfoItem label="Status" value={<Badge variant={currentProfile.accountStatus === 'Active' ? 'default' : 'destructive'}>{currentProfile.accountStatus}</Badge>} />
                <InfoItem label="Member Since" value={formatTimestamp(currentProfile.registrationDate, 'MMMM d, yyyy')} />
                <InfoItem label="Last Updated" value={formatTimestamp(currentProfile.updatedAt)} />
                <InfoItem label="User ID" value={currentProfile.userId} className="text-xs break-all" />
                <InfoItem label="Firebase UID" value={currentProfile.firebaseUid} className="text-xs break-all" />
              </CardContent>
            </Card>
            
            {isAEO && (
               <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="font-headline text-lg flex items-center">
                     <MapPin className="mr-2 h-5 w-5 text-primary" /> AEO Assignment
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  <InfoItem label="Assigned Region" value={currentProfile.assignedRegion || 'Not set'} />
                  <InfoItem label="Assigned District" value={currentProfile.assignedDistrict || 'Not set'} />
                </CardContent>
              </Card>
            )}

          </div>

          <div className="md:col-span-2 space-y-6">
            {currentProfile.farmDetails && Object.keys(currentProfile.farmDetails).length > 0 && (
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="font-headline text-lg flex items-center">
                    <Building className="mr-2 h-5 w-5 text-primary" /> Farm & Hub Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  <InfoItem label="Farm Hub ID" value={currentProfile.farmDetails.linkedFarmHubId} />
                  <InfoItem label="Allocated Land" value={currentProfile.farmDetails.allocatedLandSizeAcres ? `${currentProfile.farmDetails.allocatedLandSizeAcres} acres` : 'N/A'} />
                  <InfoItem label="Crops Grown" value={currentProfile.farmDetails.cropTypesBeingGrown?.join(', ')} />
                  <InfoItem label="Irrigation Access" value={currentProfile.farmDetails.irrigationAccess !== undefined ? (currentProfile.farmDetails.irrigationAccess ? 'Yes' : 'No') : 'N/A'} />
                  <InfoItem label="Productivity Score" value={currentProfile.farmDetails.productivityScore?.toString()} />
                  {currentProfile.farmDetails.previousSeasonPerformance && <InfoItem label="Previous Season" value={currentProfile.farmDetails.previousSeasonPerformance} className="whitespace-pre-line"/>}
                </CardContent>
              </Card>
            )}

            <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="font-headline text-lg flex items-center">
                    <Settings className="mr-2 h-5 w-5 text-primary" /> Preferences & Notifications
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-3">
                  <InfoItem label="Primary Language" value={currentProfile.primaryLanguage || 'Not set'} />
                  <InfoItem label="Preferred Communication" value={currentProfile.preferredCommunicationChannel || 'Not set'} />
                  
                  <Separator />
                  <h4 className="font-medium pt-1 text-muted-foreground">Notification Channels:</h4>
                  <ul className="list-disc list-inside pl-4 text-xs">
                    <li>Email: {currentProfile.notificationPreferences?.email ? 'Enabled' : 'Disabled'}</li>
                    <li>SMS: {currentProfile.notificationPreferences?.sms ? 'Enabled' : 'Disabled'}</li>
                    <li>Push Notifications: {currentProfile.notificationPreferences?.push ? 'Enabled' : 'Disabled'}</li>
                    <li>WhatsApp: {currentProfile.notificationPreferences?.whatsApp ? 'Enabled' : 'Disabled'}</li>
                  </ul>
                  {!Object.values(currentProfile.notificationPreferences || {}).some(Boolean) && <p className="text-xs text-muted-foreground pl-4">No notification channels explicitly enabled.</p>}
                  
                  <Separator />
                  <h4 className="font-medium pt-1 text-muted-foreground">Subscribed Alerts:</h4>
                  <ul className="list-disc list-inside pl-4 text-xs">
                    <li>Daily Summary: {currentProfile.alertsToggle?.dailySummary ? 'Subscribed' : 'Not Subscribed'}</li>
                    <li>Weekly Summary: {currentProfile.alertsToggle?.weeklySummary ? 'Subscribed' : 'Not Subscribed'}</li>
                    <li>Price Alerts: {currentProfile.alertsToggle?.priceAlerts ? 'Subscribed' : 'Not Subscribed'}</li>
                    <li>Pest Alerts: {currentProfile.alertsToggle?.pestAlerts ? 'Subscribed' : 'Not Subscribed'}</li>
                  </ul>
                  {!Object.values(currentProfile.alertsToggle || {}).some(Boolean) && <p className="text-xs text-muted-foreground pl-4">No specific alerts subscribed.</p>}

                  <Separator />
                  <InfoItem label="Agricultural Tips" value={currentProfile.receiveAgriculturalTips ? 'Subscribed' : 'Not Subscribed'} />
                  <InfoItem label="Weather Updates" value={currentProfile.receiveWeatherUpdates ? 'Subscribed' : 'Not Subscribed'} />
                </CardContent>
              </Card>

              <Card className="shadow-lg border-destructive/50">
                <CardHeader>
                    <CardTitle className="font-headline text-lg flex items-center text-destructive">
                    <AlertTriangle className="mr-2 h-5 w-5" /> Advanced Settings
                    </CardTitle>
                    <CardDescription>
                    These are destructive actions. Use with caution.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive">Reset Local Data</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action will permanently delete any remaining operational data stored only in your browser, such as Tasks and Calendar Events. It will NOT delete any data from the central database (Users, Plots, Budgets, etc.).
                            <br/><br/>
                            This cannot be undone.
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleResetLocalData}>Yes, Reset Data</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                    </AlertDialog>
                    <p className="text-xs text-muted-foreground mt-4">
                        <strong>Note on User Data:</strong> To clear user and farm profiles from the central database, you must manually delete the documents from the 'users' and 'farms' collections in your Firebase Firestore console.
                    </p>
                </CardContent>
                </Card>
          </div>
        </div>
      )}
    </div>
  );
}
