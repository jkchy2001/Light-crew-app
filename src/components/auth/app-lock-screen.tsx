
'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Lock, Clapperboard } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from './auth-provider';
import { EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';

type AppLockScreenProps = {
    onUnlock: () => void;
}

export function AppLockScreen({ onUnlock }: AppLockScreenProps) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleUnlockSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!user || !user.email) {
            setError('Could not verify user. Please try logging in again.');
            return;
        }
        setIsLoading(true);
        try {
            const credential = EmailAuthProvider.credential(user.email, password);
            await reauthenticateWithCredential(user, credential);
            onUnlock();
        } catch (err: any) {
             let errorMessage = 'An unexpected error occurred.';
            if (err.code === 'auth/wrong-password') {
                errorMessage = 'Incorrect password. Please try again.';
            } else if (err.code === 'auth/too-many-requests') {
                errorMessage = 'Too many failed attempts. Your account is temporarily locked.';
            }
            setError(errorMessage);
            console.error("Reauthentication error:", err);
        } finally {
            setIsLoading(false);
            setPassword('');
        }
    };

    return (
        <div className="flex min-h-screen w-screen flex-col items-center justify-center p-4">
            <div className="w-full max-w-sm space-y-4">
                <div className="flex flex-col items-center justify-center gap-2 mb-6">
                    <Clapperboard className="w-10 h-10 text-primary" />
                    <h1 className="text-2xl font-bold">Light Crew</h1>
                </div>
                <Card className="glass-card">
                    <CardHeader className="items-center text-center">
                        <div className="p-4 bg-primary/20 rounded-full mb-2">
                            <Lock className="w-8 h-8 text-primary" />
                        </div>
                        <CardTitle>App Locked</CardTitle>
                        <CardDescription>Enter your password to unlock.</CardDescription>
                    </CardHeader>
                    <form onSubmit={handleUnlockSubmit}>
                        <CardContent className="space-y-2">
                             <Input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter your password"
                                className="h-12"
                                autoFocus
                                disabled={isLoading}
                            />
                            {error && <p className="text-sm text-destructive text-center pt-2">{error}</p>}
                        </CardContent>
                        <CardFooter className="flex-col gap-2">
                            <Button type="submit" className="w-full" disabled={isLoading || !password}>
                                {isLoading ? 'Unlocking...' : 'Unlock'}
                            </Button>
                            <Button variant="link" size="sm" type="button" asChild>
                                <Link href="/auth/forgot-password">Forgot Password?</Link>
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </div>
    );
}
