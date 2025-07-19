
'use client';

import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clapperboard, Zap, Users } from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';

export default function AboutPage() {
  const { t } = useLanguage();
  return (
    <div className="space-y-8">
      <PageHeader
        title="about_title"
        description="about_description"
      />

      <div className="grid md:grid-cols-2 gap-8">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>{t('our_mission_title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              {t('our_mission_content')}
            </p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>{t('our_vision_title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              {t('our_vision_content')}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>{t('key_features_title')}</CardTitle>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-primary/20 rounded-md">
                <Clapperboard className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">{t('feature_pm_title')}</h3>
              <p className="text-sm text-muted-foreground">{t('feature_pm_desc')}</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
             <div className="p-2 bg-primary/20 rounded-md">
                <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">{t('feature_crew_title')}</h3>
              <p className="text-sm text-muted-foreground">{t('feature_crew_desc')}</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
             <div className="p-2 bg-primary/20 rounded-md">
                <Zap className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">{t('feature_offline_title')}</h3>
              <p className="text-sm text-muted-foreground">{t('feature_offline_desc')}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
