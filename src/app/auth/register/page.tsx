
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
import { auth, isFirebaseClientConfigured } from '@/lib/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { createProfileAfterRegistration } from './actions';

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

    if (!isFirebaseClientConfigured || !auth) {
      setError("Firebase client configuration is missing or incomplete. Please contact support.");
      setIsLoading(false);
      return;
    }

    try {
      // Step 1: Create user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      
      // Step 2: Call the server action to create the Firestore profile
      const profileResult = await createProfileAfterRegistration(userCredential.user, data.fullName);

      if (!profileResult.success) {
          // If profile creation fails, we should ideally delete the auth user to prevent orphans.
          // For now, we'll just show the error.
          throw new Error(profileResult.message);
      }
      
      // Step 3: Redirect to the setup page
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
