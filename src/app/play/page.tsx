
'use client'

import React, { useState, useEffect } from 'react';
import Header from '@/components/play/header';
import ChallengeList from '@/components/play/challenge-list';
import BattleList from '@/components/play/battle-list';
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


export default function PlayPage() {
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
        // Listen to challenges to enforce the 3-challenge limit
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
        description: 'Your account is suspended. You cannot create challenges.',
        variant: 'destructive',
      });
      return;
    }
    
    if (myChallenges.length >= 3) {
      toast({
        title: 'Challenge Limit Reached',
        description: 'You can only have 3 active challenges at a time.',
        variant: 'destructive',
      });
      return;
    }

    const numericAmount = Number(amount);
    const totalBalance = (appUser.wallet.balance || 0) + (appUser.wallet.winnings || 0);
    
    if (!amount || isNaN(numericAmount) || numericAmount <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid amount to set a challenge.',
        variant: 'destructive',
      });
      return;
    }
      
    if (totalBalance < numericAmount) {
      toast({
        title: 'Insufficient Balance',
        description: `You need ₹${numericAmount} to create this challenge, but you only have ₹${totalBalance.toFixed(2)}.`,
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
        // First, deduct the amount from user's wallet
        await updateUserWallet(user.uid, -numericAmount, 'balance', 'Challenge Created');

        // Then, create the challenge
        await createChallenge({
            amount: numericAmount,
            createdBy: {
                uid: user.uid,
                displayName: appUser.displayName || '',
                photoURL: appUser.photoURL || '',
            },
            message: message || `Play a game for ₹${numericAmount}!`,
        });

        toast({
            title: 'Challenge Created!',
            description: `Your challenge for ₹${numericAmount} has been set.`,
        });
        setAmount('');
        setMessage('');
    } catch(error: any) {
        // If challenge creation fails for any reason, refund the user.
        try {
            await updateUserWallet(user.uid, numericAmount, 'balance', 'refund', 'Challenge Creation Failed');
        } catch (refundError: any) {
             toast({
                title: 'Critical Error!',
                description: `Failed to create challenge AND failed to refund your balance. Please contact support immediately. Error: ${refundError.message}`,
                variant: 'destructive',
                duration: 10000,
            });
             setIsSubmitting(false);
            return;
        }

        toast({
            title: 'Error Creating Challenge',
            description: `Something went wrong: ${error.message}. Your balance has been refunded.`,
            variant: 'destructive',
        });
    } finally {
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
        <div className="space-y-4">
            <div>
              <Label htmlFor="amount">Amount</Label>
              <Input 
                id="amount"
                type="number" 
                placeholder="Enter amount" 
                className="bg-card dark:bg-gray-800" 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <div>
                <Label htmlFor="message">Challenge Message (Optional)</Label>
                <Input 
                    id="message"
                    type="text" 
                    placeholder="e.g., Koi hai takkar ka?" 
                    className="bg-card dark:bg-gray-800" 
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    disabled={isSubmitting}
                    maxLength={50}
                />
            </div>
          <Button className="w-full bg-primary text-primary-foreground" onClick={handleSetChallenge} disabled={isSubmitting}>
            {isSubmitting ? <Loader className="animate-spin" /> : 'Set Challenge'}
          </Button>
        </div>
        
        <section>
           <div className="flex items-center justify-center my-4">
            <hr className="w-full border-gray-300 dark:border-gray-700" />
            <span className="mx-4 text-red-600 font-semibold whitespace-nowrap">
              🏆 Open Challenges 🏆
            </span>
            <hr className="w-full border-gray-300 dark:border-gray-700" />
          </div>
          <ChallengeList />
        </section>

        <section>
           <div className="flex items-center justify-center my-4">
            <hr className="w-full border-gray-300 dark:border-gray-700" />
            <span className="mx-4 text-red-600 font-semibold whitespace-nowrap">
              ⚔️ Ongoing Battles ⚔️
            </span>
            <hr className="w-full border-gray-300 dark:border-gray-700" />
          </div>
          <BattleList />
        </section>
      </main>
      <div className="fixed bottom-6 right-6">
        <Button size="icon" className="rounded-full bg-green-500 hover:bg-green-600 w-14 h-14">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-message-circle h-8 w-8 text-white"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>
        </Button>
      </div>
    </div>
    </>
  );
}
