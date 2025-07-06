
'use client';

import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, User, Lock, FileText, ChevronRight, Info, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface SettingsItemProps {
  title: string;
  description: string;
  icon: React.ElementType;
  href?: string;
  disabled?: boolean;
}

function SettingsItem({ title, description, icon: Icon, href, disabled = false }: SettingsItemProps) {
  const content = (
    <div
      className={cn(
        'flex items-center space-x-4 p-4 rounded-lg transition-colors',
        !disabled && 'hover:bg-muted/50 cursor-pointer',
        disabled && 'opacity-60 cursor-not-allowed'
      )}
    >
      <Icon className="h-8 w-8 text-primary" />
      <div className="flex-1">
        <div className="font-semibold flex items-center gap-2">
          {title}
          {disabled && <Badge variant="outline">Coming Soon</Badge>}
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {!disabled && <ChevronRight className="h-5 w-5 text-muted-foreground" />}
    </div>
  );

  if (disabled || !href) {
    return content;
  }

  return <Link href={href}>{content}</Link>;
}


export default function SettingsPage() {
  const appVersion = "1.1.0";
  const { toast } = useToast();

  const settingsItems = [
    {
      title: 'Profile & Account',
      description: 'Manage your personal information, contact details, and preferences.',
      icon: User,
      href: '/profile',
    },
    {
      title: 'Sign-in & Security',
      description: 'Update your password and manage account security settings.',
      icon: Lock,
      href: '/settings/security',
    },
    {
      title: 'Data Privacy',
      description: 'Review our data privacy policy and manage your data settings.',
      icon: FileText,
      href: '/privacy-policy',
    },
    {
      title: 'User Agreement',
      description: 'Read the terms and conditions for using AgriFAAS Connect.',
      icon: FileText,
      href: '/terms-of-service',
    },
  ];
  
  const handleResetLocalData = () => {
    const keysToRemove = [
      'weatherLocation',
      'livestockProductionFocus_v1'
    ];

    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });

    toast({
      title: "Local Data Reset",
      description: "Local browser settings have been cleared. The page will now reload.",
    });

    // Reload the page to reflect the cleared state
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  };

  return (
    <div>
      <PageHeader
        title="Application Settings"
        icon={Settings}
        description="Manage your account, privacy, and application settings."
      />

      <Card className="shadow-lg">
        <CardContent className="p-2 divide-y divide-border/50">
          {settingsItems.map(item => (
            <SettingsItem
              key={item.title}
              title={item.title}
              description={item.description}
              icon={item.icon}
              href={item.href}
              disabled={item.disabled}
            />
          ))}
        </CardContent>
      </Card>
      
      <Card className="mt-6 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center"><Info className="mr-2 h-5 w-5 text-primary" />About AgriFAAS Connect</CardTitle>
        </CardHeader>
        <CardContent>
            <p className="text-sm text-muted-foreground">Version: {appVersion}</p>
            <p className="text-sm text-muted-foreground mt-2">©{new Date().getFullYear()} Cure Technologies Support Group (CTSG Ventures)</p>
             <p className="text-xs text-muted-foreground mt-4">
                For support, please visit our public <Link href="/help" className="text-primary hover:underline">Help Center</Link> or <Link href="/#contact-us" className="text-primary hover:underline">contact us</Link>.
             </p>
        </CardContent>
      </Card>

      <Card className="mt-6 shadow-lg border-destructive/50">
          <CardHeader>
              <CardTitle className="font-headline text-lg flex items-center text-destructive">
              <AlertTriangle className="mr-2 h-5 w-5" /> Advanced Settings
              </CardTitle>
              <CardDescription>
              These are developer-focused actions. Use with caution.
              </CardDescription>
          </CardHeader>
          <CardContent>
              <AlertDialog>
              <AlertDialogTrigger asChild>
                  <Button variant="destructive">Reset Local Settings</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                  <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                      This action will clear locally-stored browser settings, such as your saved weather location and livestock focus. It will not delete any of your farm's central data (like Plots, Financials, Tasks, etc.).
                      <br/><br/>
                      This is useful for troubleshooting display issues. This action cannot be undone.
                  </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleResetLocalData}>Yes, Reset Local Settings</AlertDialogAction>
                  </AlertDialogFooter>
              </AlertDialogContent>
              </AlertDialog>
              <p className="text-xs text-muted-foreground mt-4">
                  <strong>Note on User Data:</strong> To clear user and farm profiles from the central database, you must manually delete the documents from the 'users' and 'farms' collections in your Firebase Firestore console.
              </p>
          </CardContent>
      </Card>
    </div>
  );
}
