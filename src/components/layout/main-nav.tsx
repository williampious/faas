
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  CalendarDays,
  Archive,
  CloudSun,
  ListChecks,
  BrainCircuit,
  UserCircle,
  Home,
  ShieldHalf,
  UsersRound,
  Tractor,
  Compass, // Added for AEO Dashboard
  Users, // Already present, can be used for Farmer Directory
  Contact, // Added for Farmer Profiles (conceptually, actual link might differ)
  MessageSquareText, // Added for Support Logs
  BarChart3, // Added for AEO Reports
  BookOpenCheck, // Added for Knowledge Base
  type LucideIcon,
} from 'lucide-react';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
  SidebarGroupLabel, // Added import
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { useUserProfile } from '@/contexts/user-profile-context';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  adminOnly?: boolean; // For items strictly for admins
  // aeoOnly?: boolean; // This can be removed if sections are handled by role checks
}

const navItems: NavItem[] = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/farm-management', label: 'Farm Management', icon: Tractor },
  { href: '/farm-calendar', label: 'Farm Calendar', icon: CalendarDays },
  { href: '/resource-inventory', label: 'Resource Inventory', icon: Archive },
  { href: '/weather-monitoring', label: 'Weather Monitoring', icon: CloudSun },
  { href: '/task-management', label: 'Task Management', icon: ListChecks },
  { href: '/planting-advice', label: 'Planting Advice', icon: BrainCircuit },
  { href: '/profile', label: 'User Profile', icon: UserCircle },
];

const adminNavItems: NavItem[] = [
  { href: '/admin/dashboard', label: 'Admin Dashboard', icon: ShieldHalf, adminOnly: true },
  { href: '/admin/users', label: 'User Management', icon: UsersRound, adminOnly: true },
];

const aeoNavItems: NavItem[] = [
  { href: '/aeo/dashboard', label: 'AEO Dashboard', icon: Compass },
  { href: '/aeo/farmer-directory', label: 'Farmer Directory', icon: Users },
  // Farmer profiles will typically be accessed via the directory, so a direct link here might be less common
  // { href: '/aeo/farmer-profile', label: 'Farmer Profiles', icon: Contact },
  { href: '/aeo/support-communication', label: 'Support Logs', icon: MessageSquareText },
  { href: '/aeo/reports', label: 'AEO Reports', icon: BarChart3 },
  { href: '/aeo/knowledge-transfer', label: 'Knowledge Base', icon: BookOpenCheck },
];


export function MainNav() {
  const pathname = usePathname();
  const { userProfile, isLoading: isUserLoading, isAdmin } = useUserProfile();
  const isAEO = !isUserLoading && !!userProfile?.role?.includes('Agric Extension Officer');

  const renderNavItem = (item: NavItem) => (
    <SidebarMenuItem key={item.href}>
      <Link href={item.href}>
        <SidebarMenuButton
          className={cn(
            'w-full justify-start text-base',
            pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href)) // Highlight parent for sub-routes
              ? 'bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90 hover:text-sidebar-primary-foreground'
              : 'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
          )}
          isActive={pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))}
          tooltip={{ children: item.label, className: "font-body" }}
        >
          <item.icon className="h-5 w-5 mr-2" />
          <span className="truncate font-body">{item.label}</span>
        </SidebarMenuButton>
      </Link>
    </SidebarMenuItem>
  );

  return (
    <SidebarMenu>
      {navItems.map(renderNavItem)}

      {/* Admin Navigation Section */}
      {!isUserLoading && isAdmin && (
        <>
          <SidebarSeparator className="my-2" />
           <SidebarGroupLabel className="px-2 group-data-[collapsible=icon]:hidden">Admin Tools</SidebarGroupLabel>
          {adminNavItems.map(renderNavItem)}
        </>
      )}

      {/* AEO Navigation Section */}
      {!isUserLoading && isAEO && (
        <>
          <SidebarSeparator className="my-2" />
          <SidebarGroupLabel className="px-2 group-data-[collapsible=icon]:hidden">AEO Tools</SidebarGroupLabel>
          {aeoNavItems.map(renderNavItem)}
        </>
      )}
    </SidebarMenu>
  );
}
