
'use client';

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth/auth-provider";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useMemo } from "react";
import { updateProfile, reauthenticateWithCredential, EmailAuthProvider, updatePassword } from "firebase/auth";
import { doc, getDoc, setDoc, query, collection, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useFirestoreQuery } from "@/hooks/use-firestore-query";
import type { CrewMember, UserProfile } from "@/lib/types";
import { useLanguage } from "@/hooks/use-language";

export default function ProfilePage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const { t } = useLanguage();
    
    const [name, setName] = useState(user?.displayName || '');
    const [mobile, setMobile] = useState('');
    const [profileCurrentPassword, setProfileCurrentPassword] = useState('');
    const [isProfileSaving, setIsProfileSaving] = useState(false);
    const [isFetchingMobile, setIsFetchingMobile] = useState(true);

    const [passwordChangeCurrent, setPasswordChangeCurrent] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [isPasswordSaving, setIsPasswordSaving] = useState(false);

    useEffect(() => {
        if (user) {
            setName(user.displayName || '');
            const fetchMobile = async () => {
                setIsFetchingMobile(true);
                const userDocRef = doc(db, "users", user.uid);
                const docSnap = await getDoc(userDocRef);
                if (docSnap.exists() && (docSnap.data() as UserProfile).mobile) {
                    setMobile((docSnap.data() as UserProfile).mobile);
                }
                setIsFetchingMobile(false);
            };
            fetchMobile();
        }
    }, [user]);
    
    const crewQuery = useMemo(() => {
        if (!mobile) return null;
        return query(collection(db, 'crew'), where('mobile', '==', mobile));
    }, [mobile]);

    const { data: crewData, isLoading: isCrewLoading } = useFirestoreQuery<CrewMember>(crewQuery);
    const crewMember = useMemo(() => crewData?.[0], [crewData]);

    const reauthenticateUser = async (password: string) => {
        if (!user || !user.email) {
            throw new Error("User not found or email is not available for reauthentication.");
        }
        const credential = EmailAuthProvider.credential(user.email, password);
        await reauthenticateWithCredential(user, credential);
        return true;
    };

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setIsProfileSaving(true);
        try {
            await reauthenticateUser(profileCurrentPassword);
            
            await updateProfile(user, { displayName: name });
            
            const userDocRef = doc(db, "users", user.uid);
            await setDoc(userDocRef, { name: name, mobile: mobile }, { merge: true });

            toast({ title: t('profile_updated_success_title'), description: t('profile_updated_success_desc') });
            setProfileCurrentPassword('');
        } catch (error: any) {
            console.error("Profile update error:", error);
            let description = t('unexpected_error_desc');
            if (error.code === 'auth/wrong-password') {
                description = t('incorrect_password_desc');
            } else if (error.code === 'auth/too-many-requests') {
                description = t('too_many_requests_desc');
            }
            toast({ variant: "destructive", title: t('update_failed_title'), description });
        } finally {
            setIsProfileSaving(false);
        }
    };
    
    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !newPassword) return;
        setIsPasswordSaving(true);
        try {
            await reauthenticateUser(passwordChangeCurrent);
            await updatePassword(user, newPassword);
            toast({ title: t('password_changed_success_title'), description: t('password_changed_success_desc') });
            setPasswordChangeCurrent('');
            setNewPassword('');
        } catch (error: any) {
            console.error("Password change error:", error);
            let description = t('unexpected_error_desc');
            if (error.code === 'auth/wrong-password') {
                description = t('incorrect_password_desc');
            } else if (error.code === 'auth/too-many-requests') {
                description = t('too_many_requests_desc');
            }
            toast({ variant: "destructive", title: t('password_change_failed_title'), description });
        } finally {
            setIsPasswordSaving(false);
        }
    };
    
    const isLoading = isProfileSaving || isFetchingMobile || isPasswordSaving || isCrewLoading;

    return (
        <div className="space-y-6">
            <PageHeader
                title="profile_title"
                description="profile_description"
            />
            <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
                <Card className="glass-card">
                    <CardHeader>
                        <CardTitle>{t('profile_info_title')}</CardTitle>
                        <CardDescription>{t('profile_info_desc')}</CardDescription>
                    </CardHeader>
                    <form onSubmit={handleProfileUpdate}>
                        <CardContent className="space-y-4">
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email-profile">{t('email_label')}</Label>
                                    <Input id="email-profile" type="email" value={user?.email || ''} disabled />
                                </div>
                                 <div className="space-y-2">
                                    <Label htmlFor="member-id">{t('member_id_label')}</Label>
                                    <Input id="member-id" value={crewMember?.mid || (isCrewLoading ? t('loading_placeholder') : t('not_found_placeholder'))} disabled />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">{t('full_name_label')}</Label>
                                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} disabled={isLoading} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="mobile">{t('mobile_number_label')}</Label>
                                    <Input id="mobile" type="tel" value={mobile} onChange={(e) => setMobile(e.target.value)} disabled={isLoading} placeholder={isFetchingMobile ? t('loading_placeholder') : ''} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="profile-password">{t('current_password_to_save_label')}</Label>
                                <Input id="profile-password" type="password" value={profileCurrentPassword} onChange={(e) => setProfileCurrentPassword(e.target.value)} required disabled={isLoading} />
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button type="submit" disabled={isLoading}>
                                {isProfileSaving ? t('saving_button_text') : t('save_profile_button_text')}
                            </Button>
                        </CardFooter>
                    </form>
                </Card>

                <Card className="glass-card">
                    <CardHeader>
                        <CardTitle>{t('change_password_title')}</CardTitle>
                        <CardDescription>{t('change_password_desc')}</CardDescription>
                    </CardHeader>
                    <form onSubmit={handlePasswordChange}>
                        <CardContent className="space-y-4">
                             <div className="space-y-2">
                                <Label htmlFor="current-password-change">{t('current_password_label')}</Label>
                                <Input id="current-password-change" type="password" value={passwordChangeCurrent} onChange={(e) => setPasswordChangeCurrent(e.target.value)} required disabled={isLoading} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="new-password">{t('new_password_label')}</Label>
                                <Input id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required disabled={isLoading} />
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button type="submit" disabled={isLoading}>
                                {isPasswordSaving ? t('updating_button_text') : t('update_password_button_text')}
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </div>
    );
}
