
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
import { auth, db } from '@/lib/firebase'; // Import db
import { createUserWithEmailAndPassword, type User } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore'; // Import Firestore functions
import type { AgriFAASUserProfile, UserRole } from '@/types/user'; // Import user profile type

const registerSchema = z.object({
  fullName: z.string().min(2, { message: 'Full name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

// Define the email address for the first admin user
const FIRST_ADMIN_EMAIL = 'admin@agrifaas.com';

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

    if (!auth || !db) {
      setError("Firebase authentication or database is not configured. Please check your setup.");
      setIsLoading(false);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const firebaseUser: User = userCredential.user;
      console.log('User registered with Firebase Auth:', firebaseUser.uid);

      // Determine roles for the new user
      const roles: UserRole[] = ['Farmer']; // Default role
      if (firebaseUser.email && firebaseUser.email.toLowerCase() === FIRST_ADMIN_EMAIL.toLowerCase()) {
        if (!roles.includes('Admin')) { // Ensure 'Admin' is not duplicated if 'Farmer' was also a default for admin
            roles.push('Admin');
        }
      }

      // Create user profile document in Firestore
      const newUserProfile: AgriFAASUserProfile = {
        userId: firebaseUser.uid,
        firebaseUid: firebaseUser.uid,
        fullName: data.fullName,
        emailAddress: firebaseUser.email || data.email, // Prefer email from Firebase Auth if available
        role: roles, // Assign determined roles
        accountStatus: 'Active',
        registrationDate: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        phoneNumber: '', // Explicitly set as empty as it's not collected
        avatarUrl: `https://placehold.co/100x100.png?text=${data.fullName.charAt(0)}`, // Basic placeholder avatar
      };

      await setDoc(doc(db, 'users', firebaseUser.uid), newUserProfile);
      console.log('User profile created in Firestore for user:', firebaseUser.uid, 'with roles:', roles);

      router.push('/dashboard'); // Redirect on success
    } catch (firebaseError: any) {
      console.error('Firebase Registration or Profile Creation Error:', firebaseError);
      let errorMessage = "An error occurred during registration. Please try again.";
      if (firebaseError.code === 'auth/email-already-in-use') {
        errorMessage = 'This email address is already in use. Please try a different email or sign in.';
      } else if (firebaseError.code === 'auth/weak-password') {
        errorMessage = 'The password is too weak. Please use a stronger password.';
      } else if (firebaseError.code) { // Check if it's a Firebase error object
        errorMessage = `Registration failed: ${firebaseError.message}`;
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md shadow-2xl">
      <CardHeader className="space-y-1 text-center p-8">
         <Link href="/" className="flex justify-center mb-4">
            <Image src="/agrifaas-logo.png" alt="AgriFAAS Connect Logo" width={240} height={72} data-ai-hint="logo agriculture" objectFit="contain" />
        </Link>
        <CardTitle className="text-3xl font-bold tracking-tight text-primary font-headline">Create Account</CardTitle>
        <CardDescription className="text-muted-foreground">
          Join AgriFAAS Connect today!
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
  );
}
