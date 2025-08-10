'use client'

import React, { useState, useEffect } from 'react';
import Header from '@/components/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { SplashScreen } from '@/components/ui/splash-screen';
import { createChallenge, Game, listenForGames } from '@/lib/firebase/games';
import { updateUserWallet } from '@/lib/firebase/users';
import { Loader } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

export default function CreateChallengePage() {
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user, appUser, loading } = useAuth();
  const router = useRouter();
  const [myChallenges, setMyChallenges] = useState<Game[]>([]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
    
    if (user) {
        const unsubscribe = listenForGames((challenges) => {
            const userChallenges = challenges.filter(c => c.createdBy.uid === user.uid);
            setMyChallenges(userChallenges);
        }, 'challenge');
        return () => unsubscribe();
    }
  }, [user, loading, router]);


  const handleSetChallenge = async () => {
    if (!appUser || !appUser.wallet || !user) return;

    if (appUser.status === 'suspended') {
      toast({
        title: 'Account Suspended',
        description: 'Your account is suspended. You cannot create battles.',
        variant: 'destructive',
      });
      return;
    }
    
    if (myChallenges.length >= 3) {
      toast({
        title: 'Battle Limit Reached',
        description: 'You can only have 3 active open battles at a time.',
        variant: 'destructive',
      });
      return;
    }

    const numericAmount = Number(amount);
    const totalBalance = (appUser.wallet.balance || 0) + (appUser.wallet.winnings || 0);
    
    if (!amount || isNaN(numericAmount) || numericAmount < 50) {
      toast({
        title: 'Invalid Amount',
        description: 'Minimum battle amount is ₹50.',
        variant: 'destructive',
      });
      return;
    }
      
    if (totalBalance < numericAmount) {
      toast({
        title: 'Insufficient Balance',
        description: `You need ₹${numericAmount} to create this battle, but you only have ₹${totalBalance.toFixed(2)}.`,
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    let newChallengeId = '';
    try {
        await updateUserWallet(user.uid, -numericAmount, 'balance', 'Challenge Created');

        const newChallengeRef = await createChallenge({
            amount: numericAmount,
            createdBy: {
                uid: user.uid,
                displayName: appUser.displayName || '',
                photoURL: appUser.photoURL || '',
                isKycVerified: appUser.kycStatus === 'Verified',
            },
            message: message || `Play a game for ₹${numericAmount}!`,
        });
        
        newChallengeId = newChallengeRef.id;

        toast({
            title: 'Battle Created!',
            description: `Your open battle for ₹${numericAmount} has been set.`,
        });
        
        router.push(`/play/game?id=${newChallengeId}`);

    } catch(error: any) {
        // If the challenge creation failed but wallet was deducted, refund the user.
        await updateUserWallet(user.uid, numericAmount, 'balance', 'refund', `Battle Creation Failed: ${newChallengeId || ''}`);

        toast({
            title: 'Error Creating Battle',
            description: `Something went wrong: ${error.message}. Your balance has been refunded.`,
            variant: 'destructive',
        });
        
        setIsSubmitting(false);
    }
  };

   if (loading || !user) {
    return <SplashScreen />;
  }


  return (
    <>
    <div className="flex flex-col min-h-screen bg-background text-foreground font-body">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-6 space-y-8">
        <Link href="/play">
            <Button variant="outline">
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back to Lobby
            </Button>
        </Link>
        <Card className="max-w-md mx-auto">
            <CardHeader>
                <CardTitle className="text-center text-xl font-semibold text-primary">Create a New Battle</CardTitle>
                <CardDescription className="text-center">Set an amount and create an open battle for the community!</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div>
                    <Label htmlFor="amount">Amount</Label>
                    <Input 
                        id="amount"
                        type="number" 
                        placeholder="Enter amount" 
                        className="bg-card dark:bg-muted" 
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        disabled={isSubmitting}
                    />
                    </div>
                    <div>
                        <Label htmlFor="message">Custom Message (Optional)</Label>
                        <Input 
                            id="message"
                            type="text" 
                            placeholder="e.g., Koi hai takkar ka?" 
                            className="bg-card dark:bg-muted" 
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            disabled={isSubmitting}
                            maxLength={50}
                        />
                    </div>
                    <Button className="w-full bg-primary text-primary-foreground font-bold text-lg py-6" onClick={handleSetChallenge} disabled={isSubmitting}>
                        {isSubmitting ? <Loader className="animate-spin" /> : 'Set Battle'}
                    </Button>
                </div>
            </CardContent>
        </Card>
      </main>
    </div>
    </>
  );
}
