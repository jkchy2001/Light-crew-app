
'use client';

import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Mail, Phone, MapPin } from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/hooks/use-language';

// Placeholder contact information
const contactDetails = {
  email: 'jkchy2024@gmail.com',
  address: 'Darbhanga Bihar India 847204',
};

export default function ContactPage() {
  const { t } = useLanguage();

  return (
    <div className="space-y-8">
      <PageHeader
        title="contact_title"
        description="contact_description"
      />

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>{t('get_in_touch_title')}</CardTitle>
          <CardDescription>
            {t('get_in_touch_desc')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/50">
            <Mail className="h-6 w-6 text-primary mt-1" />
            <div>
              <h3 className="font-semibold">{t('email_label')}</h3>
              <p className="text-muted-foreground">
                {t('email_desc')}
              </p>
              <Link href={`mailto:${contactDetails.email}`} className="text-primary hover:underline">
                {contactDetails.email}
              </Link>
            </div>
          </div>
          <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/50">
            <MapPin className="h-6 w-6 text-primary mt-1" />
            <div>
              <h3 className="font-semibold">{t('address_label')}</h3>
              <p className="text-muted-foreground">
                {t('address_desc')}
              </p>
              <p className="text-foreground">{contactDetails.address}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
