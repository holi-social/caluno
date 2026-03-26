'use client';
import {
  Button,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@repo/ui';
import {
  CalendarIcon,
  ClockIcon,
  LogOutIcon,
  ScanFace,
  ScanQrCode,
  SettingsIcon,
  UsersIcon,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { OrgSwitcher } from '@/domain/organization/components/org-switcher';
import { signOut } from '@/lib/auth';

export function DashboardSidebar() {
  const params = useParams();
  const router = useRouter();
  const orgId = params.orgId as string | undefined;

  const menuItems = useMemo(() => {
    if (!orgId) return [];

    return [
      {
        title: 'Shifts',
        href: `/${orgId}/shifts`,
        icon: CalendarIcon,
      },
      {
        title: 'Timesheets',
        href: `/${orgId}/timesheets`,
        icon: ClockIcon,
      },
      {
        title: 'Volunteers',
        href: `/${orgId}/volunteers`,
        icon: UsersIcon,
      },
      {
        title: 'Check-in/out',
        href: `/${orgId}/check-in/scan`,
        icon: ScanQrCode,
      },
      {
        title: 'Membership Requests',
        href: `/${orgId}/membership-requests`,
        icon: UsersIcon,
      },
    ];
  }, [orgId]);

  const settingsItems = useMemo(() => {
    if (!orgId) return [];

    return [
      {
        title: 'Settings',
        href: `/${orgId}/settings`,
        icon: SettingsIcon,
      },
      {
        title: 'QR iD',
        href: `/${orgId}/me/id`,
        icon: ScanFace,
      },
    ];
  }, [orgId]);

  async function handleSignOut() {
    await signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <Sidebar>
      <SidebarHeader className="border-b px-4 py-3 space-y-2">
        <div className="text-lg font-bold px-2">Clippy</div>
        <OrgSwitcher />
      </SidebarHeader>

      <SidebarContent>
        {menuItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Menu</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {menuItems.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild>
                      <a href={item.href}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {settingsItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Settings</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {settingsItems.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild>
                      <a href={item.href}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={handleSignOut}
        >
          <LogOutIcon className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
