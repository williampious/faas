
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, FileText, ShieldAlert } from 'lucide-react';
import { LandingPageHeader } from '@/components/layout/landing-page-header';

export default function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto px-4">
      <LandingPageHeader
        title="Privacy Policy"
        description="Our commitment to your privacy."
        icon={FileText}
      />

      <Card className="w-full max-w-4xl mx-auto shadow-xl mb-12">
        <CardHeader>
          <CardTitle className="text-2xl">Privacy Policy for AgriFAAS Connect</CardTitle>
          <CardDescription>Last updated: {new Date().toLocaleDateString()}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 prose prose-sm dark:prose-invert max-w-none">
          <div className="flex items-start p-4 text-sm rounded-lg bg-yellow-50 border border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-700">
            <ShieldAlert className="h-5 w-5 mr-3 text-yellow-600 dark:text-yellow-400 shrink-0 mt-1" />
            <div className="flex-1">
              <p className="font-bold text-yellow-800 dark:text-yellow-200">This is a template and not legal advice.</p>
              <p className="text-yellow-700 dark:text-yellow-300">
                This document is a placeholder and should be replaced with a real, legally-vetted privacy policy before any public launch. Consult with a legal professional to ensure compliance with all applicable laws and regulations.
              </p>
            </div>
          </div>
          
          <section>
            <h3>1. Introduction</h3>
            <p>Welcome to AgriFAAS Connect ("we", "our", "us"). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains what information we collect, how we use it, and what rights you have in relation to it.</p>
          </section>

          <section>
            <h3>2. Information We Collect</h3>
            <p>We collect personal information that you voluntarily provide to us when you register on the application, express an interest in obtaining information about us or our products and services, when you participate in activities on the application, or otherwise when you contact us.</p>
            <p>The personal information that we collect depends on the context of your interactions with us and the application, the choices you make, and the products and features you use. The personal information we collect may include: Full Name, Email Address, Phone Number, Farm Data, User Role, and other similar information.</p>
          </section>
          
          <section>
            <h3>3. How We Use Your Information</h3>
            <p>We use personal information collected via our application for a variety of business purposes described below. We process your personal information for these purposes in reliance on our legitimate business interests, in order to enter into or perform a contract with you, with your consent, and/or for compliance with our legal obligations. The purposes include:</p>
            <ul>
                <li>To facilitate account creation and logon process.</li>
                <li>To post testimonials with your consent.</li>
                <li>To manage user accounts.</li>
                <li>To send administrative information to you.</li>
                <li>To protect our Services.</li>
                <li>To enable user-to-user communications.</li>
                <li>To enforce our terms, conditions and policies for business purposes, to comply with legal and regulatory requirements or in connection with our contract.</li>
            </ul>
          </section>

          <section>
            <h3>4. Will Your Information Be Shared With Anyone?</h3>
            <p>We only share information with your consent, to comply with laws, to provide you with services, to protect your rights, or to fulfill business obligations. Your data is stored within your farm's isolated environment and is not shared with other farms or third parties except as necessary to provide the service (e.g., Google for AI services, under strict privacy terms).</p>
          </section>

          <section>
            <h3>5. How Do We Keep Your Information Safe?</h3>
            <p>We have implemented appropriate technical and organizational security measures designed to protect the security of any personal information we process. However, despite our safeguards and efforts to secure your information, no electronic transmission over the Internet or information storage technology can be guaranteed to be 100% secure.</p>
          </section>

          <section>
            <h3>6. How Can You Contact Us About This Policy?</h3>
            <p>If you have questions or comments about this policy, you may email us at support@curetchnologies.org or by post to our office address listed on the main page.</p>
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
