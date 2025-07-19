
'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/hooks/use-language';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';

export function LanguageToggle() {
  const { language, setLanguage, t } = useLanguage();
  const [isMounted, setIsMounted] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleLanguageChange = (checked: boolean) => {
    const newLang = checked ? 'hi' : 'en';
    setLanguage(newLang);
    toast({ 
        title: t('language_updated'), 
        description: `${t('language_switched_to')} ${newLang === 'hi' ? 'हिन्दी' : 'English'}.` 
    });
  };
  
  if (!isMounted) {
    return null; 
  }

  const isHindi = language === 'hi';

  return (
    <div className="flex items-center space-x-2">
      <Label htmlFor="language-toggle" className={`transition-opacity ${isHindi ? 'opacity-50' : 'opacity-100'}`}>
        English
      </Label>
      <Switch
        checked={isHindi}
        onCheckedChange={handleLanguageChange}
        id="language-toggle"
        aria-label="Toggle language"
      />
       <Label htmlFor="language-toggle" className={`transition-opacity ${isHindi ? 'opacity-100' : 'opacity-50'}`}>
        हिन्दी
      </Label>
    </div>
  );
}
