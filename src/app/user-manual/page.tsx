
'use client';

import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useLanguage } from '@/hooks/use-language';

export default function UserManualPage() {
  const { t } = useLanguage();
  return (
    <div className="space-y-8">
      <PageHeader
        title="manual_title"
        description="manual_description"
      />

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>{t('manual_getting_started_title')}</CardTitle>
          <CardDescription>
            {t('manual_getting_started_desc')}
          </CardDescription>
        </CardHeader>
        <CardContent>
            <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                    <AccordionTrigger>{t('manual_dashboard_title')}</AccordionTrigger>
                    <AccordionContent>
                        {t('manual_dashboard_desc')}
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                    <AccordionTrigger>{t('manual_masters_title')}</AccordionTrigger>
                    <AccordionContent>
                        {t('manual_masters_desc_p1')}
                        <ul className="list-disc pl-6 mt-2 space-y-1">
                            <li><strong>{t('manual_masters_dop_gaffer_title')}</strong> {t('manual_masters_dop_gaffer_desc')}</li>
                            <li><strong>{t('manual_masters_designations_title')}</strong> {t('manual_masters_designations_desc')}</li>
                        </ul>
                        {t('manual_masters_desc_p2')}
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3">
                    <AccordionTrigger>{t('manual_projects_title')}</AccordionTrigger>
                    <AccordionContent>
                        {t('manual_projects_desc')}
                    </AccordionContent>
                </AccordionItem>
                 <AccordionItem value="item-4">
                    <AccordionTrigger>{t('manual_team_title')}</AccordionTrigger>
                    <AccordionContent>
                        {t('manual_team_desc')}
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-5">
                    <AccordionTrigger>{t('manual_attendance_title')}</AccordionTrigger>
                    <AccordionContent>
                        {t('manual_attendance_desc')}
                        <ol className="list-decimal pl-6 mt-2 space-y-1">
                          <li>{t('manual_attendance_step1')}</li>
                          <li>{t('manual_attendance_step2')}</li>
                          <li>{t('manual_attendance_step3')}</li>
                          <li>{t('manual_attendance_step4')}</li>
                          <li>{t('manual_attendance_step5')}</li>
                        </ol>
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-6">
                    <AccordionTrigger>{t('manual_payments_title')}</AccordionTrigger>
                    <AccordionContent>
                        {t('manual_payments_desc')}
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-7">
                    <AccordionTrigger>{t('manual_reports_title')}</AccordionTrigger>
                    <AccordionContent>
                        {t('manual_reports_desc_p1')}
                        <ul className="list-disc pl-6 mt-2 space-y-1">
                            <li><strong>{t('manual_reports_project_title')}</strong> {t('manual_reports_project_desc')}</li>
                            <li><strong>{t('manual_reports_crew_title')}</strong> {t('manual_reports_crew_desc')}</li>
                            <li><strong>{t('manual_reports_attendance_title')}</strong> {t('manual_reports_attendance_desc')}</li>
                        </ul>
                        {t('manual_reports_desc_p2')}
                    </AccordionContent>
                </AccordionItem>
                 <AccordionItem value="item-8">
                    <AccordionTrigger>{t('manual_app_lock_title')}</AccordionTrigger>
                    <AccordionContent>
                        {t('manual_app_lock_desc_p1')}
                        <ul className="list-disc pl-6 mt-2 space-y-1">
                            <li><strong>{t('manual_app_lock_enable_title')}</strong> {t('manual_app_lock_enable_desc')}</li>
                            <li><strong>{t('manual_app_lock_use_title')}</strong> {t('manual_app_lock_use_desc')}</li>
                            <li><strong>{t('manual_app_lock_forgot_title')}</strong> {t('manual_app_lock_forgot_desc')}</li>
                        </ul>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
