
'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { UsersRound, PlusCircle, Edit2, Loader2, AlertTriangle, UserCog } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { AgriFAASUserProfile, UserRole } from '@/types/user';
import { db, isFirebaseClientConfigured } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, doc, updateDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { Alert, AlertTitle, AlertDescription as ShadcnAlertDescription } from '@/components/ui/alert';
import { useUserProfile } from '@/contexts/user-profile-context'; 

const usersCollectionName = 'users';

export default function AdminUsersPage() {
  const { isAdmin: currentUserIsAdmin, isLoading: isAuthLoading } = useUserProfile();
  const [users, setUsers] = useState<AgriFAASUserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AgriFAASUserProfile | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<UserRole[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<AgriFAASUserProfile['accountStatus']>('Active');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Updated list of roles an Admin can assign
  const availableRoles: UserRole[] = ['Admin', 'Manager', 'FieldOfficer', 'HRManager', 'Farmer', 'Investor', 'Farm Staff', 'Agric Extension Officer'];


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

  const handleRoleChange = (role: UserRole) => {
    setSelectedRoles(prev => 
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
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

    setIsSubmitting(true);
    setError(null);

    try {
        const userDocRef = doc(db, usersCollectionName, editingUser.userId);
        await updateDoc(userDocRef, {
            role: selectedRoles,
            accountStatus: selectedStatus,
            updatedAt: serverTimestamp() 
        });
        
        setUsers(users.map(u => u.userId === editingUser.userId ? {...u, role: selectedRoles, accountStatus: selectedStatus } : u));
        setIsEditModalOpen(false);
        setEditingUser(null);
    } catch (err) {
        console.error("Error updating user:", err);
        setError(err instanceof Error ? `Failed to update user: ${err.message}` : "An unknown error occurred while updating user.");
    } finally {
        setIsSubmitting(false);
    }
  };


  if (isAuthLoading || (isLoading && !users.length && !error)) { // Added !error condition here
    return (
      <div className="flex justify-center items-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">Loading user data...</p>
      </div>
    );
  }
  
  if (error && (!isLoading || users.length === 0) ) {  // Display error if loading is done OR if there are no users to show alongside the error
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
          <Button disabled> 
            <PlusCircle className="mr-2 h-4 w-4" /> Add New User (Invite System Coming Soon)
          </Button>
        }
      />

      <Dialog open={isEditModalOpen} onOpenChange={(isOpen) => {
          if (isSubmitting && !isOpen) return;
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
            {error && isSubmitting && ( 
                 <Alert variant="destructive" className="mb-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Update Error</AlertTitle>
                    <ShadcnAlertDescription>{error}</ShadcnAlertDescription>
                </Alert>
            )}
            <div>
                <Label htmlFor="roles" className="font-semibold">Roles</Label>
                <p className="text-xs text-muted-foreground mb-2">Select one or more roles for the user.</p>
                <div className="mt-2 grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                    {availableRoles.map(role => (
                        <div key={role} className="flex items-center space-x-2 p-1 hover:bg-muted/50 rounded-md">
                            <input 
                                type="checkbox" 
                                id={`role-${role}`} 
                                value={role} 
                                checked={selectedRoles.includes(role)}
                                onChange={() => handleRoleChange(role)}
                                className="form-checkbox h-4 w-4 text-primary rounded border-gray-300 focus:ring-primary"
                                disabled={isSubmitting}
                            />
                            <Label htmlFor={`role-${role}`} className="text-sm font-normal cursor-pointer">{role}</Label>
                        </div>
                    ))}
                </div>
            </div>
             <div>
                <Label htmlFor="accountStatus" className="font-semibold">Account Status</Label>
                <Select value={selectedStatus} onValueChange={(value) => setSelectedStatus(value as AgriFAASUserProfile['accountStatus'])} disabled={isSubmitting}>
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
              <Button variant="outline" disabled={isSubmitting}>Cancel</Button>
            </DialogClose>
            <Button onClick={handleSaveChanges} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      <Card className="shadow-lg">
        <CardContent className="pt-6">
          <Table>
            {users.length === 0 && !isLoading && <TableCaption>No users found. New users will appear here after registration.</TableCaption>}
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
            <p>&bull; This page allows Admins to view all registered users and modify their roles and account status.</p>
            <p>&bull; The first user to register automatically becomes an 'Admin'. Subsequent users register with no roles and must be assigned roles here.</p>
            <p>&bull; Available roles for assignment now include: Manager, FieldOfficer, HRManager, and others.</p>
            <p>&bull; An 'Invite New User' system is planned for future development.</p>
        </CardContent>
      </Card>
    </div>
  );
}
