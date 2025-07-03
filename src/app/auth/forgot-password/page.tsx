
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { Loader2, Mail, ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { sendPasswordReset } from './actions';

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [resultMessage, setResultMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit: SubmitHandler<ForgotPasswordFormValues> = async (data) => {
    setIsLoading(true);
    setResultMessage(null);

    const result = await sendPasswordReset(data.email);

    setResultMessage({
      type: result.success ? 'success' : 'error',
      message: result.message,
    });
    
    if (result.success) {
      form.reset();
    }

    setIsLoading(false);
  };

  return (
    <div className="w-full bg-gradient-to-br from-background to-green-50 dark:from-slate-900 dark:to-green-950">
      <Card className="w-full max-w-md shadow-2xl mx-auto my-auto">
        <CardHeader className="space-y-1 text-center p-8">
           <Link href="/" className="flex justify-center mb-4">
              <Image src="/agrifaas-logo.png" alt="AgriFAAS Connect Logo" width={280} height={84} objectFit="contain" />
          </Link>
          <CardTitle className="text-3xl font-bold tracking-tight text-primary font-headline">Forgot Password</CardTitle>
          <CardDescription className="text-muted-foreground">
            Enter your email address and we'll send you a link to reset your password.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8 grid gap-6">
          {resultMessage && (
            <Alert variant={resultMessage.type === 'error' ? 'destructive' : 'default'} className={resultMessage.type === 'success' ? 'bg-green-50 border-green-200 dark:bg-green-900/30 dark:border-green-700' : ''}>
              <AlertTitle>{resultMessage.type === 'success' ? 'Check Your Email' : 'Error'}</AlertTitle>
              <AlertDescription>{resultMessage.message}</AlertDescription>
            </Alert>
          )}

          {!resultMessage?.success && (
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
              <Button type="submit" className="w-full text-lg py-6 mt-2" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <Mail className="mr-2 h-5 w-5" />
                )}
                {isLoading ? 'Sending...' : 'Send Reset Link'}
              </Button>
            </form>
          )}
        </CardContent>
        <CardFooter className="p-8 pt-0 flex justify-center">
          <Link href="/auth/signin" className="font-semibold text-primary hover:underline flex items-center">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Sign In
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
