
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
import { Chrome, LogIn, UserPlus, Loader } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

function LoginPageContent() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loadingAction, setLoadingAction] = useState<null | 'login' | 'signup' | 'google'>(null);
  
  const { signUp, signIn, signInWithGoogle, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const refCode = searchParams.get('ref');
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      router.push('/');
    }
  }, [user, router]);


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
      await signUp(email, password, name, phone, refCode || undefined);
      router.push('/');
      toast({
        title: 'Success',
        description: 'Account created successfully!',
      });
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
      router.push('/');
       toast({
        title: 'Success',
        description: 'Signed in successfully!',
      });
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

  const handleGoogleSignIn = async () => {
    setLoadingAction('google');
    try {
      await signInWithGoogle(refCode || undefined);
      router.push('/');
      toast({
        title: 'Success',
        description: 'Signed in with Google successfully!',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Could not sign in with Google.',
        variant: 'destructive',
      });
    } finally {
      setLoadingAction(null);
    }
  };

  if (user) {
    return null; // or a loading spinner, to prevent rendering the login form while redirecting
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50 dark:from-gray-900 dark:via-black dark:to-gray-900 p-4">
       <div className="w-full max-w-md">
           <div className="flex justify-center items-center mb-6 gap-3">
            <Link href="/" className="flex items-center gap-3">
              <Image src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEg2oNx0s_EsUtQCxkYGCkEqHAcVCA4PAgVdyNX-mDF_KO228qsfmqMAOefbIFmb-yD98WpX7jVLor2AJzeDhfqG6wC8n7lWtxU9euuYIYhPWStqYgbGjkGp6gu1JrfKmXMwCn7I_KjLGu_GlGy3PMNmf9ljC8Yr__ZpsiGxHJRKbtH6MfTuG4ofViNRsAY/s1600/73555.png" alt="SZ LUDO Logo" width={50} height={50} />
              <h1 className="text-4xl font-headline font-bold text-red-600">SZ LUDO</h1>
            </Link>
          </div>

        <Card className="shadow-2xl shadow-red-500/10 dark:shadow-red-500/20">
            <CardContent className="p-2">
                <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-red-100 dark:bg-red-900/50 rounded-lg p-1">
                    <TabsTrigger value="login" className="data-[state=active]:bg-red-600 data-[state=active]:text-white rounded-md">
                         <LogIn className="mr-2" /> Login
                    </TabsTrigger>
                    <TabsTrigger value="signup" className="data-[state=active]:bg-red-600 data-[state=active]:text-white rounded-md">
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
                        <Button type="submit" className="w-full font-bold py-3 text-lg bg-red-600 hover:bg-red-700" disabled={loadingAction !== null}>
                            {loadingAction === 'login' ? <Loader className="animate-spin"/> : 'Login'}
                        </Button>
                        </form>
                        <div className="relative my-4">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-red-200 dark:border-red-900" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-white dark:bg-card px-2 text-muted-foreground">Or</span>
                        </div>
                        </div>
                        <Button variant="outline" onClick={handleGoogleSignIn} className="w-full" disabled={loadingAction !== null}>
                             {loadingAction === 'google' ? <Loader className="animate-spin"/> : <> <Chrome className="mr-2 h-4 w-4"/>Sign in with Google</>}
                        </Button>
                    </div>
                </TabsContent>
                <TabsContent value="signup">
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
                                <Label htmlFor="signup-phone">Phone Number</Label>
                                <Input id="signup-phone" type="tel" placeholder="123-456-7890" required value={phone} onChange={(e) => setPhone(e.target.value)} disabled={loadingAction !== null}/>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="signup-password">Password</Label>
                                <Input id="signup-password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} disabled={loadingAction !== null}/>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirm-password">Confirm Password</Label>
                                <Input id="confirm-password" type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} disabled={loadingAction !== null}/>
                            </div>
                            <Button type="submit" className="w-full font-bold py-3 text-lg bg-red-600 hover:bg-red-700" disabled={loadingAction !== null}>
                                 {loadingAction === 'signup' ? <Loader className="animate-spin"/> : 'Create Account'}
                            </Button>
                        </form>
                    </div>
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
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <LoginPageContent />
    </Suspense>
  )
}
