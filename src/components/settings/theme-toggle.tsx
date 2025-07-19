
'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [isMounted, setIsMounted] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleThemeChange = (checked: boolean) => {
    const newTheme = checked ? 'dark' : 'light';
    setTheme(newTheme);
    toast({ title: "Theme Updated", description: `Switched to ${newTheme} mode.` });
  };
  
  if (!isMounted) {
    return null; 
  }

  const isDark = theme === 'dark';

  return (
    <div className="flex items-center space-x-2">
      <Sun className={`h-6 w-6 text-yellow-500 transition-opacity ${isDark ? 'opacity-50' : 'opacity-100'}`} />
      <Switch
        checked={isDark}
        onCheckedChange={handleThemeChange}
        id="theme-toggle"
        aria-label="Toggle theme"
      />
      <Moon className={`h-6 w-6 text-slate-500 transition-opacity ${isDark ? 'opacity-100' : 'opacity-50'}`} />
    </div>
  );
}
