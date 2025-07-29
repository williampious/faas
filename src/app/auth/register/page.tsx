
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
import { auth, isFirebaseClientConfigured, db } from '@/lib/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import type { AgriFAASUserProfile, SubscriptionDetails } from '@/types/user';
import { add } from 'date-fns';

const registerSchema = z.object({
  fullName: z.string().min(2, { message: 'Full name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: '', email: '', password: '' },
  });

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
      
      // If auth creation is successful, create their Firestore profile directly here.
      // This avoids a race condition with the context provider.
      const trialEndDate = add(new Date(), { days: 20 });
      const initialSubscription: SubscriptionDetails = {
          planId: 'business',
          status: 'Trialing',
          billingCycle: 'annually',
          nextBillingDate: null,
          trialEnds: trialEndDate.toISOString(),
      };
      
      const userDocRef = doc(db, 'users', userCredential.user.uid);
      await setDoc(userDocRef, {
        userId: userCredential.user.uid,
        firebaseUid: userCredential.user.uid,
        fullName: data.fullName,
        emailAddress: data.email,
        role: [],
        accountStatus: 'Active',
        registrationDate: new Date().toISOString(),
        avatarUrl: `https://placehold.co/100x100.png?text=${data.fullName.charAt(0)}`,
        subscription: initialSubscription,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      
      // On full success, proceed to setup
      router.push(`/setup`);

    } catch (registrationError: any) {
      let displayError = `Registration failed: ${registrationError.message || 'An unknown error occurred.'}`;
      
      if (registrationError.code === 'auth/email-already-in-use') {
        displayError = 'An account with this email already exists. Please sign in or use "Forgot Password".';
      } else if (registrationError.code === 'auth/weak-password') {
        displayError = 'The password is too weak. Please use a stronger password.';
      }
      setError(displayError);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md shadow-2xl mx-auto my-auto">
      <CardHeader className="space-y-1 text-center p-8">
        <CardTitle className="text-3xl font-bold tracking-tight text-primary font-headline">Create an Account</CardTitle>
        <CardDescription className="text-muted-foreground">
          Join today and get a free 20-day trial of our Business Plan. No credit card required.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-8 grid gap-6">
        {error && (
          <Alert variant="destructive">
            <AlertTitle>Registration Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input id="fullName" type="text" placeholder="John Doe" {...form.register('fullName')} disabled={isLoading} />
            {form.formState.errors.fullName && (<p className="text-sm text-destructive">{form.formState.errors.fullName.message}</p>)}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="your@email.com" {...form.register('email')} disabled={isLoading} />
            {form.formState.errors.email && (<p className="text-sm text-destructive">{form.formState.errors.email.message}</p>)}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" placeholder="••••••••" {...form.register('password')} disabled={isLoading} />
            {form.formState.errors.password && (<p className="text-sm text-destructive">{form.formState.errors.password.message}</p>)}
          </div>
          <Button type="submit" className="w-full text-lg py-6 mt-2" disabled={isLoading}>
            {isLoading ? (<Loader2 className="mr-2 h-5 w-5 animate-spin" />) : (<UserPlus className="mr-2 h-5 w-5" />)}
            {isLoading ? 'Creating Account...' : 'Register for Free Trial'}
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
