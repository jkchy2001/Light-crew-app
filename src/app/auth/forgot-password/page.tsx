
'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Clapperboard, Mail } from 'lucide-react';
import Link from 'next/link';
import { auth } from '@/lib/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setSubmitted(true);
    } catch (error: any) {
      console.error('Password reset error:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Could not send password reset email.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-4">
        <div className="flex flex-col items-center justify-center gap-2 mb-6">
            <Clapperboard className="w-10 h-10 text-primary" />
            <h1 className="text-2xl font-bold">Light Crew</h1>
        </div>
        {submitted ? (
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Check your email</CardTitle>
                <CardDescription>We've sent a password reset link to your email address.</CardDescription>
              </CardHeader>
              <CardContent>
                 <div className="flex justify-center p-6 bg-muted/50 rounded-lg">
                    <Mail className="w-16 h-16 text-primary" />
                 </div>
              </CardContent>
              <CardFooter className="flex-col gap-4">
                <p className="text-sm text-muted-foreground text-center">
                    Didn't receive the email? Check your spam folder or try again.
                </p>
                <Button asChild className="w-full">
                  <Link href="/auth/login">Back to Login</Link>
                </Button>
              </CardFooter>
            </Card>
        ) : (
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Forgot Password?</CardTitle>
              <CardDescription>No worries, we'll send you reset instructions.</CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
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
              </CardContent>
              <CardFooter className="flex-col gap-4">
                <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Sending...' : 'Send Reset Link'}
                </Button>
                <Button variant="link" asChild>
                  <Link href="/auth/login">Back to Login</Link>
                </Button>
              </CardFooter>
            </form>
          </Card>
        )}
      </div>
    </div>
  );
}
