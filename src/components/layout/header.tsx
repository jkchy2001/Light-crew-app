
'use client';

import { useSidebar } from '@/components/ui/sidebar';
import { UserNav } from '@/components/layout/user-nav';
import { Button } from '../ui/button';
import { PanelLeft, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Clapperboard } from 'lucide-react';
import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>;
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}


export function Header() {
  const { toggleSidebar } = useSidebar();
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = () => {
    if (!installPrompt) {
      return;
    }
    installPrompt.prompt();
    installPrompt.userChoice.then(() => {
      setInstallPrompt(null);
    });
  };
  
  return (
    <header className={cn("sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 backdrop-blur-lg px-4 md:px-6")}>
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={toggleSidebar}
        aria-label="Toggle Sidebar"
      >
        <PanelLeft className="size-5" />
      </Button>
      {/* Mobile Header Title */}
      <div className="flex items-center gap-2 md:hidden">
        <Clapperboard className="w-7 h-7 text-primary" />
        <span className="text-lg font-semibold">Light Crew</span>
      </div>
      
      <div className="flex-1" />

      <div className="flex items-center gap-4">
        {installPrompt && (
          <Button onClick={handleInstallClick} size="sm">
            <Download className="mr-2 h-4 w-4" />
            Install App
          </Button>
        )}
        <UserNav />
      </div>
    </header>
  );
}
