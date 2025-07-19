
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

export function PrivacyDialog() {
  const { t } = useLanguage();
  return (
    <Dialog>
      <DialogTrigger asChild>
        <span className="font-semibold text-primary hover:underline cursor-pointer">Privacy Policy</span>
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{t('privacy_title')}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-6">
            <div className="prose prose-invert prose-sm md:prose-base max-w-none text-muted-foreground space-y-4">
                <p className="text-xs text-muted-foreground">{t('privacy_last_updated')}</p>
                <p>
                    {t('privacy_intro')}
                </p>
                
                <h2 className="text-foreground">{t('privacy_collection_title')}</h2>
                <p>{t('privacy_collection_intro')}</p>
                <ul>
                    <li><strong>{t('privacy_collection_personal_title')}</strong> {t('privacy_collection_personal_desc')}</li>
                    <li><strong>{t('privacy_collection_financial_title')}</strong> {t('privacy_collection_financial_desc')}</li>
                    <li><strong>{t('privacy_collection_firebase_title')}</strong> {t('privacy_collection_firebase_desc')}</li>
                </ul>

                <h2 className="text-foreground">{t('privacy_use_title')}</h2>
                <p>{t('privacy_use_intro')}</p>
                <ul>
                    <li>{t('privacy_use_item1')}</li>
                    <li>{t('privacy_use_item2')}</li>
                    <li>{t('privacy_use_item3')}</li>
                    <li>{t('privacy_use_item4')}</li>
                    <li>{t('privacy_use_item5')}</li>
                    <li>{t('privacy_use_item6')}</li>
                </ul>

                <h2 className="text-foreground">{t('privacy_disclosure_title')}</h2>
                <p>{t('privacy_disclosure_intro')}</p>
                <ul>
                    <li><strong>{t('privacy_disclosure_law_title')}</strong> {t('privacy_disclosure_law_desc')}</li>
                    <li><strong>{t('privacy_disclosure_providers_title')}</strong> {t('privacy_disclosure_providers_desc')}</li>
                </ul>

                <h2 className="text-foreground">{t('privacy_ads_title')}</h2>
                <p>{t('privacy_ads_desc')}</p>

                <h2 className="text-foreground">{t('privacy_security_title')}</h2>
                <p>{t('privacy_security_desc')}</p>

                <h2 className="text-foreground">{t('contact_title')}</h2>
                <p>{t('privacy_contact_desc')}</p>
            </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
