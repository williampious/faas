
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
import { auth, db } from '@/lib/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, serverTimestamp, collection, writeBatch } from 'firebase/firestore';
import type { AgriFAASUserProfile } from '@/types/user';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription as ShadcnAlertDescription } from '@/components/ui/alert';
import { validateInvitationToken } from './actions';


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
    const processTokenValidation = async () => {
      if (!token) {
        setValidationMessage("Invitation token is missing or invalid. Please use the link provided in your invitation.");
        setIsTokenValidationLoading(false);
        setIsValidToken(false);
        return;
      }
      
      setIsTokenValidationLoading(true);

      const result = await validateInvitationToken(token);

      if (result.success && result.userData) {
        setInvitedUserData(result.userData.profileData);
        form.setValue('email', result.userData.emailAddress || '');
        form.setValue('fullName', result.userData.fullName || '');
        setIsValidToken(true);
        setValidationMessage(null);
      } else {
        setValidationMessage(result.message || "An unknown validation error occurred.");
        setIsValidToken(false);
        setInvitedUserData(null);
      }
      setIsTokenValidationLoading(false);
    };

    processTokenValidation();
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

      // 2. Use a batch write to atomically create the new user doc and delete the old invitation doc.
      const batch = writeBatch(db);
      
      const newUserDocRef = doc(db, usersCollectionName, firebaseUser.uid);
      const oldUserDocRef = doc(db, usersCollectionName, invitedUserData.userId);

      // Prepare the final user profile data, merging invitation data with registration form data
      const finalUserProfileData = {
          ...invitedUserData,
          userId: firebaseUser.uid,
          firebaseUid: firebaseUser.uid,
          fullName: data.fullName,
          accountStatus: 'Active' as const, // Set status to Active
          updatedAt: serverTimestamp(),
          registrationDate: new Date().toISOString(), // Set final registration date
      };
      
      // The invitationToken and createdAt fields from the temporary document should not be copied.
      const { createdAt, invitationToken, ...profileToWrite } = finalUserProfileData;

      // Create the new document with the Firebase Auth UID as its ID
      batch.set(newUserDocRef, { ...profileToWrite, createdAt: serverTimestamp() });
      
      // Delete the original temporary invitation document
      batch.delete(oldUserDocRef);

      // Commit the atomic operations
      await batch.commit();
      
      toast({
        title: "Registration Complete!",
        description: "Your account has been successfully created. You are now being logged in.",
      });
      // Firebase Auth automatically signs in the user. The UserProfileProvider will now find the correct document.
      
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
    <Card className="w-full max-w-md shadow-2xl">
      <CardHeader className="space-y-1 text-center p-8">
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
  );
}
