
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
  Compass, 
  Users, 
  MessageSquareText, 
  BarChart3, 
  BookOpenCheck,
  FileText,
  Banknote,
  Briefcase, // For HR Manager
  Settings2, // For Manager (Operations)
  ClipboardList, // For Field Officer (Data Entry/Tasks)
  LayoutGrid, // For Plot/Field Management
  Layers, // For Soil & Water Management
  Beef, // For Animal Production
  Settings, // For Settings page
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
  group?: string;
  roles?: UserRole[]; // Specific roles that can see this item. If undefined, visible to all authenticated.
  adminOnly?: boolean; // Kept for explicit admin-only sections if needed beyond role check
  hideWhenNoSpecificRole?: boolean; // If true, hide if user has roles but none match this item's roles
}

// Define base navigation items available to most roles (or roles specified)
const baseNavItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['Admin', 'Manager', 'FieldOfficer', 'HRManager', 'Farmer', 'Agric Extension Officer', 'Investor', 'Farm Staff'] },
  { href: '/farm-management', label: 'Farm Ops', icon: Tractor, roles: ['Admin', 'Manager', 'Farmer', 'Agric Extension Officer', 'Farm Staff'] },
  { href: '/animal-production', label: 'Animal Prod.', icon: Beef, roles: ['Admin', 'Manager', 'Farmer', 'Agric Extension Officer', 'Farm Staff'] },
  { href: '/farm-calendar', label: 'Calendar', icon: CalendarDays, roles: ['Admin', 'Manager', 'FieldOfficer', 'Farmer', 'Agric Extension Officer', 'Farm Staff'] },
  { href: '/task-management', label: 'Tasks', icon: ListChecks, roles: ['Admin', 'Manager', 'FieldOfficer', 'Farmer', 'Agric Extension Officer', 'Farm Staff'] },
  { href: '/resource-inventory', label: 'Inventory', icon: Archive, roles: ['Admin', 'Manager', 'Farmer', 'Farm Staff'] },
  { href: '/weather-monitoring', label: 'Weather', icon: CloudSun, roles: ['Admin', 'Manager', 'FieldOfficer', 'Farmer', 'Agric Extension Officer', 'Farm Staff'] },
  { href: '/planting-advice', label: 'AI Advice', icon: BrainCircuit, roles: ['Admin', 'Manager', 'Farmer', 'Agric Extension Officer'] },
];

// Role-specific items or sections
const managerNavItems: NavItem[] = [
  { href: '/reports/financial-dashboard', label: 'Financial Reports', icon: FileText, group: 'Reports', roles: ['Admin', 'Manager', 'Investor'] },
  { href: '/reports/budgeting', label: 'Budgeting', icon: Banknote, group: 'Reports', roles: ['Admin', 'Manager', 'Investor'] },
];

const fieldOfficerNavItems: NavItem[] = [];

const hrManagerNavItems: NavItem[] = [
  { href: '/hr/dashboard', label: 'HR Dashboard', icon: Briefcase, roles: ['HRManager', 'Admin'] },
  { href: '/hr/employee-records', label: 'Employee Records', icon: Users, roles: ['HRManager', 'Admin'] },
  { href: '/hr/payroll', label: 'Payroll', icon: Banknote, roles: ['HRManager', 'Admin'] },
];

const adminSystemNavItems: NavItem[] = [
  { href: '/admin/dashboard', label: 'Admin Overview', icon: ShieldHalf, adminOnly: true },
  { href: '/admin/users', label: 'Manage Users', icon: UsersRound, adminOnly: true },
];

const aeoNavItems: NavItem[] = [
  { href: '/aeo/dashboard', label: 'AEO Dashboard', icon: Compass, roles: ['Agric Extension Officer', 'Admin'] },
  { href: '/aeo/farmer-directory', label: 'Farmer Directory', icon: Users, roles: ['Agric Extension Officer', 'Admin'] },
];

const systemNavItems: NavItem[] = [
  { href: '/settings', label: 'Settings', icon: Settings, roles: ['Admin', 'Manager', 'FieldOfficer', 'HRManager', 'Farmer', 'Agric Extension Officer', 'Investor', 'Farm Staff'] },
];


