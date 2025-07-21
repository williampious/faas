

'use client';

import { useState, useEffect } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { UsersRound, PlusCircle, Edit2, Loader2, AlertTriangle, UserCog, UserPlus, Link as LinkIcon, Copy, Trash2, Info, Mail } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { AgriFAASUserProfile, UserRole, AccountStatus } from '@/types/user';
import { db, isFirebaseClientConfigured } from '@/lib/firebase';
import { collection, getDocs, query, where, orderBy, doc, updateDoc, serverTimestamp, setDoc, deleteDoc } from 'firebase/firestore';
import { Alert, AlertTitle, AlertDescription as ShadcnAlertDescription } from '@/components/ui/alert';
import { useUserProfile } from '@/contexts/user-profile-context';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from '@/components/ui/table';
import { v4 as uuidv4 } from 'uuid';
import { sendInvitationEmail } from './actions';


const usersCollectionName = 'users';

const inviteUserFormSchema = z.object({
  fullName: z.string().min(2, { message: "Full name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email address." }),
  roles: z.array(z.string()).min(1, { message: "At least one role must be selected."}).optional(),
});
type InviteUserFormValues = z.infer<typeof inviteUserFormSchema>;


export default function AdminUsersPage() {
  const { userProfile, isAdmin: currentUserIsAdmin, isLoading: isAuthLoading } = useUserProfile();
  const { toast } = useToast();
  const [users, setUsers] = useState<AgriFAASUserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AgriFAASUserProfile | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<UserRole[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<AccountStatus>('Active');
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  const [isInviteUserModalOpen, setIsInviteUserModalOpen] = useState(false);
  const [isInvitingUser, setIsInvitingUser] = useState(false);
  const [inviteUserError, setInviteUserError] = useState<string | null>(null);
  const [generatedInviteLink, setGeneratedInviteLink] = useState<string | null>(null);
  const [inviteeName, setInviteeName] = useState<string | null>(null);


  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<AgriFAASUserProfile | null>(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);


  const availableRoles: UserRole[] = ['Admin', 'Manager', 'FieldOfficer', 'HRManager', 'OfficeManager', 'FinanceManager', 'Farmer', 'Investor', 'Farm Staff', 'Agric Extension Officer'];

  const inviteUserForm = useForm<InviteUserFormValues>({
    resolver: zodResolver(inviteUserFormSchema),
    defaultValues: {
      fullName: '',
      email: '',
      roles: ['Farmer'],
    },
  });

  useEffect(() => {
    const fetchUsers = async () => {
      if (isAuthLoading || !userProfile) {
        if (!isAuthLoading) { 
            setUsers([]);
            setIsLoading(false);
        }
        return;
      }

      if (!currentUserIsAdmin || !userProfile?.farmId) {
         setError("You do not have permission to view this page or your user profile is missing farm information.");
         setIsLoading(false);
         return;
      }

      setIsLoading(true);
      setError(null);

      if (!db) {
        setError("Firestore database is not available. Cannot fetch users.");
        setIsLoading(false);
        return;
      }

      try {
        const usersQuery = query(
          collection(db, usersCollectionName), 
          where("farmId", "==", userProfile.farmId),
          orderBy("fullName")
        );
        const querySnapshot = await getDocs(usersQuery);
        const fetchedUsers = querySnapshot.docs.map(docSnapshot => ({
          ...docSnapshot.data(),
          userId: docSnapshot.id,
        })) as AgriFAASUserProfile[];
        setUsers(fetchedUsers);
      } catch (err: any) {
        console.error("Error fetching users: ", err);
        let message = `Failed to fetch users: ${err.message}`;
        if (err.message?.toLowerCase().includes('requires an index')) {
          message = "Failed to load user data because a Firestore index is missing. Please create the required index for the 'users' collection (sorted by 'farmId' and 'fullName') as detailed in the README.md file."
        }
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [currentUserIsAdmin, isAuthLoading, userProfile]);

  const handleOpenEditModal = (userToEdit: AgriFAASUserProfile) => {
    setEditingUser(userToEdit);
    setSelectedRoles(userToEdit.role || []);
    setSelectedStatus(userToEdit.accountStatus || 'Active');
    setGeneratedInviteLink(null);
    setIsEditModalOpen(true);
  };

  const handleRoleChange = (role: UserRole, formType: 'edit' | 'invite') => {
    if (formType === 'edit') {
        setSelectedRoles(prev =>
          prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
        );
    } else {
        const currentRoles = inviteUserForm.getValues('roles') || [];
        const newRoles = currentRoles.includes(role)
            ? currentRoles.filter(r => r !== role)
            : [...currentRoles, role];
        inviteUserForm.setValue('roles', newRoles as UserRole[]);
    }
  };


  const handleSaveChanges = async () => {
    if (!editingUser || !editingUser.userId) {
        setError("No user selected for editing or user ID is missing.");
        return;
    }
    if (!db) {
      setError("Firestore database is not available. Cannot save changes.");
      return;
    }

    setIsSubmittingEdit(true);
    setError(null);

    try {
        const userDocRef = doc(db, usersCollectionName, editingUser.userId);
        await updateDoc(userDocRef, {
            role: selectedRoles,
            accountStatus: selectedStatus,
            updatedAt: serverTimestamp()
        });

        setUsers(users.map(u => u.userId === editingUser.userId ? {...u, role: selectedRoles, accountStatus: selectedStatus, updatedAt: new Date().toISOString() } : u));
        setIsEditModalOpen(false);
        setEditingUser(null);
        toast({title: "User Updated", description: `${editingUser.fullName}'s profile has been updated.`});
    } catch (err) {
        console.error("Error updating user:", err);
        setError(err instanceof Error ? `Failed to update user: ${err.message}` : "An unknown error occurred while updating user.");
        toast({title: "Update Failed", description: error || "Update failed", variant: "destructive"});
    } finally {
        setIsSubmittingEdit(false);
    }
  };

  const handleInviteUserSubmit: SubmitHandler<InviteUserFormValues> = async (data) => {
    if (!isFirebaseClientConfigured || !db) {
        setInviteUserError("Firebase is not configured correctly. Cannot invite user.");
        return;
    }
    if (!userProfile?.farmId || !userProfile.fullName) {
      setInviteUserError("Your admin profile is missing a farm ID or name. Cannot invite users to a farm.");
      return;
    }

    setIsInvitingUser(true);
    setInviteUserError(null);
    setGeneratedInviteLink(null);

    const usersRef = collection(db, usersCollectionName);
    const q = query(usersRef, where("emailAddress", "==", data.email));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
        setInviteUserError("This email address is already associated with an account or an existing invitation.");
        setIsInvitingUser(false);
        return;
    }

    const invitationToken = uuidv4();
    const temporaryUserId = uuidv4();
    
    const selectedRoles = (data.roles as UserRole[]) || ['Farmer'];
    
    const newUserProfile: Partial<AgriFAASUserProfile> & { createdAt: any, updatedAt: any } = {
        userId: temporaryUserId,
        fullName: data.fullName,
        emailAddress: data.email,
        role: selectedRoles,
        accountStatus: 'Invited',
        registrationDate: new Date().toISOString(),
        invitationToken: invitationToken,
        avatarUrl: `https://placehold.co/100x100.png?text=${data.fullName.charAt(0)}`,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        farmId: userProfile.farmId,
    };


    try {
        await setDoc(doc(db, usersCollectionName, temporaryUserId), newUserProfile);

        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin;
        const inviteLink = `${baseUrl}/auth/complete-registration?token=${invitationToken}`;
        setGeneratedInviteLink(inviteLink);
        setInviteeName(data.fullName);

        // Send email notification by calling the server action
        const emailResult = await sendInvitationEmail({
            to: data.email,
            subject: `You're invited to join ${userProfile.fullName}'s farm on AgriFAAS Connect!`,
            html: `
              <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                <h2>Hello ${data.fullName},</h2>
                <p>You have been invited by <strong>${userProfile.fullName}</strong> to join their farm on AgriFAAS Connect, a collaborative farm management platform.</p>
                <p>To accept the invitation and set up your account, please click the link below:</p>
                <p style="text-align: center;">
                  <a href="${inviteLink}" style="background-color: #8CC63F; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Complete Your Registration</a>
                </p>
                <p>If you cannot click the button, please copy and paste this link into your browser:</p>
                <p><a href="${inviteLink}">${inviteLink}</a></p>
                <p>This invitation link is unique to you and should not be shared.</p>
                <br>
                <p>Thank you,</p>
                <p>The AgriFAAS Connect Team</p>
              </div>
            `,
        });

        if (emailResult.success) {
            toast({title: "User Invited Successfully!", description: `${data.fullName} has been invited and an email has been sent.`});
        } else {
            toast({title: "User Invited (Email Failed)", description: `An invitation record was created, but the email could not be sent. Please copy the link manually. Error: ${emailResult.message}`, variant: "destructive", duration: 10000});
        }
        
        const displayProfile: AgriFAASUserProfile = {
            ...newUserProfile,
            userId: temporaryUserId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        } as AgriFAASUserProfile;
        setUsers(prevUsers => [...prevUsers, displayProfile].sort((a,b) => (a.fullName || '').localeCompare(b.fullName || '')));

    } catch (err: any) {
        console.error("Error inviting new user:", err);
        setInviteUserError(`Failed to invite user: ${err.message || "An unknown error occurred."}`);
    } finally {
        setIsInvitingUser(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({ title: "Copied!", description: "Invitation link copied to clipboard." });
    }).catch(err => {
      toast({ title: "Copy Failed", description: "Could not copy link.", variant: "destructive" });
    });
  };

  const handleOpenDeleteConfirm = (user: AgriFAASUserProfile) => {
    setUserToDelete(user);
    setIsDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete || !db) {
      toast({ title: "Error", description: "No user selected for deletion or database unavailable.", variant: "destructive" });
      setIsDeleteConfirmOpen(false);
      return;
    }
    setIsDeletingUser(true);
    try {
      await deleteDoc(doc(db, usersCollectionName, userToDelete.userId));
      setUsers(users.filter(u => u.userId !== userToDelete.userId));
      toast({ title: "User Profile Deleted", description: `${userToDelete.fullName}'s profile has been removed from Firestore.` });
    } catch (err: any) {
      console.error("Error deleting user profile:", err);
      toast({ title: "Deletion Failed", description: `Could not delete profile: ${err.message}`, variant: "destructive" });
    } finally {
      setIsDeletingUser(false);
      setIsDeleteConfirmOpen(false);
      setUserToDelete(null);
    }
  };


  if (isAuthLoading || (isLoading && !users.length && !error)) {
    return (
      <div className="flex justify-center items-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">Loading farm user data...</p>
      </div>
    );
  }

  if (error && (!isLoading || users.length === 0) ) {
     return (
        <div className="container mx-auto py-10">
         <Alert variant="destructive" className="mb-6 max-w-lg mx-auto">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Operation Failed</AlertTitle>
            <ShadcnAlertDescription>{error}</ShadcnAlertDescription>
        </Alert>
        </div>
     );
  }

  if (!currentUserIsAdmin && !isAuthLoading){
      return (
           <div className="container mx-auto py-10">
             <Alert variant="destructive" className="mb-6 max-w-lg mx-auto">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Access Denied</AlertTitle>
                <ShadcnAlertDescription>You do not have permission to view this page.</ShadcnAlertDescription>
            </Alert>
           </div>
      );
  }


  return (
    <div>
      <PageHeader
        title="Farm User Management"
        icon={UsersRound}
        description="View, manage roles, and invite new users to your farm."
        action={
          <Button onClick={() => { 
            inviteUserForm.reset({ fullName: '', email: '', roles: ['Farmer'] }); 
            setInviteUserError(null); 
            setGeneratedInviteLink(null); 
            setIsInviteUserModalOpen(true); 
          }}>
            <UserPlus className="mr-2 h-4 w-4" /> Invite New User
          </Button>
        }
      />

      <Dialog open={isInviteUserModalOpen} onOpenChange={(isOpen) => {
          if (isInvitingUser && !isOpen) return;
          setIsInviteUserModalOpen(isOpen);
          if (!isOpen) { 
            inviteUserForm.reset({ fullName: '', email: '', roles: ['Farmer'] }); 
            setInviteUserError(null); 
            setGeneratedInviteLink(null); 
          }
      }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
            <DialogHeader>
                <DialogTitle className="flex items-center"><UserPlus className="mr-2 h-5 w-5" />Invite New User to Your Farm</DialogTitle>
                <DialogDescription>Enter the user's details to send them an email invitation to join your farm.</DialogDescription>
            </DialogHeader>
            <div className="flex-grow overflow-y-auto pr-2 py-4">
                <Form {...inviteUserForm}>
                    <form id="invite-user-form" onSubmit={inviteUserForm.handleSubmit(handleInviteUserSubmit)} className="space-y-4">
                        {inviteUserError && (
                            <Alert variant="destructive" className="mb-4">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertTitle>Error Adding User</AlertTitle>
                                <ShadcnAlertDescription>{inviteUserError}</ShadcnAlertDescription>
                            </Alert>
                        )}
                        {generatedInviteLink ? (
                          <div className="space-y-3 p-4 border rounded-md bg-green-50 dark:bg-green-900/20">
                            <p className="text-sm font-medium text-green-700 dark:text-green-300">Invitation Sent to {inviteeName}!</p>
                            <p className="text-xs text-muted-foreground">If they did not receive the email, you can copy this link and send it to them manually:</p>
                            <div className="flex items-center gap-2">
                              <Input type="text" readOnly value={generatedInviteLink} className="text-xs" />
                              <Button type="button" size="icon" variant="ghost" onClick={() => copyToClipboard(generatedInviteLink)}>
                                <Copy className="h-4 w-4" />
                              </Button>
                            </div>
                             <Button type="button" variant="outline" size="sm" onClick={() => { 
                               inviteUserForm.reset({ fullName: '', email: '', roles: ['Farmer'] }); 
                               setInviteUserError(null); 
                               setGeneratedInviteLink(null); 
                             }}>Invite Another User</Button>
                          </div>
                        ) : (
                          <>
                            <FormField control={inviteUserForm.control} name="fullName" render={({ field }) => (
                                <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="John Doe" {...field} disabled={isInvitingUser} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={inviteUserForm.control} name="email" render={({ field }) => (
                                <FormItem><FormLabel>Email Address</FormLabel><FormControl><Input type="email" placeholder="user@example.com" {...field} disabled={isInvitingUser} /></FormControl><FormMessage /></FormItem>
                            )} />

                            <div>
                                <Label className="font-semibold">Assign Roles</Label>
                                <FormDescription className="text-xs mb-1">Select initial roles for the invited user. 'Farmer' is common.</FormDescription>
                                <FormField control={inviteUserForm.control} name="roles" render={({ field }) => (
                                  <FormItem>
                                    <div className="mt-2 grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border p-2 rounded-md">
                                        {availableRoles.map(role => {
                                            const currentSelectedRoles = inviteUserForm.watch('roles') || [];
                                            return (
                                                <div key={role} className="flex items-center space-x-2 p-1 hover:bg-muted/50 rounded-md">
                                                    <Checkbox
                                                        id={`invite-role-${role}`}
                                                        value={role}
                                                        checked={currentSelectedRoles.includes(role)}
                                                        onCheckedChange={(checked) => {
                                                          const currentVal = field.value || [];
                                                          if (checked) {
                                                            field.onChange([...currentVal, role]);
                                                          } else {
                                                            field.onChange(currentVal.filter(r => r !== role));
                                                          }
                                                        }}
                                                        disabled={isInvitingUser}
                                                    />
                                                    <Label htmlFor={`invite-role-${role}`} className="text-sm font-normal cursor-pointer">{role}</Label>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <FormMessage />
                                  </FormItem>
                                )} />
                            </div>
                          </>
                        )}
                    </form>
                </Form>
            </div>
            <DialogFooter className="py-4 px-6 border-t">
                <DialogClose asChild><Button variant="outline" disabled={isInvitingUser} onClick={() => setGeneratedInviteLink(null)}>Close</Button></DialogClose>
                {!generatedInviteLink && (
                  <Button type="submit" form="invite-user-form" disabled={isInvitingUser}>
                      {isInvitingUser ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
                      {isInvitingUser ? 'Processing...' : 'Send Invitation'}
                  </Button>
                )}
            </DialogFooter>
        </DialogContent>
      </Dialog>


      <Dialog open={isEditModalOpen} onOpenChange={(isOpen) => {
          if (isSubmittingEdit && !isOpen) return;
          setIsEditModalOpen(isOpen);
          if (!isOpen) setEditingUser(null);
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
                <UserCog className="mr-2 h-5 w-5"/> Edit User: {editingUser?.fullName}
            </DialogTitle>
            <DialogDescription>
              Modify roles and account status. Current Email: {editingUser?.emailAddress}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {error && isSubmittingEdit && (
                 <Alert variant="destructive" className="mb-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Update Error</AlertTitle>
                    <ShadcnAlertDescription>{error}</ShadcnAlertDescription>
                </Alert>
            )}
            <div>
                <Label htmlFor="roles" className="font-semibold">Roles</Label>
                <p className="text-xs text-muted-foreground mb-2">Select one or more roles for the user.</p>
                <div className="mt-2 grid grid-cols-2 gap-2 max-h-60 overflow-y-auto border p-2 rounded-md">
                    {availableRoles.map(role => (
                        <div key={role} className="flex items-center space-x-2 p-1 hover:bg-muted/50 rounded-md">
                            <Checkbox
                                id={`edit-role-${role}`}
                                value={role}
                                checked={selectedRoles.includes(role)}
                                onCheckedChange={() => handleRoleChange(role, 'edit')}
                                className="form-checkbox h-4 w-4 text-primary rounded border-gray-300 focus:ring-primary"
                                disabled={isSubmittingEdit || editingUser?.accountStatus === 'Invited'}
                            />
                            <Label htmlFor={`edit-role-${role}`} className="text-sm font-normal cursor-pointer">{role}</Label>
                        </div>
                    ))}
                </div>
            </div>
             <div>
                <Label htmlFor="accountStatus" className="font-semibold">Account Status</Label>
                <Select value={selectedStatus} onValueChange={(value) => setSelectedStatus(value as AccountStatus)} disabled={isSubmittingEdit || editingUser?.accountStatus === 'Invited'}>
                    <SelectTrigger id="accountStatus" className="mt-1">
                        <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Invited" disabled>Invited (Managed via invite link)</SelectItem>
                        <SelectItem value="Suspended">Suspended</SelectItem>
                        <SelectItem value="PendingVerification">Pending Verification</SelectItem>
                        <SelectItem value="Deactivated">Deactivated</SelectItem>
                    </SelectContent>
                </Select>
                {editingUser?.accountStatus === 'Invited' && <p className="text-xs text-destructive mt-1">User must complete registration via invite link to change status from 'Invited'.</p>}
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" disabled={isSubmittingEdit}>Cancel</Button>
            </DialogClose>
            <Button onClick={handleSaveChanges} disabled={isSubmittingEdit || editingUser?.accountStatus === 'Invited'}>
              {isSubmittingEdit && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmittingEdit ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm User Profile Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              {userToDelete?.accountStatus === 'Invited' ? (
                <>
                  Are you sure you want to revoke this invitation and delete the pending profile for <strong>{userToDelete?.fullName}</strong> ({userToDelete?.emailAddress})?
                  <br />
                  <span className="font-semibold text-destructive mt-2 block">
                    This will make the invitation link invalid. The user will not be able to complete their registration unless you invite them again.
                  </span>
                  This action cannot be undone.
                </>
              ) : (
                <>
                  Are you sure you want to delete the Firestore profile for <strong>{userToDelete?.fullName}</strong> ({userToDelete?.emailAddress})?
                  <br />
                  <span className="font-semibold text-destructive mt-2 block">
                    Important: This action only removes the user's data from the application database (Firestore). It does NOT delete their authentication account from Firebase Auth. The user might still be able to log in if their auth account exists.
                  </span>
                  This action cannot be undone.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setUserToDelete(null)} disabled={isDeletingUser}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} disabled={isDeletingUser} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isDeletingUser && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isDeletingUser ? 'Deleting...' : userToDelete?.accountStatus === 'Invited' ? 'Revoke & Delete' : 'Delete Profile Data'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>


      <Card className="shadow-lg">
        <CardContent className="pt-6">
          <Table>
            <TableCaption>{users.length === 0 ? "No other users found on your farm." : "A list of all users on your farm."}</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Full Name</TableHead>
                <TableHead>Email Address</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.userId}>
                  <TableCell className="font-medium">{user.fullName}</TableCell>
                  <TableCell>{user.emailAddress}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {user.role?.map(r => <Badge key={r} variant={r === 'Admin' ? 'default' : 'secondary'}>{r}</Badge>)}
                      {(!user.role || user.role.length === 0) && <Badge variant="outline">No Roles Assigned</Badge>}
                    </div>
                  </TableCell>
                  <TableCell>
                     <Badge variant={
                        user.accountStatus === 'Active' ? 'default' :
                        user.accountStatus === 'Invited' ? 'outline' :
                        (user.accountStatus === 'Suspended' || user.accountStatus === 'Deactivated' ? 'destructive' : 'secondary')
                      }>
                        {user.accountStatus}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button variant="outline" size="sm" onClick={() => handleOpenEditModal(user)} className="h-8 px-2">
                      <Edit2 className="h-3.5 w-3.5 mr-1" /> Manage
                    </Button>
                    {user.accountStatus === 'Invited' && user.invitationToken && (
                       <Button variant="link" size="sm" onClick={() => {
                         const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin;
                         const link = `${baseUrl}/auth/complete-registration?token=${user.invitationToken}`;
                         copyToClipboard(link);
                       }} className="h-8 px-2">
                        <LinkIcon className="h-3.5 w-3.5 mr-1" /> Copy Invite
                      </Button>
                    )}
                    <Button variant="destructive" size="sm" onClick={() => handleOpenDeleteConfirm(user)} className="h-8 px-2">
                      <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
       <Card className="mt-6 bg-muted/30 p-4">
        <CardHeader className="p-0 pb-2">
            <CardTitle className="text-base font-semibold text-muted-foreground">Admin User Management Notes</CardTitle>
        </CardHeader>
        <CardContent className="p-0 text-xs text-muted-foreground space-y-1">
            <p>&bull; This page lists all users associated with **your farm**.</p>
            <p>&bull; Use "Invite New User" to send an email invitation with a registration link to a new team member.</p>
            <p>&bull; For users with 'Invited' status, you can copy their invitation link again if they did not receive the email. Their roles/status cannot be edited until they complete registration.</p>
            <p>&bull; <strong>Profile Deletion:</strong> The "Delete" button removes the user's data from Firestore only. It <span className="font-bold">DOES NOT</span> delete their Firebase Authentication account. This action is primarily for cleaning up test data or revoking invitations.</p>
        </CardContent>
      </Card>
    </div>
  );
}
