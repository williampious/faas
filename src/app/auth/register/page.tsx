

'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
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
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, type User } from 'firebase/auth';
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import type { AgriFAASUserProfile, SubscriptionDetails } from '@/types/user';
import { add } from 'date-fns';

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
  const searchParams = useSearchParams();

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
    },
  });
  
  const createProfileDocument = async (user: User, data: RegisterFormValues) => {
    const planId = searchParams.get('plan') as 'starter' | 'grower' | 'business' | 'enterprise' || 'starter';
    const cycle = searchParams.get('cycle') as 'monthly' | 'annually' || 'annually';

    const trialEndDate = add(new Date(), { days: 14 });

    const initialSubscription: SubscriptionDetails = {
        planId: planId,
        status: planId === 'starter' ? 'Active' : 'Trialing',
        billingCycle: cycle,
        nextBillingDate: null,
        trialEnds: planId !== 'starter' ? trialEndDate.toISOString() : null,
    };

    const profileForFirestore: Omit<AgriFAASUserProfile, 'createdAt' | 'updatedAt'> & { createdAt: any, updatedAt: any } = {
        userId: user.uid,
        firebaseUid: user.uid,
        fullName: data.fullName,
        emailAddress: user.email || data.email,
        role: [],
        accountStatus: 'Active',
        registrationDate: new Date().toISOString(),
        phoneNumber: '',
        avatarUrl: `https://placehold.co/100x100.png?text=${data.fullName.charAt(0)}`,
        subscription: initialSubscription,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };

    await setDoc(doc(db, usersCollectionName, user.uid), profileForFirestore);
    console.log('User profile created in Firestore for user:', user.uid);
  };


  const onSubmit: SubmitHandler<RegisterFormValues> = async (data) => {
    setIsLoading(true);
    setError(null);

    if (!isFirebaseClientConfigured || !auth || !db) {
      setError("Firebase client configuration is missing or incomplete. Please contact support.");
      setIsLoading(false);
      return;
    }
    
    try {
      // Create user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      // If successful, create their Firestore profile
      await createProfileDocument(userCredential.user, data);
      
      router.push(`/setup`);

    } catch (registrationError: any) {
      // This is the critical part: handle the "email-already-in-use" error
      if (registrationError.code === 'auth/email-already-in-use') {
        try {
          // Attempt to sign in the user, as their auth account exists
          const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
          const existingUser = userCredential.user;
          
          // Now check if their Firestore profile document exists
          const userDocRef = doc(db, usersCollectionName, existingUser.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (!userDocSnap.exists()) {
            // This is the "missing profile" scenario. Create it for them.
            console.warn(`User ${existingUser.uid} exists in Auth but not Firestore. Creating profile now.`);
            await createProfileDocument(existingUser, data);
            
            // Now that the profile is created, proceed to setup
            router.push(`/setup`);
          } else {
            // The user exists in Auth AND Firestore. They should just sign in.
             setError('This account already exists. Please use the "Sign In" page.');
             signOut(auth); // Sign them out as this is the registration page.
          }
        } catch (signInError: any) {
            // This happens if the email exists but they entered the wrong password.
            if (signInError.code === 'auth/wrong-password' || signInError.code === 'auth/invalid-credential') {
                 setError('An account with this email already exists, but the password was incorrect. Please sign in or use "Forgot Password".');
            } else {
                 console.error('Error during sign-in attempt on registration page:', signInError);
                 setError(`An unexpected error occurred. Please try again or sign in. (Code: ${signInError.code})`);
            }
        }
      } else if (registrationError.code === 'auth/weak-password') {
        setError('The password is too weak. Please use a stronger password.');
      } else {
        // Handle other registration errors
        console.error('Registration Process Error:', registrationError);
        setError(`Registration failed: ${registrationError.message || 'An unknown error occurred.'}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md shadow-2xl mx-auto my-auto">
      <CardHeader className="space-y-1 text-center p-8">
        <CardTitle className="text-3xl font-bold tracking-tight text-primary font-headline">Create an Account</CardTitle>
        <CardDescription className="text-muted-foreground">
          Create your secure, private AgriFAAS Connect account. Immediately after registering, you will enter a private setup process to create your own isolated farm workspace or configure your role as an Extension Officer. Your data will not be linked to any other users until you choose to invite them.
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
