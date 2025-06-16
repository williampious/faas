
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'; 
import { UsersRound, PlusCircle, Edit2, Loader2, AlertTriangle, UserCog, UserPlus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { AgriFAASUserProfile, UserRole } from '@/types/user';
import { auth, db, isFirebaseClientConfigured } from '@/lib/firebase'; // Added auth
import { createUserWithEmailAndPassword } from 'firebase/auth'; // Added for user creation
import { collection, getDocs, query, orderBy, doc, updateDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { Alert, AlertTitle, AlertDescription as ShadcnAlertDescription } from '@/components/ui/alert';
import { useUserProfile } from '@/contexts/user-profile-context'; 
import { useToast } from '@/hooks/use-toast';


const usersCollectionName = 'users';

const addUserFormSchema = z.object({
  fullName: z.string().min(2, { message: "Full name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  roles: z.array(z.string()).optional(), // Assuming roles are string identifiers
});
type AddUserFormValues = z.infer<typeof addUserFormSchema>;


export default function AdminUsersPage() {
  const { isAdmin: currentUserIsAdmin, isLoading: isAuthLoading } = useUserProfile();
  const { toast } = useToast();
  const [users, setUsers] = useState<AgriFAASUserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AgriFAASUserProfile | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<UserRole[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<AgriFAASUserProfile['accountStatus']>('Active');
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [addUserError, setAddUserError] = useState<string | null>(null);
  

  const availableRoles: UserRole[] = ['Admin', 'Manager', 'FieldOfficer', 'HRManager', 'Farmer', 'Investor', 'Farm Staff', 'Agric Extension Officer'];

  const addUserForm = useForm<AddUserFormValues>({
    resolver: zodResolver(addUserFormSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      roles: [],
    },
  });


  useEffect(() => {
    const fetchUsers = async () => {
      if (!currentUserIsAdmin && !isAuthLoading) {
         setError("You do not have permission to view this page.");
         setIsLoading(false);
         return;
      }
      if (isAuthLoading) return; 

      setIsLoading(true);
      setError(null);

      if (!isFirebaseClientConfigured) {
        setError("Firebase client configuration is missing. Cannot fetch users.");
        setIsLoading(false);
        return;
      }
      if (!db) {
        setError("Firestore database is not available. Cannot fetch users.");
        setIsLoading(false);
        return;
      }

      try {
        const usersQuery = query(collection(db, usersCollectionName), orderBy("fullName"));
        const querySnapshot = await getDocs(usersQuery);
        const fetchedUsers = querySnapshot.docs.map(docSnapshot => ({
          ...docSnapshot.data(),
          userId: docSnapshot.id, 
        })) as AgriFAASUserProfile[];
        setUsers(fetchedUsers);
      } catch (err) {
        console.error("Error fetching users: ", err);
        setError(err instanceof Error ? `Failed to fetch users: ${err.message}` : "An unknown error occurred while fetching users.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [currentUserIsAdmin, isAuthLoading]);

  const handleOpenEditModal = (userToEdit: AgriFAASUserProfile) => {
    setEditingUser(userToEdit);
    setSelectedRoles(userToEdit.role || []);
    setSelectedStatus(userToEdit.accountStatus || 'Active');
    setIsEditModalOpen(true);
  };

  const handleRoleChange = (role: UserRole, formType: 'edit' | 'add') => {
    if (formType === 'edit') {
        setSelectedRoles(prev => 
          prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
        );
    } else { // 'add'
        const currentRoles = addUserForm.getValues('roles') || [];
        const newRoles = currentRoles.includes(role)
            ? currentRoles.filter(r => r !== role)
            : [...currentRoles, role];
        addUserForm.setValue('roles', newRoles as UserRole[]);
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
        toast({title: "Update Failed", description: error, variant: "destructive"});
    } finally {
        setIsSubmittingEdit(false);
    }
  };

  const handleAddUserSubmit: SubmitHandler<AddUserFormValues> = async (data) => {
    if (!isFirebaseClientConfigured || !auth || !db) {
        setAddUserError("Firebase is not configured correctly. Cannot add user.");
        return;
    }
    setIsAddingUser(true);
    setAddUserError(null);

    let createdFirebaseUserUid: string | null = null;

    try {
        // 1. Create user in Firebase Authentication
        const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
        createdFirebaseUserUid = userCredential.user.uid;

        // 2. Create user profile in Firestore
        const newUserProfile: Omit<AgriFAASUserProfile, 'createdAt' | 'updatedAt'> & { createdAt: any, updatedAt: any } = {
            userId: createdFirebaseUserUid,
            firebaseUid: createdFirebaseUserUid,
            fullName: data.fullName,
            emailAddress: data.email,
            role: (data.roles as UserRole[]) || [],
            accountStatus: 'Active', // Or 'PendingVerification' if you have such a flow
            registrationDate: new Date().toISOString(),
            avatarUrl: `https://placehold.co/100x100.png?text=${data.fullName.charAt(0)}`,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };

        await setDoc(doc(db, usersCollectionName, createdFirebaseUserUid), newUserProfile);

        // 3. Update local state and close modal
        // Add the user to the local list for immediate UI update
        // Note: Firestore serverTimestamp won't be resolved locally immediately, so we use ISO string for now.
        const displayProfile: AgriFAASUserProfile = {
            ...newUserProfile,
            createdAt: new Date().toISOString(), // Approximate for local display
            updatedAt: new Date().toISOString(), // Approximate for local display
        };
        setUsers(prevUsers => [...prevUsers, displayProfile].sort((a,b) => (a.fullName || '').localeCompare(b.fullName || '')));
        
        setIsAddUserModalOpen(false);
        addUserForm.reset();
        toast({title: "User Created", description: `${data.fullName} has been successfully added.`});

    } catch (err: any) {
        console.error("Error adding new user:", err);
        if (err.code === 'auth/email-already-in-use') {
            setAddUserError("This email address is already in use. Please use a different email.");
        } else if (err.code && err.code.startsWith('auth/')) {
            setAddUserError(`Authentication error: ${err.message}`);
        } else if (createdFirebaseUserUid) {
            // Auth user was created, but Firestore failed
            setAddUserError(`User authentication account for ${data.email} was created, but saving the profile to the database failed: ${err.message}. Please resolve this manually in Firebase console or try deleting the auth user and retrying.`);
             // Ideally, try to delete the auth user here if Admin SDK was available via backend
        } else {
            setAddUserError(`Failed to add user: ${err.message || "An unknown error occurred."}`);
        }
    } finally {
        setIsAddingUser(false);
    }
  };


  if (isAuthLoading || (isLoading && !users.length && !error)) { 
    return (
      <div className="flex justify-center items-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">Loading user data...</p>
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
        title="User Management"
        icon={UsersRound}
        description="View, manage, and assign roles to AgriFAAS Connect users."
        action={
          <Button onClick={() => { addUserForm.reset(); setAddUserError(null); setIsAddUserModalOpen(true); }}> 
            <UserPlus className="mr-2 h-4 w-4" /> Add New User
          </Button>
        }
      />

      {/* Add User Dialog */}
      <Dialog open={isAddUserModalOpen} onOpenChange={(isOpen) => {
          if (isAddingUser && !isOpen) return; // Prevent closing while submitting
          setIsAddUserModalOpen(isOpen);
          if (!isOpen) { addUserForm.reset(); setAddUserError(null); }
      }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
            <DialogHeader>
                <DialogTitle className="flex items-center"><UserPlus className="mr-2 h-5 w-5" />Add New User</DialogTitle>
                <DialogDescription>Create a new user account. They will need to be informed of their initial password.</DialogDescription>
            </DialogHeader>
            <div className="flex-grow overflow-y-auto pr-2 py-4">
                <Form {...addUserForm}>
                    <form id="add-user-form" onSubmit={addUserForm.handleSubmit(handleAddUserSubmit)} className="space-y-4">
                        {addUserError && (
                            <Alert variant="destructive" className="mb-4">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertTitle>Error Adding User</AlertTitle>
                                <ShadcnAlertDescription>{addUserError}</ShadcnAlertDescription>
                            </Alert>
                        )}
                        <FormField control={addUserForm.control} name="fullName" render={({ field }) => (
                            <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="John Doe" {...field} disabled={isAddingUser} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={addUserForm.control} name="email" render={({ field }) => (
                            <FormItem><FormLabel>Email Address</FormLabel><FormControl><Input type="email" placeholder="user@example.com" {...field} disabled={isAddingUser} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={addUserForm.control} name="password" render={({ field }) => (
                            <FormItem><FormLabel>Initial Password</FormLabel><FormControl><Input type="password" placeholder="••••••••" {...field} disabled={isAddingUser} /></FormControl><FormMessage /></FormItem>
                        )} />
                        
                        <div>
                            <Label className="font-semibold">Roles</Label>
                            <p className="text-xs text-muted-foreground mb-2">Assign initial roles to the user.</p>
                            <div className="mt-2 grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border p-2 rounded-md">
                                {availableRoles.map(role => {
                                    const currentSelectedRoles = addUserForm.watch('roles') || [];
                                    return (
                                        <div key={role} className="flex items-center space-x-2 p-1 hover:bg-muted/50 rounded-md">
                                            <input 
                                                type="checkbox" 
                                                id={`add-role-${role}`} 
                                                value={role} 
                                                checked={currentSelectedRoles.includes(role)}
                                                onChange={() => handleRoleChange(role, 'add')}
                                                className="form-checkbox h-4 w-4 text-primary rounded border-gray-300 focus:ring-primary"
                                                disabled={isAddingUser}
                                            />
                                            <Label htmlFor={`add-role-${role}`} className="text-sm font-normal cursor-pointer">{role}</Label>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </form>
                </Form>
            </div>
            <DialogFooter className="py-4 px-6 border-t">
                <DialogClose asChild><Button variant="outline" disabled={isAddingUser}>Cancel</Button></DialogClose>
                <Button type="submit" form="add-user-form" disabled={isAddingUser}>
                    {isAddingUser && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isAddingUser ? 'Adding User...' : 'Add User'}
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>


      {/* Edit User Dialog */}
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
                            <input 
                                type="checkbox" 
                                id={`edit-role-${role}`} 
                                value={role} 
                                checked={selectedRoles.includes(role)}
                                onChange={() => handleRoleChange(role, 'edit')}
                                className="form-checkbox h-4 w-4 text-primary rounded border-gray-300 focus:ring-primary"
                                disabled={isSubmittingEdit}
                            />
                            <Label htmlFor={`edit-role-${role}`} className="text-sm font-normal cursor-pointer">{role}</Label>
                        </div>
                    ))}
                </div>
            </div>
             <div>
                <Label htmlFor="accountStatus" className="font-semibold">Account Status</Label>
                <Select value={selectedStatus} onValueChange={(value) => setSelectedStatus(value as AgriFAASUserProfile['accountStatus'])} disabled={isSubmittingEdit}>
                    <SelectTrigger id="accountStatus" className="mt-1">
                        <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Suspended">Suspended</SelectItem>
                        <SelectItem value="PendingVerification">Pending Verification</SelectItem>
                        <SelectItem value="Deactivated">Deactivated</SelectItem>
                    </SelectContent>
                </Select>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" disabled={isSubmittingEdit}>Cancel</Button>
            </DialogClose>
            <Button onClick={handleSaveChanges} disabled={isSubmittingEdit}>
              {isSubmittingEdit && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmittingEdit ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      <Card className="shadow-lg">
        <CardContent className="pt-6">
          <Table>
            {users.length === 0 && !isLoading && <TableCaption>No users found. New users will appear here after registration or creation.</TableCaption>}
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
                     <Badge variant={user.accountStatus === 'Active' ? 'default' : (user.accountStatus === 'Suspended' || user.accountStatus === 'Deactivated' ? 'destructive' : 'outline')}>
                        {user.accountStatus}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => handleOpenEditModal(user)}>
                      <Edit2 className="h-3.5 w-3.5 mr-1" /> Edit
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
            <p>&bull; This page allows Admins to view all registered users, modify their roles and account status, and create new users (via the "Add New User" button).</p>
            <p>&bull; When adding a new user directly, you will set their initial password. Please communicate this securely to the user and advise them to change it upon first login.</p>
            <p>&bull; The first user to register with the application automatically becomes an 'Admin'. Subsequent users register with no roles by default (unless created directly by an Admin with roles).</p>
            <p>&bull; For users to register themselves: direct them to the standard registration page (typically found at your app's URL followed by /auth/register). Once registered, they will appear in this list, and you can then assign them appropriate roles using the 'Edit' button.</p>
            <p>&bull; A more advanced 'Invite New User' system (e.g., via email link with pre-assigned roles) is planned for future development.</p>
        </CardContent>
      </Card>
    </div>
  );
}

