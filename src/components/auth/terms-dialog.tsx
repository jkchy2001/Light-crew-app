
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useLanguage } from '@/hooks/use-language';
import { ScrollArea } from '@/components/ui/scroll-area';

export function TermsDialog() {
  const { t } = useLanguage();
  return (
    <Dialog>
      <DialogTrigger asChild>
        <span className="font-semibold text-primary hover:underline cursor-pointer">Terms and Conditions</span>
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{t('terms_title')}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-6">
            <div className="prose prose-invert prose-sm md:prose-base max-w-none text-muted-foreground space-y-4">
                <p className="text-xs text-muted-foreground">{t('terms_last_updated')}</p>
                <p>
                {t('terms_intro')}
                </p>

                <h2 className="text-foreground">1. {t('terms_accounts_title')}</h2>
                <p>
                {t('terms_accounts_desc')}
                </p>

                <h2 className="text-foreground">2. {t('terms_content_title')}</h2>
                <p>
                {t('terms_content_desc')}
                </p>

                <h2 className="text-foreground">3. {t('terms_ip_title')}</h2>
                <p>
                {t('terms_ip_desc')}
                </p>

                <h2 className="text-foreground">4. {t('terms_liability_title')}</h2>
                <p>
                {t('terms_liability_desc')}
                </p>
                
                <h2 className="text-foreground">5. {t('terms_law_title')}</h2>
                <p>
                    {t('terms_law_desc')}
                </p>

                <h2 className="text-foreground">6. {t('terms_changes_title')}</h2>
                <p>
                {t('terms_changes_desc')}
                </p>
            </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
