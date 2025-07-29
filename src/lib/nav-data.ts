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
  Archive,
  type LucideIcon,
} from 'lucide-react';
import type { UserRole } from '@/types/user';

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  group?: 'Workspace' | 'Operations' | 'Planning & Reports' | 'Specialized Tools' | 'System';
  roles?: UserRole[];
}

export const allNavItems: NavItem[] = [
  // Workspace
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, group: 'Workspace', roles: ['Admin', 'Manager', 'FieldOfficer', 'HRManager', 'Farmer', 'Agric Extension Officer', 'Investor', 'Farm Staff', 'OfficeManager', 'FinanceManager', 'Super Admin'] },
  { href: '/task-management', label: 'Tasks', icon: ListChecks, group: 'Workspace', roles: ['Admin', 'Manager', 'FieldOfficer', 'Farmer', 'Agric Extension Officer', 'Farm Staff'] },
  { href: '/farm-calendar', label: 'Calendar', icon: CalendarDays, group: 'Workspace', roles: ['Admin', 'Manager', 'FieldOfficer', 'Farmer', 'Agric Extension Officer', 'Farm Staff'] },
  { href: '/resource-inventory', label: 'Inventory', icon: Archive, group: 'Workspace', roles: ['Admin', 'Manager', 'FieldOfficer', 'Farmer', 'Agric Extension Officer', 'Farm Staff'] },

  // Operations
  { href: '/farm-management', label: 'Farm Operations', icon: Tractor, group: 'Operations', roles: ['Admin', 'Manager', 'Farmer', 'Agric Extension Officer', 'Farm Staff'] },
  { href: '/animal-production', label: 'Animal Production', icon: Beef, group: 'Operations', roles: ['Admin', 'Manager', 'Farmer', 'Agric Extension Officer', 'Farm Staff'] },
  
  // Planning & Reports
  { href: '/reports/financial-dashboard', label: 'Financials', icon: FileText, group: 'Planning & Reports', roles: ['Admin', 'Manager', 'Investor', 'FinanceManager', 'OfficeManager'] },
  { href: '/reports/budgeting', label: 'Budgeting', icon: Banknote, group: 'Planning & Reports', roles: ['Admin', 'Manager', 'Investor', 'FinanceManager', 'OfficeManager'] },
  { href: '/planting-advice', label: 'AI Advice', icon: BrainCircuit, group: 'Planning & Reports', roles: ['Admin', 'Manager', 'Farmer', 'Agric Extension Officer'] },
  
  // Specialized Tools
  { href: '/hr/dashboard', label: 'HR Management', icon: Briefcase, group: 'Specialized Tools', roles: ['HRManager', 'Admin'] },
  { href: '/office-management/dashboard', label: 'Office Mgmt', icon: Briefcase, group: 'Specialized Tools', roles: ['Admin', 'OfficeManager', 'FinanceManager'] },
  { href: '/aeo/dashboard', label: 'AEO Toolkit', icon: Compass, group: 'Specialized Tools', roles: ['Agric Extension Officer', 'Admin'] },
  
  // System
  { href: '/admin/dashboard', label: 'Admin Panel', icon: ShieldHalf, group: 'System', roles: ['Admin', 'Super Admin'] },
  { href: '/settings', label: 'Settings', icon: Settings, group: 'System', roles: ['Admin', 'Manager', 'FieldOfficer', 'HRManager', 'Farmer', 'Agric Extension Officer', 'Investor', 'Farm Staff', 'OfficeManager', 'FinanceManager', 'Super Admin'] },
];
