
'use client';

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { AlertTriangle, DatabaseZap, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ThemeToggle } from "@/components/settings/theme-toggle";
import { LanguageToggle } from "@/components/settings/language-toggle";
import { useLanguage } from "@/hooks/use-language";
import { terminate, clearIndexedDbPersistence, disableNetwork, enableNetwork } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function SettingsPage() {
    const { t } = useLanguage();
    const { toast } = useToast();

    const [isAppLockEnabled, setIsAppLockEnabled] = useState(false);
    const [lastSynced, setLastSynced] = useState<string | null>(null);

    useEffect(() => {
        const appLock = localStorage.getItem('app-lock-enabled') === 'true';
        setIsAppLockEnabled(appLock);
        const lastSyncTime = localStorage.getItem('last-sync-time');
        if (lastSyncTime) {
            setLastSynced(new Date(lastSyncTime).toLocaleString());
        }
    }, []);

    const handleAppLockToggle = (enabled: boolean) => {
        localStorage.setItem('app-lock-enabled', String(enabled));
        setIsAppLockEnabled(enabled);
        if (enabled) {
            toast({ title: t('app_lock_enabled_title'), description: t('app_lock_enabled_desc') });
        } else {
            toast({ title: t('app_lock_disabled_title'), description: t('app_lock_disabled_desc') });
        }
    };

    const handleManualSync = async () => {
        toast({
            title: t('syncing_data_title'),
            description: t('syncing_data_desc')
        });
        try {
            await disableNetwork(db);
            await enableNetwork(db);
            
            const now = new Date();
            setLastSynced(now.toLocaleString());
            localStorage.setItem('last-sync-time', now.toISOString());
            
            toast({
                title: t('sync_complete_title'),
                description: t('sync_complete_desc')
            });
        } catch (error) {
            console.error("Manual sync failed:", error);
            toast({
                variant: "destructive",
                title: t('sync_failed_title'),
                description: t('sync_failed_desc')
            });
        }
    }

    const handleDeleteAllData = async () => {
        try {
            await terminate(db);
            await clearIndexedDbPersistence(db.app);
            toast({
                variant: "destructive",
                title: t('data_cleared_title'),
                description: t('data_cleared_desc')
            });
        } catch (error) {
            console.error("Error clearing local data:", error);
            toast({
                variant: "destructive",
                title: t('error_title'),
                description: t('data_clear_error_desc')
            });
        }
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="settings_title"
                description="settings_description"
            />
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                 <Card className="glass-card">
                    <CardHeader>
                        <CardTitle>{t('appearance_title')}</CardTitle>
                        <CardDescription>{t('appearance_description')}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-3">
                            <Label>{t('theme_label')}</Label>
                            <ThemeToggle />
                        </div>
                        <div className="space-y-3">
                            <Label>{t('language_label')}</Label>
                            <LanguageToggle />
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass-card">
                    <CardHeader>
                        <CardTitle>{t('security_title')}</CardTitle>
                        <CardDescription>{t('security_description')}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                            <Label htmlFor="app-lock" className="flex flex-col space-y-1">
                                <span>{t('app_lock_label')}</span>
                                <span className="font-normal leading-snug text-muted-foreground">
                                    {t('app_lock_description')}
                                </span>
                            </Label>
                            <Switch id="app-lock" checked={isAppLockEnabled} onCheckedChange={handleAppLockToggle} />
                        </div>
                         <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                            <Label htmlFor="email-notifications" className="flex flex-col space-y-1">
                                 <span>{t('email_notifications_label')}</span>
                                <span className="font-normal leading-snug text-muted-foreground">
                                    {t('email_notifications_description')}
                                </span>
                            </Label>
                            <Switch id="email-notifications" defaultChecked />
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass-card">
                    <CardHeader>
                        <CardTitle>{t('data_sync_title')}</CardTitle>
                        <CardDescription>{t('data_sync_description')}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                         <Button onClick={handleManualSync} className="w-full justify-start">
                            <DatabaseZap className="mr-2 h-4 w-4" /> {t('manual_sync_button')}
                        </Button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" className="w-full justify-start">
                                    <Trash2 className="mr-2 h-4 w-4" /> {t('delete_data_button')}
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle className="flex items-center gap-2">
                                        <AlertTriangle className="text-destructive"/>{t('delete_data_alert_title')}
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                        {t('delete_data_alert_description')}
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleDeleteAllData}>
                                        {t('delete_data_alert_confirm')}
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </CardContent>
                    <CardFooter>
                        <p className="text-xs text-muted-foreground">
                          {t('last_synced_label')} {lastSynced || t('never')}
                        </p>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}

      