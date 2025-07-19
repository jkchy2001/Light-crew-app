
'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Clapperboard, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { auth, db } from '@/lib/firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from "firebase/firestore";
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { TermsDialog } from '@/components/auth/terms-dialog';
import { PrivacyDialog } from '@/components/auth/privacy-dialog';

export default function SignupPage() {
    const { toast } = useToast();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [mobile, setMobile] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [agreed, setAgreed] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);


    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!agreed) {
          toast({
            variant: 'destructive',
            title: 'Agreement Required',
            description: 'You must agree to the Terms and Conditions and Privacy Policy to create an account.',
          });
          return;
        }

        if (password !== confirmPassword) {
            toast({
              variant: 'destructive',
              title: 'Passwords Do Not Match',
              description: 'Please ensure both password fields are identical.',
            });
            return;
        }

        setIsLoading(true);
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            if (user) {
                // Update Firebase Auth profile
                await updateProfile(user, { 
                    displayName: name,
                });
                // Create a document in Firestore 'users' collection
                await setDoc(doc(db, "users", user.uid), {
                    name: name,
                    email: user.email,
                    mobile: mobile,
                });
            }
            // The AuthProvider will handle the redirection automatically.
        } catch (error: any)
        {
            console.error('Signup error:', error);
            toast({
                variant: 'destructive',
                title: 'Signup Failed',
                description: error.message || 'An unexpected error occurred.',
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-4">
            <div className="w-full max-w-md space-y-4">
                <div className="flex flex-col items-center justify-center gap-2 mb-6">
                    <Clapperboard className="w-10 h-10 text-primary" />
                    <h1 className="text-2xl font-bold">Light Crew</h1>
                </div>
                <Card className="glass-card">
                    <CardHeader>
                        <CardTitle>Create an Account</CardTitle>
                        <CardDescription>Join the future of crew management.</CardDescription>
                    </CardHeader>
                    <form onSubmit={handleSubmit}>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Full Name</Label>
                                <Input 
                                    id="name" 
                                    type="text" 
                                    placeholder="Enter your full name" 
                                    required 
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    disabled={isLoading}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input 
                                    id="email" 
                                    type="email" 
                                    placeholder="Enter your email" 
                                    required 
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={isLoading}
                                />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="mobile">Mobile Number</Label>
                                <Input 
                                    id="mobile" 
                                    type="tel" 
                                    placeholder="Enter your mobile number" 
                                    required 
                                    value={mobile}
                                    onChange={(e) => setMobile(e.target.value)}
                                    disabled={isLoading}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <div className="relative">
                                  <Input 
                                      id="password" 
                                      type={showPassword ? "text" : "password"}
                                      placeholder="Create a strong password" 
                                      required 
                                      value={password}
                                      onChange={(e) => setPassword(e.target.value)}
                                      disabled={isLoading}
                                      className="pr-10"
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute inset-y-0 right-0 h-full w-10 text-muted-foreground"
                                    onClick={() => setShowPassword(!showPassword)}
                                    disabled={isLoading}
                                  >
                                    {showPassword ? <EyeOff /> : <Eye />}
                                  </Button>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirm-password">Confirm Password</Label>
                                <div className="relative">
                                  <Input 
                                      id="confirm-password" 
                                      type={showConfirmPassword ? "text" : "password"}
                                      placeholder="Re-enter your password" 
                                      required 
                                      value={confirmPassword}
                                      onChange={(e) => setConfirmPassword(e.target.value)}
                                      disabled={isLoading}
                                      className="pr-10"
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute inset-y-0 right-0 h-full w-10 text-muted-foreground"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    disabled={isLoading}
                                  >
                                    {showConfirmPassword ? <EyeOff /> : <Eye />}
                                  </Button>
                                </div>
                            </div>
                            <div className="flex items-start space-x-2 pt-2">
                                <Checkbox 
                                id="terms-signup" 
                                checked={agreed} 
                                onCheckedChange={(checked) => setAgreed(Boolean(checked))}
                                disabled={isLoading}
                                />
                                <div className="grid gap-1.5 leading-none">
                                <label
                                    htmlFor="terms-signup"
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                    I agree to the <TermsDialog /> & <PrivacyDialog />.
                                </label>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="flex-col gap-4">
                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? 'Initializing...' : 'Create Account'}
                            </Button>
                            <div className="text-center text-sm">
                                Already have an account?{' '}
                                <Link href="/auth/login" className="font-semibold text-primary hover:underline">
                                    Login
                                </Link>
                            </div>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </div>
    );
}
