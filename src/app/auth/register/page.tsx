
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
import { auth, isFirebaseClientConfigured } from '@/lib/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { createProfileDocument } from './actions';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

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
  const searchParams = useSearchParams();

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: '', email: '', password: '' },
  });

  const onSubmit: SubmitHandler<RegisterFormValues> = async (data) => {
    setIsLoading(true);
    setError(null);

    if (!isFirebaseClientConfigured || !auth) {
      setError("Firebase client configuration is missing or incomplete. Please contact support.");
      setIsLoading(false);
      return;
    }

    const planId = searchParams.get('plan') as 'starter' | 'grower' | 'business' | 'enterprise' || 'starter';
    const cycle = searchParams.get('cycle') as 'monthly' | 'annually' || 'annually';

    try {
      // Create user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      
      // If auth creation is successful, create their Firestore profile via the server action
      const profileResult = await createProfileDocument(userCredential.user, data, planId, cycle);

      if (!profileResult.success) {
        // This is a critical failure. The user has an auth account but no profile.
        // We must inform them and log the error.
        setError(`Your account was created, but setting up your profile failed: ${profileResult.message}. Please try logging in to recover your profile or contact support.`);
        throw new Error(profileResult.message);
      }
      
      // On full success, proceed to setup
      router.push(`/setup`);

    } catch (registrationError: any) {
      let displayError = `Registration failed: ${registrationError.message || 'An unknown error occurred.'}`;
      
      if (registrationError.code === 'auth/email-already-in-use') {
        // If the email is already in use, it might be our "zombie" user case.
        // Let's try to sign them in and create their profile.
        try {
          const signInCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
          
          // Now that they're signed in, the UserProfileProvider will take over and automatically
          // attempt to create the profile if it's missing. We can just redirect to setup.
          router.push(`/setup`);

        } catch (signInError: any) {
          if (signInError.code === 'auth/wrong-password' || signInError.code === 'auth/invalid-credential') {
            displayError = 'An account with this email already exists, but the password was incorrect. Please sign in or use "Forgot Password".';
          } else {
            console.error('Error during sign-in attempt on registration page:', signInError);
            displayError = `An unexpected error occurred. Please try again or sign in. (Code: ${signInError.code})`;
          }
          setError(displayError);
        }
      } else if (registrationError.code === 'auth/weak-password') {
        displayError = 'The password is too weak. Please use a stronger password.';
        setError(displayError);
      } else {
        // Handle other registration errors
        console.error('Registration Process Error:', registrationError);
        setError(displayError);
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
          Create your secure, private AgriFAAS Connect account. Immediately after registering, you will enter a private setup process.
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
