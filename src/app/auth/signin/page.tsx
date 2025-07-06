
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
import { Loader2, LogIn } from 'lucide-react';
import Image from 'next/image';
import { auth, isFirebaseClientConfigured } from '@/lib/firebase'; // Added isFirebaseClientConfigured
import { signInWithEmailAndPassword } from 'firebase/auth';

const signInSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
});

type SignInFormValues = z.infer<typeof signInSchema>;

export default function SignInPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const form = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit: SubmitHandler<SignInFormValues> = async (data) => {
    setIsLoading(true);
    setError(null);

    if (!isFirebaseClientConfigured) {
      setError("Firebase client configuration is missing or incomplete. Please ensure all NEXT_PUBLIC_FIREBASE_... variables are correctly set in your .env.local file and that you have restarted your development server.");
      setIsLoading(false);
      return;
    }
    
    if (!auth) {
      setError("Firebase authentication service is not available. This could be due to a network issue or Firebase services not being fully enabled in your project console. Please check your setup and internet connection.");
      setIsLoading(false);
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
      console.log('User signed in:', userCredential.user);
      // Redirection to /dashboard is now handled by the root layout after auth state update
      // router.push('/dashboard'); 
    } catch (firebaseError: any) {
      console.error('Firebase Sign In Error:', firebaseError);
      let errorMessage = "Invalid credentials or an error occurred. Please try again.";
      if (firebaseError.code === 'auth/user-not-found' || firebaseError.code === 'auth/wrong-password' || firebaseError.code === 'auth/invalid-credential') {
        errorMessage = 'Invalid email or password. Please try again.';
      } else if (firebaseError.code === 'auth/too-many-requests') {
        errorMessage = 'Too many sign-in attempts. Please try again later.';
      } else if (firebaseError.code === 'auth/network-request-failed') {
        errorMessage = 'Network error: Could not connect to authentication servers. Please check your internet connection and ensure Firebase configuration (especially authDomain) is correct.';
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md shadow-2xl mx-auto my-auto">
      <CardHeader className="space-y-1 text-center p-8">
        <CardTitle className="text-3xl font-bold tracking-tight text-primary font-headline">Sign In</CardTitle>
        <CardDescription className="text-muted-foreground">
          Welcome back! Access your AgriFAAS Connect account.
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
              <LogIn className="mr-2 h-5 w-5" />
            )}
            {isLoading ? 'Signing In...' : 'Sign In'}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="p-8 pt-0 flex flex-col items-center gap-4">
        <Link href="/auth/forgot-password" className="text-sm text-primary hover:underline">
            Forgot your password?
        </Link>
        <p className="text-sm text-muted-foreground">
          Don&apos;t have an account?{' '}
          <Link href="/auth/register" className="font-semibold text-primary hover:underline">
            Register here
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
