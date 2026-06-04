'use client';
import { MembershipRequestStatus, PermissionKey } from '@repo/data';
import { useMembershipRequestCount } from '@repo/data/react';
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
  BuildingIcon,
  CalendarIcon,
  ClipboardListIcon,
  ClockIcon,
  LogOutIcon,
  NetworkIcon,
  ScanFace,
  ScanQrCode,
  SettingsIcon,
  ShieldIcon,
  UsersIcon,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { OrgSwitcher } from '@/domain/organization/components/org-switcher';
import { signOut } from '@/lib/auth';

interface DashboardSidebarProps {
  permissions: PermissionKey[];
}

export function DashboardSidebar({ permissions }: DashboardSidebarProps) {
  const params = useParams();
  const router = useRouter();
  const orgUId = params.orgUId as string | undefined;

  const { data: pendingCount } = useMembershipRequestCount(
    orgUId ?? '',
    MembershipRequestStatus.Pending,
  );

  const menuItems = useMemo(() => {
    if (!orgUId) return [];

    return [
      {
        title: 'Overview',
        href: `/${orgUId}`,
        icon: BuildingIcon,
      },
      {
        title: 'Shifts',
        href: `/${orgUId}/shifts`,
        icon: CalendarIcon,
      },
      {
        title: 'Timesheets',
        href: `/${orgUId}/timesheets`,
        icon: ClockIcon,
      },
      {
        title: 'Volunteers',
        href: `/${orgUId}/volunteers`,
        icon: UsersIcon,
        count: pendingCount,
      },
      {
        title: 'Check-in/out',
        href: `/${orgUId}/check-in/scan`,
        icon: ScanQrCode,
      },
      {
        title: 'Requirement Forms',
        href: `/${orgUId}/requirement-forms`,
        icon: ClipboardListIcon,
      },
    ];
  }, [orgUId, pendingCount]);

  const permissionSet = useMemo(() => new Set(permissions), [permissions]);

  const settingsItems = useMemo(() => {
    if (!orgUId) return [];

    return [
      {
        title: 'Settings',
        href: `/${orgUId}/settings`,
        icon: SettingsIcon,
      },
      {
        title: 'Roles',
        href: `/${orgUId}/settings/roles`,
        icon: ShieldIcon,
        permission: PermissionKey.OrgView,
      },
      {
        title: 'Org Units',
        href: `/${orgUId}/settings/org-units`,
        icon: NetworkIcon,
        permission: PermissionKey.OrgView,
      },
      {
        title: 'QR iD',
        href: `/${orgUId}/me/id`,
        icon: ScanFace,
      },
    ].filter((item) => !item.permission || permissionSet.has(item.permission));
  }, [orgUId, permissionSet]);

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
                      <a
                        href={item.href}
                        className="flex items-center justify-between w-full"
                      >
                        <span className="flex items-center gap-2">
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </span>
                        {'count' in item && item.count ? (
                          <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-muted px-1.5 text-xs font-medium text-muted-foreground">
                            {item.count}
                          </span>
                        ) : null}
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
          <LogOutIcon />
          Sign Out
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
