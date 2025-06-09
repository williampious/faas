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
  type LucideIcon,
} from 'lucide-react';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/farm-calendar', label: 'Farm Calendar', icon: CalendarDays },
  { href: '/resource-inventory', label: 'Resource Inventory', icon: Archive },
  { href: '/weather-monitoring', label: 'Weather Monitoring', icon: CloudSun },
  { href: '/task-management', label: 'Task Management', icon: ListChecks },
  { href: '/planting-advice', label: 'Planting Advice', icon: BrainCircuit },
];

export function MainNav() {
  const pathname = usePathname();

  return (
    <SidebarMenu>
      {navItems.map((item) => (
        <SidebarMenuItem key={item.href}>
          <Link href={item.href} asChild>
            <SidebarMenuButton
              className={cn(
                'w-full justify-start text-base',
                pathname === item.href
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90 hover:text-sidebar-primary-foreground'
                  : 'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              )}
              isActive={pathname === item.href}
              tooltip={{children: item.label, className: "font-body"}}
            >
              <item.icon className="h-5 w-5 mr-2" />
              <span className="truncate font-body">{item.label}</span>
            </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
