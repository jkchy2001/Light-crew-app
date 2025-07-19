
'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { usePathname, useRouter } from 'next/navigation';

const MIN_SPLASH_TIME = 2500; // 2.5 seconds

interface AuthContextType {
  user: User | null;
  loading: boolean;
  appLocked: boolean;
  setAppLocked: (locked: boolean) => void;
}

const AuthContext = createContext<AuthContextType>({ 
    user: null, 
    loading: true,
    appLocked: false,
    setAppLocked: () => {}
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [splashVisible, setSplashVisible] = useState(true);
  const [appLocked, setAppLocked] = useState(false);
  const [sessionUnlocked, setSessionUnlocked] = useState(false);

  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Show splash screen for a minimum duration
    const splashTimer = setTimeout(() => {
      setSplashVisible(false);
    }, MIN_SPLASH_TIME);

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    
    return () => {
      clearTimeout(splashTimer);
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (authLoading) return;
    
    if (user && !sessionUnlocked) {
      const isLockEnabled = localStorage.getItem('app-lock-enabled') === 'true';
      setAppLocked(isLockEnabled);
    } else {
      setAppLocked(false);
    }
  }, [user, sessionUnlocked, authLoading]);


  const loading = authLoading || splashVisible;

  useEffect(() => {
    if (loading) return;

    const isAuthPage = pathname.startsWith('/auth');
    const isPublicPage = ['/terms', '/privacy', '/about', '/contact', '/user-manual'].includes(pathname);
    const isRootPage = pathname === '/';
    
    // Add forgot-password to the check for auth pages to prevent redirect loops
    if (user && appLocked && !isRootPage && pathname !== '/auth/forgot-password') {
        router.push('/');
        return;
    }

    if (!user && !isAuthPage && !isPublicPage) {
      router.push('/auth/login');
    } else if (user && !appLocked && isAuthPage) {
      router.push('/dashboard');
    }
  }, [user, loading, pathname, router, appLocked]);


  const handleUnlock = useCallback(() => {
    setAppLocked(false);
    setSessionUnlocked(true); // Mark session as unlocked
    // The redirect is now handled by the RootPage component
  }, []);

  const value = { user, loading, appLocked, setAppLocked: handleUnlock };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
