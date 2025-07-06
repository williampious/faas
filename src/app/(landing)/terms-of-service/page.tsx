
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, FileText, ShieldAlert } from 'lucide-react';
import { LandingPageHeader } from '@/components/layout/landing-page-header';

export default function TermsOfServicePage() {
  return (
    <div className="container mx-auto px-4">
      <LandingPageHeader
        title="Terms of Service"
        description="Rules for using our services."
        icon={FileText}
      />

      <Card className="w-full max-w-4xl mx-auto shadow-xl mb-12">
        <CardHeader>
          <CardTitle className="text-2xl">Terms of Service for AgriFAAS Connect</CardTitle>
          <CardDescription>Last updated: {new Date().toLocaleDateString()}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 prose prose-sm dark:prose-invert max-w-none">
          <div className="flex items-start p-4 text-sm rounded-lg bg-yellow-50 border border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-700">
            <ShieldAlert className="h-5 w-5 mr-3 text-yellow-600 dark:text-yellow-400 shrink-0 mt-1" />
            <div className="flex-1">
              <p className="font-bold text-yellow-800 dark:text-yellow-200">This is a template and not legal advice.</p>
              <p className="text-yellow-700 dark:text-yellow-300">
                This document is a placeholder and should be replaced with a real, legally-vetted Terms of Service agreement before any public launch. Consult with a legal professional.
              </p>
            </div>
          </div>
          
          <section>
            <h3>1. Agreement to Terms</h3>
            <p>By using AgriFAAS Connect (the "Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, you may not use the Service. We may modify these terms at any time, and such modifications shall be effective immediately upon posting.</p>
          </section>

          <section>
            <h3>2. User Accounts</h3>
            <p>You are responsible for safeguarding your account, and you agree not to disclose your password to any third party. You must notify us immediately upon becoming aware of any breach of security or unauthorized use of your account.</p>
          </section>
          
          <section>
            <h3>3. User Data</h3>
            <p>You retain full ownership of all data you input into the Service ("User Data"). We do not claim any ownership rights over your User Data. You grant us a worldwide, non-exclusive, royalty-free license to use, store, reproduce, and display your User Data solely as necessary to operate and provide the Service.</p>
          </section>

          <section>
            <h3>4. Acceptable Use</h3>
            <p>You agree not to use the Service for any unlawful purpose or to engage in any activity that would violate the rights of others. You agree not to misuse our Services by interfering with their normal operation or attempting to access them using a method other than through the interfaces and instructions that we provide.</p>
          </section>

          <section>
            <h3>5. Termination</h3>
            <p>We may terminate or suspend your account and bar access to the Service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever and without limitation, including but not to a breach of the Terms.</p>
          </section>

          <section>
            <h3>6. Disclaimer of Warranties</h3>
            <p>The Service is provided on an "AS IS" and "AS AVAILABLE" basis. We make no warranty that the service will meet your requirements or be available on an uninterrupted, secure, or error-free basis.</p>
          </section>

        </CardContent>
      </Card>

      <div className="text-center">
        <Link href="/">
          <Button>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
