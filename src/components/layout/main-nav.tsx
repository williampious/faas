
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
  type LucideIcon,
} from 'lucide-react';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
  SidebarGroupLabel,
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
  { href: '/farm-calendar', label: 'Calendar', icon: CalendarDays, roles: ['Admin', 'Manager', 'FieldOfficer', 'Farmer', 'Agric Extension Officer', 'Farm Staff'] },
  { href: '/task-management', label: 'Tasks', icon: ListChecks, roles: ['Admin', 'Manager', 'FieldOfficer', 'Farmer', 'Agric Extension Officer', 'Farm Staff'] },
  { href: '/resource-inventory', label: 'Inventory', icon: Archive, roles: ['Admin', 'Manager', 'Farmer', 'Farm Staff'] },
  { href: '/weather-monitoring', label: 'Weather', icon: CloudSun, roles: ['Admin', 'Manager', 'FieldOfficer', 'Farmer', 'Agric Extension Officer', 'Farm Staff'] },
  { href: '/planting-advice', label: 'AI Advice', icon: BrainCircuit, roles: ['Admin', 'Manager', 'Farmer', 'Agric Extension Officer'] },
  { href: '/profile', label: 'My Profile', icon: UserCircle, roles: ['Admin', 'Manager', 'FieldOfficer', 'HRManager', 'Farmer', 'Agric Extension Officer', 'Investor', 'Farm Staff'] },
];

// Role-specific items or sections
const managerNavItems: NavItem[] = [
  // Managers see most base items. Additional specific views can be added here.
  // For example, if reports/financial-dashboard is manager-specific or more detailed for them:
  { href: '/reports/financial-dashboard', label: 'Financial Reports', icon: FileText, group: 'Reports', roles: ['Admin', 'Manager', 'Investor'] },
  { href: '/reports/budgeting', label: 'Budgeting', icon: Banknote, group: 'Reports', roles: ['Admin', 'Manager', 'Investor'] },
];

const fieldOfficerNavItems: NavItem[] = [
  // Field Officers see a subset. 'Task Management' is already in baseNavItems.
  // "GPS Tools", "Data Entry" could be sections within Task Management or new pages.
  // For now, their view is filtered from baseNavItems.
  // Example of a specific FO tool page (placeholder):
  // { href: '/field-officer/data-entry', label: 'Field Data Entry', icon: ClipboardList, roles: ['FieldOfficer', 'Admin'] },
];

const hrManagerNavItems: NavItem[] = [
  // "HR Dashboard", "Employee Records", "Attendance Log" are new concepts.
  // Placeholders for now:
  { href: '/hr/dashboard', label: 'HR Dashboard', icon: Briefcase, roles: ['HRManager', 'Admin'] },
  { href: '/hr/employee-records', label: 'Employee Records', icon: Users, roles: ['HRManager', 'Admin'] },
  // Attendance log might be a feature within employee records or task management.
];

const adminSystemNavItems: NavItem[] = [
  { href: '/admin/dashboard', label: 'Admin Overview', icon: ShieldHalf, adminOnly: true },
  { href: '/admin/users', label: 'Manage Users', icon: UsersRound, adminOnly: true },
  // { href: '/admin/settings', label: 'System Settings', icon: Settings2, adminOnly: true }, // Example future item
];

const aeoNavItems: NavItem[] = [
  { href: '/aeo/dashboard', label: 'AEO Dashboard', icon: Compass, roles: ['Agric Extension Officer', 'Admin'] },
  { href: '/aeo/farmer-directory', label: 'Farmer Directory', icon: Users, roles: ['Agric Extension Officer', 'Admin'] },
  // Other AEO items can be added if they are distinct from baseNav.
];


export function MainNav() {
  const pathname = usePathname();
  const { userProfile, isLoading: isUserLoading } = useUserProfile();

  const userRoles = userProfile?.role || [];
  const isActualAdmin = userRoles.includes('Admin'); // The first user, or anyone assigned Admin role

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    // Make dashboard active only if it's the exact path, not a prefix for other dashboards
    if (href === '/dashboard' || href === '/admin/dashboard' || href === '/aeo/dashboard' || href === '/hr/dashboard') {
        return pathname === href;
    }
    return pathname.startsWith(href);
  };

  const canViewItem = (item: NavItem): boolean => {
    if (isUserLoading) return false; // Don't show anything while loading roles
    if (item.adminOnly) return isActualAdmin;
    if (!item.roles) return true; // No specific roles defined, visible to all authenticated (after login)
    if (item.roles.some(role => userRoles.includes(role))) return true; // User has at least one of the required roles
    
    // If item.hideWhenNoSpecificRole is true, and user has roles, but none match, hide it.
    // This handles cases where a user has some roles, but not the specific one for this item.
    if (item.hideWhenNoSpecificRole && userRoles.length > 0 && !item.roles.some(role => userRoles.includes(role))) {
      return false;
    }
    // If item has roles, user has no roles, then user cannot see it (unless it's adminOnly and they are Admin)
    if (item.roles.length > 0 && userRoles.length === 0 && !isActualAdmin) return false; 

    return false; // Default to not showing if no conditions met
  };
  
  const allNavItems: NavItem[] = [
    ...baseNavItems,
    ...managerNavItems,
    ...fieldOfficerNavItems,
    ...hrManagerNavItems,
    ...aeoNavItems, // AEO specific tools
    ...adminSystemNavItems // System admin tools at the end
  ];

  // Deduplicate items by href, prioritizing items with more specific role definitions or adminOnly flags
  const uniqueNavItems = allNavItems.reduce((acc, current) => {
    const existingItem = acc.find(item => item.href === current.href);
    if (!existingItem) {
      acc.push(current);
    } else {
      // Prioritization logic: if current item is more specific (e.g. adminOnly)
      if (current.adminOnly && !existingItem.adminOnly) {
        acc = acc.filter(item => item.href !== current.href);
        acc.push(current);
      } else if (current.roles && (!existingItem.roles || current.roles.length < existingItem.roles.length)) {
         // This logic might need refinement if roles are additive rather than restrictive
      }
    }
    return acc;
  }, [] as NavItem[]);


  const visibleNavItems = uniqueNavItems.filter(canViewItem);

  // Group items for rendering
  const generalItems = visibleNavItems.filter(item => !item.group && !item.adminOnly && !item.href.startsWith('/aeo/') && !item.href.startsWith('/hr/'));
  const reportItems = visibleNavItems.filter(item => item.group === 'Reports');
  const hrItems = visibleNavItems.filter(item => item.href.startsWith('/hr/'));
  const aeoItemsFiltered = visibleNavItems.filter(item => item.href.startsWith('/aeo/'));
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
  
  // If user has no roles and is not admin, maybe show only profile link or a message
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

      {isActualAdmin && adminItemsFiltered.length > 0 && (
        <>
          <SidebarSeparator className="my-2" />
           <SidebarGroupLabel className="px-2 group-data-[collapsible=icon]:hidden">System Admin</SidebarGroupLabel>
          {adminItemsFiltered.map(renderNavItem)}
        </>
      )}
    </SidebarMenu>
  );
}
