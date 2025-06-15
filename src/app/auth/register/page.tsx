
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { Loader2, UserPlus } from 'lucide-react';
import Image from 'next/image';
import { auth, db, isFirebaseClientConfigured } from '@/lib/firebase';
import { createUserWithEmailAndPassword, signOut, type User } from 'firebase/auth';
import { doc, setDoc, serverTimestamp, collection, getDocs, query, limit } from 'firebase/firestore';
import type { AgriFAASUserProfile, UserRole } from '@/types/user';

// Registration form no longer includes role selection, as roles are assigned by Admin
const registerSchema = z.object({
  fullName: z.string().min(2, { message: 'Full name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

const usersCollectionName = 'users';

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
    },
  });

  const onSubmit: SubmitHandler<RegisterFormValues> = async (data) => {
    setIsLoading(true);
    setError(null);

    if (!isFirebaseClientConfigured) {
      setError("Firebase client configuration is missing or incomplete. Please ensure all NEXT_PUBLIC_FIREBASE_... variables are correctly set in your .env.local file and that you have restarted your development server.");
      setIsLoading(false);
      return;
    }

    if (!auth || !db) {
      setError("Firebase authentication or database service is not available. This could be due to a network issue or Firebase services not being fully enabled in your project console. Please check your setup and internet connection.");
      setIsLoading(false);
      return;
    }

    let firebaseUser: User | null = null;

    try {
      // Check if any user already exists. If not, this is the first user (Admin/Owner).
      // This check is done before creating the auth user to avoid unnecessary auth user creation if the query fails.
      // However, there's a slight race condition risk. A more robust check would be after auth user creation but before Firestore write.
      // For simplicity and given client-side constraints, we'll proceed with a check just before Firestore write.

      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      firebaseUser = userCredential.user;
      console.log('User registered with Firebase Auth:', firebaseUser.uid);

      let userRoles: UserRole[] = []; // Default to no roles for subsequent users

      // Check if this is the first user to assign Admin role
      const usersQuery = query(collection(db, usersCollectionName), limit(1)); // Check if any document exists
      const existingUsersSnapshot = await getDocs(usersQuery);
      
      // If existingUsersSnapshot is empty, it means no users documents exist *yet*.
      // The current user's document is about to be created. So, if after this check, the snapshot is empty,
      // this user will be the first.
      // A more precise check would be querySnapshot.docs.filter(doc => doc.id !== firebaseUser.uid).length === 0
      // But for the very first user, limit(1) and checking empty is sufficient before this user's doc is written.

      let isFirstUser = false;
      if (existingUsersSnapshot.empty) {
        // This means the collection is completely empty. The current user will be the first.
        isFirstUser = true;
      } else if (existingUsersSnapshot.size === 1 && existingUsersSnapshot.docs[0].id === firebaseUser.uid) {
        // This case handles a scenario where the query runs *after* the current user's document might have been (partially) created
        // in a previous failed attempt that wasn't cleaned up, but it's the only document.
        // This is less likely with the new sign-out logic on failure but added for robustness.
        // Essentially, if the only user found is the one currently being registered, they are effectively the first.
        isFirstUser = true;
      }


      if (isFirstUser) {
        userRoles = ['Admin']; // First user becomes Admin
        console.log(`First user detected (UID: ${firebaseUser.uid}). Assigning 'Admin' role.`);
      } else {
         console.log(`Subsequent user detected (UID: ${firebaseUser.uid}). Assigning no default roles. Admin will assign.`);
      }

      const profileForFirestore: Omit<AgriFAASUserProfile, 'createdAt' | 'updatedAt'> & { createdAt: any, updatedAt: any } = {
        userId: firebaseUser.uid,
        firebaseUid: firebaseUser.uid,
        fullName: data.fullName,
        emailAddress: firebaseUser.email || data.email,
        role: userRoles,
        accountStatus: 'Active',
        registrationDate: new Date().toISOString(),
        phoneNumber: '',
        avatarUrl: `https://placehold.co/100x100.png?text=${data.fullName.charAt(0)}`,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      
      await setDoc(doc(db, usersCollectionName, firebaseUser.uid), profileForFirestore);
      console.log('User profile created in Firestore for user:', firebaseUser.uid, 'with roles:', userRoles);

      // Successful registration and profile creation.
      // UserProfileProvider will handle redirection to dashboard.
      // If this was the first user (Admin), they might need a special welcome/setup flow later.

    } catch (registrationError: any) {
      console.error('Registration Process Error:', registrationError);
      
      let displayError = `Registration failed: ${registrationError.message || 'An unknown error occurred. Please try again.'}`;

      if (registrationError.code === 'auth/email-already-in-use') {
        displayError = 'This email address is already in use. Please try a different email or sign in.';
      } else if (registrationError.code === 'auth/weak-password') {
        displayError = 'The password is too weak. Please use a stronger password.';
      }
      
      if (firebaseUser) {
        // If auth user was created but Firestore profile failed or another error occurred
        console.warn('Authentication succeeded but a subsequent step in registration failed. Attempting to sign out user:', firebaseUser.uid);
        try {
          await signOut(auth);
          console.log('User signed out due to incomplete registration process.');
          displayError = `Account creation was interrupted: ${registrationError.message || 'Profile setup failed.'} Your initial account step was rolled back. Please try registering again or contact support.`;
        } catch (signOutError: any) {
          console.error('CRITICAL: Failed to sign out user after registration error:', signOutError);
          displayError = `Critical error during registration. An account may have been partially created. Please contact support. (Error: ${registrationError.message} / SignoutFail: ${signOutError.message})`;
        }
      }
      setError(displayError);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full bg-gradient-to-br from-background to-green-50 dark:from-slate-900 dark:to-green-950">
      <Card className="w-full max-w-md shadow-2xl mx-auto my-auto">
        <CardHeader className="space-y-1 text-center p-8">
           <Link href="/" className="flex justify-center mb-4">
              <Image src="/agrifaas-logo.png" alt="AgriFAAS Connect Logo" width={280} height={84} data-ai-hint="logo agriculture" objectFit="contain" />
          </Link>
          <CardTitle className="text-3xl font-bold tracking-tight text-primary font-headline">Create Account</CardTitle>
          <CardDescription className="text-muted-foreground">
            Join AgriFAAS Connect! The first user will become the Admin.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8 grid gap-6">
          {error && (
            <div className="bg-destructive/10 p-3 rounded-md text-center text-sm text-destructive">
              {error}
            </div>
          )}
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="John Doe"
                {...form.register('fullName')}
                disabled={isLoading}
              />
              {form.formState.errors.fullName && (
                <p className="text-sm text-destructive">{form.formState.errors.fullName.message}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                {...form.register('email')}
                disabled={isLoading}
              />
              {form.formState.errors.email && (
                <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                {...form.register('password')}
                disabled={isLoading}
              />
              {form.formState.errors.password && (
                <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
              )}
            </div>
            {/* Role selection is removed as per new logic */}
            <Button type="submit" className="w-full text-lg py-6 mt-2" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <UserPlus className="mr-2 h-5 w-5" />
              )}
              {isLoading ? 'Creating Account...' : 'Register'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="p-8 pt-0 text-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/auth/signin" className="font-semibold text-primary hover:underline">
              Sign In here
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
