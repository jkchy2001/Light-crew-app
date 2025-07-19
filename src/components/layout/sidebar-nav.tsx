
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Film, LayoutDashboard, Users, CalendarDays, BarChart, Settings, Clapperboard, User, ListChecks, Wallet, Info, MessageSquare, BookUser } from 'lucide-react';
import { SidebarHeader, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter, SidebarSeparator } from '@/components/ui/sidebar';
import { useSidebar } from '../ui/sidebar';
import { useLanguage } from '@/hooks/use-language';

const mainNavItems = [
  { href: '/dashboard', i18nKey: 'dashboard_title' },
  { href: '/projects', i18nKey: 'projects_title' },
  { href: '/attendance', i18nKey: 'attendance_title' },
  { href: '/team', i18nKey: 'team_title' },
  { href: '/payments', i18nKey: 'payments_title' },
  { href: '/reports', i18nKey: 'reports_title' },
  { href: '/masters', i18nKey: 'masters_title' },
];

const mainNavIcons: { [key: string]: React.ElementType } = {
  dashboard_title: LayoutDashboard,
  projects_title: Film,
  attendance_title: CalendarDays,
  team_title: Users,
  payments_title: Wallet,
  reports_title: BarChart,
  masters_title: ListChecks,
};


const secondaryNavItems = [
    { href: '/profile', i18nKey: 'profile_title' },
    { href: '/settings', i18nKey: 'settings_title' },
];

const secondaryNavIcons: { [key: string]: React.ElementType } = {
    profile_title: User,
    settings_title: Settings,
};

const infoNavItems = [
    { href: '/about', i18nKey: 'about_title' },
    { href: '/contact', i18nKey: 'contact_title' },
    { href: '/user-manual', i18nKey: 'manual_title' },
];

const infoNavIcons: { [key: string]: React.ElementType } = {
    about_title: Info,
    contact_title: MessageSquare,
    manual_title: BookUser,
};


export function SidebarNav() {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  const { t } = useLanguage();

  const closeSheet = () => setOpenMobile(false);

  return (
    <>
      <SidebarHeader className="border-b">
        <div className="flex items-center gap-2 p-2">
            <Clapperboard className="w-8 h-8 text-primary" />
            <span className="text-xl font-semibold">Light Crew</span>
        </div>
      </SidebarHeader>
      <SidebarContent className='p-2'>
        <SidebarMenu>
          {mainNavItems.map((item) => {
            const Icon = mainNavIcons[item.i18nKey];
            return (
                <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith(item.href)}
                    className="justify-start"
                    tooltip={t(item.i18nKey)}
                    onClick={closeSheet}
                >
                    <Link href={item.href}>
                    <Icon className="h-5 w-5" />
                    <span>{t(item.i18nKey)}</span>
                    </Link>
                </SidebarMenuButton>
                </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className='mt-auto border-t'>
         <SidebarMenu className="p-2">
             {infoNavItems.map((item) => {
                const Icon = infoNavIcons[item.i18nKey];
                return (
                    <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                        asChild
                        isActive={pathname === item.href}
                        className="justify-start"
                        tooltip={t(item.i18nKey)}
                        onClick={closeSheet}
                    >
                        <Link href={item.href}>
                        <Icon className="h-5 w-5" />
                        <span>{t(item.i18nKey)}</span>
                        </Link>
                    </SidebarMenuButton>
                    </SidebarMenuItem>
                )
            })}
            <SidebarSeparator className="my-1"/>
            {secondaryNavItems.map((item) => {
                const Icon = secondaryNavIcons[item.i18nKey];
                return(
                <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    className="justify-start"
                    tooltip={t(item.i18nKey)}
                    onClick={closeSheet}
                >
                    <Link href={item.href}>
                    <Icon className="h-5 w-5" />
                    <span>{t(item.i18nKey)}</span>
                    </Link>
                </SidebarMenuButton>
                </SidebarMenuItem>
                )
            })}
        </SidebarMenu>
      </SidebarFooter>
    </>
  );
}
