
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  CalendarDays,
  ListChecks,
  Tractor,
  Beef,
  Briefcase,
  FileText,
  Banknote,
  BrainCircuit,
  Compass,
  ShieldHalf,
  Settings,
  type LucideIcon,
} from 'lucide-react';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
  SidebarGroupLabel,
  SidebarMenuSkeleton
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { useUserProfile } from '@/contexts/user-profile-context';
import type { UserRole } from '@/types/user';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  group?: 'Workspace' | 'Operations' | 'Planning & Reports' | 'Specialized Tools' | 'System';
  roles?: UserRole[];
  adminOnly?: boolean;
}

const allNavItems: NavItem[] = [
  // Workspace
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, group: 'Workspace', roles: ['Admin', 'Manager', 'FieldOfficer', 'HRManager', 'Farmer', 'Agric Extension Officer', 'Investor', 'Farm Staff', 'OfficeManager', 'FinanceManager'] },
  { href: '/farm-calendar', label: 'Calendar', icon: CalendarDays, group: 'Workspace', roles: ['Admin', 'Manager', 'FieldOfficer', 'Farmer', 'Agric Extension Officer', 'Farm Staff'] },
  { href: '/task-management', label: 'Tasks', icon: ListChecks, group: 'Workspace', roles: ['Admin', 'Manager', 'FieldOfficer', 'Farmer', 'Agric Extension Officer', 'Farm Staff'] },
  
  // Operations
  { href: '/farm-management', label: 'Farm Operations', icon: Tractor, group: 'Operations', roles: ['Admin', 'Manager', 'Farmer', 'Agric Extension Officer', 'Farm Staff'] },
  { href: '/animal-production', label: 'Animal Production', icon: Beef, group: 'Operations', roles: ['Admin', 'Manager', 'Farmer', 'Agric Extension Officer', 'Farm Staff'] },
  { href: '/resource-inventory', label: 'Inventory', icon: ListChecks, group: 'Operations', roles: ['Admin', 'Manager', 'FieldOfficer', 'Farmer', 'Agric Extension Officer', 'Farm Staff'] },
  
  // Planning & Reports
  { href: '/reports/financial-dashboard', label: 'Financials', icon: FileText, group: 'Planning & Reports', roles: ['Admin', 'Manager', 'Investor', 'Farmer', 'FinanceManager', 'OfficeManager'] },
  { href: '/reports/budgeting', label: 'Budgeting', icon: Banknote, group: 'Planning & Reports', roles: ['Admin', 'Manager', 'Investor', 'Farmer', 'FinanceManager', 'OfficeManager'] },
  { href: '/planting-advice', label: 'AI Advice', icon: BrainCircuit, group: 'Planning & Reports', roles: ['Admin', 'Manager', 'Farmer', 'Agric Extension Officer'] },
  
  // Specialized Tools
  { href: '/hr/dashboard', label: 'HR Management', icon: Briefcase, group: 'Specialized Tools', roles: ['HRManager', 'Admin'] },
  { href: '/office-management/dashboard', label: 'Office Mgmt', icon: Briefcase, group: 'Specialized Tools', roles: ['Admin', 'OfficeManager', 'FinanceManager'] },
  { href: '/aeo/dashboard', label: 'AEO Toolkit', icon: Compass, group: 'Specialized Tools', roles: ['Agric Extension Officer', 'Admin'] },
  
  // System
  { href: '/admin/dashboard', label: 'Admin Panel', icon: ShieldHalf, group: 'System', adminOnly: true },
  { href: '/settings', label: 'Settings', icon: Settings, group: 'System', roles: ['Admin', 'Manager', 'FieldOfficer', 'HRManager', 'Farmer', 'Agric Extension Officer', 'Investor', 'Farm Staff', 'OfficeManager', 'FinanceManager'] },
];

export function MainNav() {
  const pathname = usePathname();
  const { userProfile, isLoading: isUserLoading } = useUserProfile();

  const userRoles = userProfile?.role || [];
  const isActualAdmin = userRoles.includes('Admin');

  const isActive = (href: string) => {
    if (href === '/dashboard' && pathname === '/dashboard') return true;
    if (href !== '/dashboard' && pathname.startsWith(href)) return true;
    return false;
  };

  const canViewItem = (item: NavItem): boolean => {
    if (isUserLoading) return false;
    if (item.adminOnly) return isActualAdmin;
    if (!item.roles) return true;
    return item.roles.some(role => userRoles.includes(role));
  };
  
  const visibleNavItems = allNavItems.filter(canViewItem);

  const groupedItems = visibleNavItems.reduce((acc, item) => {
    const group = item.group || 'System'; // Default to system if no group
    if (!acc[group]) {
      acc[group] = [];
    }
    acc[group].push(item);
    return acc;
  }, {} as Record<string, NavItem[]>);
  
  const groupOrder: Array<keyof typeof groupedItems> = ['Workspace', 'Operations', 'Planning & Reports', 'Specialized Tools', 'HR', 'AEO', 'System'];


  const renderNavItem = (item: NavItem) => (
    <SidebarMenuItem key={item.href}>
      <Link href={item.href}>
        <SidebarMenuButton
          className={cn(
            'w-full justify-start text-base',
             isActive(item.href)
              ? 'bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90 hover:text-sidebar-primary-foreground'
              : 'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
          )}
          isActive={isActive(item.href)}
          tooltip={{ children: item.label, className: "font-body" }}
        >
          <item.icon className="h-5 w-5 mr-2" />
          <span className="truncate font-body">{item.label}</span>
        </SidebarMenuButton>
      </Link>
    </SidebarMenuItem>
  );

  if (isUserLoading) {
    return (
      <SidebarMenu>
        {[...Array(5)].map((_, i) => <SidebarMenuItem key={i}><SidebarMenuSkeleton showIcon /></SidebarMenuItem>)}
      </SidebarMenu>
    );
  }
  
  return (
    <SidebarMenu>
      {groupOrder.map(groupName => {
        const items = groupedItems[groupName];
        if (!items || items.length === 0) return null;
        
        return (
          <React.Fragment key={groupName}>
            <SidebarSeparator className="my-2" />
            <SidebarGroupLabel className="px-2 group-data-[collapsible=icon]:hidden">{groupName}</SidebarGroupLabel>
            {items.map(renderNavItem)}
          </React.Fragment>
        );
      })}
    </SidebarMenu>
  );
}