export function MainNav() {
  const pathname = usePathname();
  const { userProfile, isLoading: isUserLoading } = useUserProfile();

  const userRoles = userProfile?.role || [];
  const isActualAdmin = userRoles.includes('Admin'); 

  const isActive = (href: string) => {
    // This function determines if a nav link is "active"
    if (href === '/') return pathname === '/';
    
    // Exact match for top-level dashboards or specific pages
    if (['/dashboard', '/admin/dashboard', '/aeo/dashboard', '/hr/dashboard', '/reports/financial-dashboard', '/settings'].includes(href)) {
        return pathname === href;
    }
    
    // For sections with sub-pages, check if the pathname starts with the href
    if (href === '/farm-management' && pathname.startsWith('/farm-management')) return true;
    if (href === '/animal-production' && pathname.startsWith('/animal-production')) return true;
    if (href === '/reports/budgeting' && pathname.startsWith('/reports/budgeting')) return true;
    
    // Special handling for AEO Farmer Directory and its sub-pages (profiles)
    if (href === '/aeo/farmer-directory' && (pathname.startsWith('/aeo/farmer-directory') || pathname.startsWith('/aeo/farmer-profile'))) return true;
    
    // General case for other potential top-level links
    return pathname.startsWith(href) && href.length > 1; // Avoids matching "/" for everything
  };

  const canViewItem = (item: NavItem): boolean => {
    if (isUserLoading) return false; 
    if (item.adminOnly) return isActualAdmin;
    if (!item.roles) return true; 
    if (item.roles.some(role => userRoles.includes(role))) return true; 
    
    if (item.hideWhenNoSpecificRole && userRoles.length > 0 && !item.roles.some(role => userRoles.includes(role))) {
      return false;
    }
    if (item.roles.length > 0 && userRoles.length === 0 && !isActualAdmin) return false; 

    return false; 
  };
  
  const allNavItems: NavItem[] = [
    ...baseNavItems,
    ...managerNavItems,
    ...fieldOfficerNavItems,
    ...hrManagerNavItems,
    ...aeoNavItems, 
    ...adminSystemNavItems,
    ...systemNavItems
  ];

  const uniqueNavItems = allNavItems.reduce((acc, current) => {
    const existingItem = acc.find(item => item.href === current.href);
    if (!existingItem) {
      acc.push(current);
    } else {
      if (current.adminOnly && !existingItem.adminOnly) {
        acc = acc.filter(item => item.href !== current.href);
        acc.push(current);
      } 
    }
    return acc;
  }, [] as NavItem[]);


  const visibleNavItems = uniqueNavItems.filter(canViewItem);

  const generalItems = visibleNavItems.filter(item => !item.group && !item.adminOnly && !item.href.startsWith('/aeo/') && !item.href.startsWith('/hr/') && !item.href.startsWith('/settings'));
  const reportItems = visibleNavItems.filter(item => item.group === 'Reports');
  const hrItems = visibleNavItems.filter(item => item.href.startsWith('/hr/'));
  const aeoItemsFiltered = visibleNavItems.filter(item => item.href.startsWith('/aeo/'));
  const systemItemsFiltered = visibleNavItems.filter(item => item.href.startsWith('/settings'));
  const adminItemsFiltered = visibleNavItems.filter(item => item.adminOnly);


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
  
  if (userRoles.length === 0 && !isActualAdmin && !isUserLoading) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <div className="p-2 text-xs text-sidebar-foreground/70 group-data-[collapsible=icon]:hidden">
            Your roles are not yet assigned. Please contact an administrator.
          </div>
        </SidebarMenuItem>
        {renderNavItem({ href: '/profile', label: 'My Profile', icon: UserCircle })}
      </SidebarMenu>
    );
  }


  return (
    <SidebarMenu>
      {generalItems.map(renderNavItem)}

      {reportItems.length > 0 && (
        <>
          <SidebarSeparator className="my-2" />
          <SidebarGroupLabel className="px-2 group-data-[collapsible=icon]:hidden">Reports & Planning</SidebarGroupLabel>
          {reportItems.map(renderNavItem)}
        </>
      )}
      
      {hrItems.length > 0 && (
        <>
          <SidebarSeparator className="my-2" />
          <SidebarGroupLabel className="px-2 group-data-[collapsible=icon]:hidden">HR Management</SidebarGroupLabel>
          {hrItems.map(renderNavItem)}
        </>
      )}

      {aeoItemsFiltered.length > 0 && (
        <>
          <SidebarSeparator className="my-2" />
          <SidebarGroupLabel className="px-2 group-data-[collapsible=icon]:hidden">AEO Tools</SidebarGroupLabel>
          {aeoItemsFiltered.map(renderNavItem)}
        </>
      )}

      {(adminItemsFiltered.length > 0 || systemItemsFiltered.length > 0) && (
        <>
          <SidebarSeparator className="my-2" />
           <SidebarGroupLabel className="px-2 group-data-[collapsible=icon]:hidden">System</SidebarGroupLabel>
          {adminItemsFiltered.map(renderNavItem)}
          {systemItemsFiltered.map(renderNavItem)}
        </>
      )}
    </SidebarMenu>
  );
}
