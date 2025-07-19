
'use client';

import { useAuth } from '@/components/auth/auth-provider';
import { usePathname } from 'next/navigation';
import { useIsMobile } from '@/hooks/use-mobile';
import { SplashScreen } from '@/components/shared/splash-screen';
import { Sidebar } from '@/components/ui/sidebar';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { BottomNav } from '@/components/layout/bottom-nav';
import { Header } from '@/components/layout/header';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export function AppContent({ children }: { children: React.ReactNode }) {
  const [isMounted, setIsMounted] = useState(false);
  const isMobile = useIsMobile();
  const pathname = usePathname();
  const { loading, user, appLocked } = useAuth();
  
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const isAuthPage = pathname.startsWith('/auth');
  
  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <SplashScreen />
      </div>
    );
  }

  if (isAuthPage || (user && appLocked)) {
    return <>{children}</>;
  }
  
  if (!isMounted) {
     return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <SplashScreen />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen w-full">
      <Sidebar side="left" variant="sidebar" collapsible="icon">
        <SidebarNav />
      </Sidebar>
      <div className="flex flex-1 flex-col h-screen">
        <Header />
        <main className="flex-1 overflow-y-auto">
          <div className={cn("mx-auto p-4 md:p-6 lg:p-8", isMobile && "pb-24")}>
            {children}
          </div>
        </main>
      </div>
       {isMobile && <BottomNav />}
    </div>
  );
}
