'use client';
import { useAuth } from '@/components/auth/auth-provider';
import { useRouter } from 'next/navigation';
import { SplashScreen } from '@/components/shared/splash-screen';
import { AppLockScreen } from '@/components/auth/app-lock-screen';
import { useEffect } from 'react';

export default function RootPage() {
  const { user, loading, appLocked, setAppLocked } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user && !appLocked) {
        router.replace('/dashboard');
      } else if (!user) {
        router.replace('/auth/login');
      }
    }
  }, [user, loading, appLocked, router]);


  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <SplashScreen />
      </div>
    );
  }

  if (user && appLocked) {
      return <AppLockScreen onUnlock={() => setAppLocked(false)} />
  }

  return null;
}
