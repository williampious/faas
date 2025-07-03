
'use client';

import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, User, Lock, FileText, ChevronRight, Info } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

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
        <p className="font-semibold flex items-center gap-2">
          {title}
          {disabled && <Badge variant="outline">Coming Soon</Badge>}
        </p>
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
  const appVersion = "1.0.0"; // Placeholder version

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
      href: '#',
      disabled: true,
    },
    {
      title: 'Data Privacy',
      description: 'Review our data privacy policy and manage your data settings.',
      icon: FileText,
      href: '#',
      disabled: true,
    },
    {
      title: 'User Agreement',
      description: 'Read the terms and conditions for using AgriFAAS Connect.',
      icon: FileText,
      href: '#',
      disabled: true,
    },
  ];

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
    </div>
  );
}
