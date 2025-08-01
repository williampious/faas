
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
import { useState, type ReactNode } from 'react';
import { Loader2, LogIn } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';


const signInSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
});

type SignInFormValues = z.infer<typeof signInSchema>;

export default function SignInPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ReactNode | null>(null);
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

    if (!auth) {
      setError("Firebase authentication service is not available. This is likely a configuration issue. Please check the setup instructions in README.md.");
      setIsLoading(false);
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
      console.log('User signed in:', userCredential.user);
      // Let the root layout handle redirection
    } catch (firebaseError: any) {
      console.error('Firebase Sign In Error:', firebaseError);
      let errorMessage: ReactNode = `An unknown error occurred during sign-in. (Code: ${firebaseError.code || 'UNKNOWN'})`;

      switch (firebaseError.code) {
        case 'auth/invalid-credential':
          errorMessage = (
            <span>
              Invalid email or password. Please try again or{' '}
              <Link href="/auth/forgot-password" className="font-bold underline">
                reset your password
              </Link>
              .
            </span>
          );
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Access to this account has been temporarily disabled due to many failed login attempts. You can immediately restore it by resetting your password or you can try again later.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error: Could not connect to authentication servers. Please check your internet connection.';
          break;
        case 'auth/user-disabled':
            errorMessage = 'This user account has been disabled by an administrator.';
            break;
        // default case will use the generic message defined above
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
            <Alert variant="destructive">
                <AlertTitle>Sign-In Failed</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
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
            <div className="flex items-center">
              <Label htmlFor="password">Password</Label>
              <Link href="/auth/forgot-password" className="ml-auto inline-block text-sm underline">
                  Forgot your password?
              </Link>
            </div>
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
      <CardFooter className="p-8 pt-0 text-center">
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
