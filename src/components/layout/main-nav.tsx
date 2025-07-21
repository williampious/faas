
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React from 'react';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
  SidebarGroupLabel,
  SidebarMenuSkeleton,
  useSidebar,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { useUserProfile } from '@/contexts/user-profile-context';
import { allNavItems, type NavItem } from '@/lib/nav-data'; // Import from the new file

export function MainNav() {
  const pathname = usePathname();
  const { userProfile, isLoading: isUserLoading } = useUserProfile();
  const { setOpenMobile } = useSidebar();

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

  const handleLinkClick = () => {
    setOpenMobile(false);
  };

  const renderNavItem = (item: NavItem) => (
    <SidebarMenuItem key={item.href} onClick={handleLinkClick}>
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
