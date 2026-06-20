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
  Building2,
  BuildingIcon,
  ClipboardListIcon,
  HomeIcon,
  LogOutIcon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { signOut } from '@/lib/auth';

export const menuItems = [
  {
    titleKey: 'home',
    href: '/',
    icon: HomeIcon,
  },
  {
    titleKey: 'organizations',
    href: '/organizations',
    icon: BuildingIcon,
  },
  {
    titleKey: 'myMembershipRequests',
    href: '/my-membership-requests',
    icon: ClipboardListIcon,
  },
];

export function HomeSidebar() {
  const router = useRouter();
  const t = useTranslations('Navigation');
  const tCommon = useTranslations('Common');

  async function handleSignOut() {
    await signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <Sidebar>
      <SidebarHeader className="border-b h-16 px-4 py-3 justify-center">
        <div className="flex items-center gap-2">
          <div className="bg-primary flex h-8 w-8 items-center justify-center rounded-lg">
            <Building2 className="text-primary-foreground h-4 w-4" />
          </div>
          <span className="font-semibold">{tCommon('brand')}</span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{tCommon('menu')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild>
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{t(item.titleKey as Parameters<typeof t>[0])}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={handleSignOut}
        >
          <LogOutIcon className="mr-2 h-4 w-4" />
          {tCommon('signOut')}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
