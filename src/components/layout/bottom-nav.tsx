
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Film, LayoutDashboard, Users, CalendarDays, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks/use-language';

const navItems = [
  { href: '/dashboard', i18nKey: 'dashboard_title', icon: LayoutDashboard },
  { href: '/projects', i18nKey: 'projects_title', icon: Film },
  { href: '/attendance', i18nKey: 'attendance_title', icon: CalendarDays },
  { href: '/team', i18nKey: 'team_title', icon: Users },
  { href: '/payments', i18nKey: 'payments_title', icon: Wallet },
];

export function BottomNav() {
  const pathname = usePathname();
  const { t } = useLanguage();

  return (
    <div className="fixed bottom-0 left-0 z-50 w-full h-16 border-t bg-background/90 backdrop-blur-lg">
      <div className="grid h-full max-w-lg grid-cols-5 mx-auto">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'inline-flex flex-col items-center justify-center px-5 hover:bg-muted/50 group transition-colors',
              pathname.startsWith(item.href) ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <item.icon className="w-6 h-6 mb-1" />
            <span className="text-xs font-medium">{t(item.i18nKey)}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
