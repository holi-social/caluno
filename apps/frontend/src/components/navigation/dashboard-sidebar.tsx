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
  HandHeart,
  LogOutIcon,
  NetworkIcon,
  ScanQrCode,
  SettingsIcon,
  ShieldIcon,
  TicketIcon,
  UsersIcon,
} from 'lucide-react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { OrgSwitcher } from '@/domain/organization/components/org-switcher';
import { Link, useRouter } from '@/i18n/navigation';
import { signOut } from '@/lib/auth';

interface DashboardSidebarProps {
  permissions: PermissionKey[];
}

export function DashboardSidebar({ permissions }: DashboardSidebarProps) {
  const params = useParams();
  const router = useRouter();
  const orgUId = params.orgUId as string | undefined;
  const t = useTranslations('Navigation');
  const tCommon = useTranslations('Common');

  const { data: pendingCount } = useMembershipRequestCount(
    orgUId ?? '',
    MembershipRequestStatus.Pending,
  );

  const menuItems = useMemo(() => {
    if (!orgUId) return [];

    return [
      {
        titleKey: 'overview',
        href: `/admin/${orgUId}`,
        icon: BuildingIcon,
      },
      {
        titleKey: 'events',
        href: `/admin/${orgUId}/events`,
        icon: TicketIcon,
      },
      {
        titleKey: 'shifts',
        href: `/admin/${orgUId}/shifts`,
        icon: CalendarIcon,
      },
      {
        titleKey: 'timesheets',
        href: `/admin/${orgUId}/timesheets`,
        icon: ClockIcon,
      },
      {
        titleKey: 'volunteers',
        href: `/admin/${orgUId}/volunteers`,
        icon: UsersIcon,
        count: pendingCount,
      },
      {
        titleKey: 'checkInOut',
        href: `/admin/${orgUId}/check-in/scan`,
        icon: ScanQrCode,
      },
      {
        titleKey: 'requirementForms',
        href: `/admin/${orgUId}/requirement-forms`,
        icon: ClipboardListIcon,
      },
      {
        titleKey: 'volunteering',
        href: `/`,
        icon: HandHeart,
      },
    ];
  }, [orgUId, pendingCount]);

  const permissionSet = useMemo(() => new Set(permissions), [permissions]);

  const settingsItems = useMemo(() => {
    if (!orgUId) return [];

    return [
      {
        titleKey: 'settings',
        href: `/admin/${orgUId}/settings`,
        icon: SettingsIcon,
      },
      {
        titleKey: 'roles',
        href: `/admin/${orgUId}/settings/roles`,
        icon: ShieldIcon,
        permission: PermissionKey.OrgView,
      },
      {
        titleKey: 'orgUnits',
        href: `/admin/${orgUId}/settings/org-units`,
        icon: NetworkIcon,
        permission: PermissionKey.OrgView,
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
        <div className="text-lg font-bold px-2">{tCommon('brand')}</div>
        <OrgSwitcher />
      </SidebarHeader>

      <SidebarContent>
        {menuItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>{tCommon('menu')}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {menuItems.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild>
                      <Link
                        href={item.href}
                        className="flex items-center justify-between w-full"
                      >
                        <span className="flex items-center gap-2">
                          <item.icon className="h-4 w-4" />
                          <span>
                            {t(item.titleKey as Parameters<typeof t>[0])}
                          </span>
                        </span>
                        {'count' in item && item.count ? (
                          <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-muted px-1.5 text-xs font-medium text-muted-foreground">
                            {item.count}
                          </span>
                        ) : null}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {settingsItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>{t('settings')}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {settingsItems.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild>
                      <Link href={item.href}>
                        <item.icon className="h-4 w-4" />
                        <span>
                          {t(item.titleKey as Parameters<typeof t>[0])}
                        </span>
                      </Link>
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
          {tCommon('signOut')}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
