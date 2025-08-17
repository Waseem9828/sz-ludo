
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@/context/auth-context';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { LogIn, UserPlus, Loader } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SplashScreen } from '@/components/ui/splash-screen';

function LoginPageContent() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [loadingAction, setLoadingAction] = useState<null | 'login' | 'signup'>(null);
  
  const { signUp, signIn, user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    const refCodeFromUrl = searchParams.get('ref');
    if (refCodeFromUrl) {
      setReferralCode(refCodeFromUrl);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!loading && user) {
      router.replace('/');
    }
  }, [user, loading, router]);


  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({
        title: 'Error',
        description: 'Passwords do not match.',
        variant: 'destructive',
      });
      return;
    }
    setLoadingAction('signup');
    try {
      await signUp(email, password, name, phone, referralCode || undefined);
      toast({
        title: 'Success',
        description: 'Account created successfully! Welcome!',
      });
      // The useEffect will handle the redirect
    } catch (error: any) {
      toast({
        title: 'Error Signing Up',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoadingAction(null);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingAction('login');
    try {
      await signIn(email, password);
       toast({
        title: 'Success',
        description: 'Signed in successfully!',
      });
       // The useEffect will handle the redirect
    } catch (error: any) {
      toast({
        title: 'Error Signing In',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoadingAction(null);
    }
  };

  if (loading || user) {
    return <SplashScreen />;
  }

  return (
    <div className="flex justify-center min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50 dark:from-gray-900 dark:via-black dark:to-gray-900 p-4 pt-8 md:pt-4 md:items-center">
       <div className="w-full max-w-md">
           <div className="flex justify-center items-center mb-6 gap-3">
            <Link href="/" className="flex items-center gap-3">
              <Image src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEg2oNx0s_EsUtQCxkYGCkEqHAcVCA4PAgVdyNX-mDF_KO228qsfmqMAOefbIFmb-yD98WpX7jVLor2AJzeDhfqG6wC8n7lWtxU9euuYIYhPWStqYgbGjkGp6gu1JrfKmXMwCn7I_KjLGu_GlGy3PMNmf9ljC8Yr__ZpsiGxHJRKbtH6MfTuG4ofViNRsAY/s1600/73555.png" alt="SZ Ludo Logo" width={50} height={50} />
              <h1 className="text-4xl font-headline font-black text-primary animate-shine">SZ Ludo</h1>
            </Link>
          </div>

        <Card className="shadow-2xl shadow-primary/10 dark:shadow-primary/20">
            <CardContent className="p-2">
                <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-primary/10 rounded-lg p-1">
                    <TabsTrigger value="login" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md">
                         <LogIn className="mr-2" /> Login
                    </TabsTrigger>
                    <TabsTrigger value="signup" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md">
                         <UserPlus className="mr-2" /> Sign Up
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="login">
                    <div className="p-4">
                        <form onSubmit={handleSignIn} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="login-email">Email Address</Label>
                            <Input id="login-email" type="email" placeholder="you@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} disabled={loadingAction !== null}/>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="login-password">Password</Label>
                            <Input id="login-password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} disabled={loadingAction !== null}/>
                        </div>
                        <Button type="submit" className="w-full font-bold py-3 text-lg" disabled={loadingAction !== null}>
                            {loadingAction === 'login' ? <><Loader className="animate-spin mr-2"/> Logging in...</> : 'Login'}
                        </Button>
                        </form>
                    </div>
                </TabsContent>
                <TabsContent value="signup">
                    <ScrollArea className="h-[60vh] md:h-auto">
                        <div className="p-4">
                            <form onSubmit={handleSignUp} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="signup-name">Full Name</Label>
                                    <Input id="signup-name" type="text" placeholder="John Doe" required value={name} onChange={(e) => setName(e.target.value)} disabled={loadingAction !== null}/>
                                </div>
                                 <div className="space-y-2">
                                    <Label htmlFor="signup-email">Email Address</Label>
                                    <Input id="signup-email" type="email" placeholder="you@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} disabled={loadingAction !== null}/>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="signup-phone">Enter WhatsApp Number</Label>
                                    <Input id="signup-phone" type="tel" placeholder="e.g. 9123456789" required value={phone} onChange={(e) => setPhone(e.target.value)} disabled={loadingAction !== null}/>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="signup-password">Password</Label>
                                    <Input id="signup-password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} disabled={loadingAction !== null}/>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="confirm-password">Confirm Password</Label>
                                    <Input id="confirm-password" type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} disabled={loadingAction !== null}/>
                                </div>
                                 <div className="space-y-2">
                                    <Label htmlFor="referral-code">Referral Code (Optional)</Label>
                                    <Input id="referral-code" type="text" placeholder="Enter referral code" value={referralCode} onChange={(e) => setReferralCode(e.target.value)} disabled={loadingAction !== null}/>
                                </div>
                                <Button type="submit" className="w-full font-bold py-3 text-lg" disabled={loadingAction !== null}>
                                     {loadingAction === 'signup' ? <><Loader className="animate-spin mr-2"/> Signing up...</> : 'Create Account'}
                                </Button>
                            </form>
                        </div>
                    </ScrollArea>
                </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<SplashScreen />}>
      <LoginPageContent />
    </Suspense>
  )
}
