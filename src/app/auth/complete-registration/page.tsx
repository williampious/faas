
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
import { useState, useEffect } from 'react';
import { Loader2, UserCheck, AlertTriangle } from 'lucide-react';
import Image from 'next/image';
import { auth, db, isFirebaseClientConfigured } from '@/lib/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp, collection, getDocs, query, where, updateDoc } from 'firebase/firestore';
import type { AgriFAASUserProfile } from '@/types/user';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription as ShadcnAlertDescription } from '@/components/ui/alert';


const completeRegistrationSchema = z.object({
  fullName: z.string().min(2, { message: 'Full name must be at least 2 characters.' }),
  email: z.string().email(), // Will be pre-filled and read-only
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type CompleteRegistrationFormValues = z.infer<typeof completeRegistrationSchema>;

const usersCollectionName = 'users';

export default function CompleteRegistrationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const token = searchParams.get('token');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const [isValidToken, setIsValidToken] = useState(false);
  const [invitedUserData, setInvitedUserData] = useState<AgriFAASUserProfile | null>(null);
  const [isTokenValidationLoading, setIsTokenValidationLoading] = useState(true);

  const form = useForm<CompleteRegistrationFormValues>({
    resolver: zodResolver(completeRegistrationSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setValidationMessage("Invitation token is missing or invalid. Please use the link provided in your invitation.");
        setIsTokenValidationLoading(false);
        setIsValidToken(false);
        return;
      }

      if (!isFirebaseClientConfigured || !db) {
        setValidationMessage("System configuration error. Cannot validate token. Please contact support.");
        setIsTokenValidationLoading(false);
        setIsValidToken(false);
        return;
      }
      
      setIsTokenValidationLoading(true);
      try {
        const usersRef = collection(db, usersCollectionName);
        const q = query(usersRef, where("invitationToken", "==", token), where("accountStatus", "==", "Invited"));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          setValidationMessage("This invitation link is invalid, has expired, or has already been used. Please request a new invitation if needed.");
          setIsValidToken(false);
        } else {
          // Assuming token is unique, so only one doc should be found
          const userDoc = querySnapshot.docs[0];
          const userData = { userId: userDoc.id, ...userDoc.data() } as AgriFAASUserProfile;
          setInvitedUserData(userData);
          form.setValue('email', userData.emailAddress || '');
          form.setValue('fullName', userData.fullName || '');
          setIsValidToken(true);
          setValidationMessage(null); // Clear any previous error
        }
      } catch (err: any) {
        console.error("Error validating token:", err);
        setValidationMessage("An error occurred while validating your invitation. Please try again or contact support.");
        setIsValidToken(false);
      } finally {
        setIsTokenValidationLoading(false);
      }
    };

    validateToken();
  }, [token, form]);


  const onSubmit: SubmitHandler<CompleteRegistrationFormValues> = async (data) => {
    if (!isValidToken || !invitedUserData || !invitedUserData.userId) {
      setError("Cannot complete registration. Invitation is invalid or user data is missing.");
      return;
    }

    setIsLoading(true);
    setError(null);

    if (!auth || !db) {
      setError("Firebase services are not available. Please try again later.");
      setIsLoading(false);
      return;
    }

    try {
      // 1. Create user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const firebaseUser = userCredential.user;

      // 2. Update user profile in Firestore
      const userDocRef = doc(db, usersCollectionName, invitedUserData.userId); // Use original document ID
      await updateDoc(userDocRef, {
        firebaseUid: firebaseUser.uid,
        fullName: data.fullName, // Allow user to confirm/update full name
        accountStatus: 'Active',
        invitationToken: null, // Clear the token
        updatedAt: serverTimestamp(),
        registrationDate: new Date().toISOString(), // Set actual registration completion date
      });
      
      toast({
        title: "Registration Complete!",
        description: "Your account has been successfully created. You are now being logged in.",
      });
      // Firebase Auth automatically signs in the user. Redirection will be handled by root layout.
      // router.push('/dashboard'); // Explicit redirect if needed, but UserProfileProvider should handle it
    } catch (registrationError: any) {
      console.error('Registration Completion Error:', registrationError);
      let displayError = `Registration failed: ${registrationError.message || 'An unknown error occurred.'}`;
      if (registrationError.code === 'auth/email-already-in-use') {
        displayError = 'This email address is already registered. Please sign in or contact support if this seems incorrect.';
      } else if (registrationError.code === 'auth/weak-password') {
        displayError = 'The password is too weak. Please use a stronger password.';
      }
      setError(displayError);
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isTokenValidationLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Validating invitation...</p>
      </div>
    );
  }


  return (
    <div className="w-full bg-gradient-to-br from-background to-green-50 dark:from-slate-900 dark:to-green-950 flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="space-y-1 text-center p-8">
           <Link href="/" className="flex justify-center mb-4">
              <Image src="/agrifaas-logo.png" alt="AgriFAAS Connect Logo" width={280} height={84} data-ai-hint="logo agriculture" objectFit="contain" />
          </Link>
          <CardTitle className="text-3xl font-bold tracking-tight text-primary font-headline">Complete Your Registration</CardTitle>
          <CardDescription className="text-muted-foreground">
            Set your password to activate your AgriFAAS Connect account.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8 grid gap-6">
          {validationMessage && !isValidToken && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Invitation Error</AlertTitle>
              <ShadcnAlertDescription>{validationMessage}</ShadcnAlertDescription>
            </Alert>
          )}

          {isValidToken && invitedUserData && (
            <>
              {error && (
                <Alert variant="destructive" className="mb-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Registration Error</AlertTitle>
                    <ShadcnAlertDescription>{error}</ShadcnAlertDescription>
                </Alert>
              )}
              <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    {...form.register('email')}
                    disabled // Email is read-only
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Confirm your full name"
                    {...form.register('fullName')}
                    disabled={isLoading}
                  />
                  {form.formState.errors.fullName && (
                    <p className="text-sm text-destructive">{form.formState.errors.fullName.message}</p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Choose a strong password"
                    {...form.register('password')}
                    disabled={isLoading}
                  />
                  {form.formState.errors.password && (
                    <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
                  )}
                </div>
                 <div className="grid gap-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Re-enter your password"
                    {...form.register('confirmPassword')}
                    disabled={isLoading}
                  />
                  {form.formState.errors.confirmPassword && (
                    <p className="text-sm text-destructive">{form.formState.errors.confirmPassword.message}</p>
                  )}
                </div>
                <Button type="submit" className="w-full text-lg py-6 mt-2" disabled={isLoading || !isValidToken}>
                  {isLoading ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    <UserCheck className="mr-2 h-5 w-5" />
                  )}
                  {isLoading ? 'Completing Registration...' : 'Complete Registration'}
                </Button>
              </form>
            </>
          )}
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

