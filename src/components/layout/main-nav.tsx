
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
  Tractor, // Changed from Sprout
  type LucideIcon,
} from 'lucide-react';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { useUserProfile } from '@/contexts/user-profile-context';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/farm-management', label: 'Farm Management', icon: Tractor }, // Changed from Crop Management and Sprout
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

export function MainNav() {
  const pathname = usePathname();
  const { isAdmin, isLoading: isUserLoading } = useUserProfile();

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
      {!isUserLoading && isAdmin && (
        <>
          <SidebarSeparator className="my-2" />
          {adminNavItems.map(renderNavItem)}
        </>
      )}
    </SidebarMenu>
  );
}
