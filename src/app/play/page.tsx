
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
import { Loader } from 'lucide-react';


export default function PlayPage() {
  const [amount, setAmount] = useState('');
  const { toast } = useToast();
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);


  const handleSetChallenge = () => {
    if (amount && !isNaN(Number(amount)) && Number(amount) > 0) {
      toast({
        title: 'Challenge Created!',
        description: `Your challenge for ₹${amount} has been set.`,
      });
      // Here you would typically add the challenge to a list of open challenges.
      // For now, we just show a notification.
      setAmount('');
    } else {
       toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid amount to set a challenge.',
        variant: 'destructive',
      });
    }
  };

   if (loading || !user) {
    return (
        <div className="flex justify-center items-center min-h-screen">
            <Loader className="h-16 w-16 animate-spin" />
        </div>
    );
  }


  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground font-body">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-6 space-y-8">
        <div className="flex items-center gap-2">
          <Input 
            type="number" 
            placeholder="Amount" 
            className="bg-white dark:bg-gray-800" 
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <Button className="bg-gray-800 text-white" onClick={handleSetChallenge}>Set</Button>
        </div>
        
        <section>
           <div className="flex items-center justify-center my-4">
            <hr className="w-full border-gray-300 dark:border-gray-700" />
            <span className="mx-4 text-muted-foreground font-semibold whitespace-nowrap">
              🏆 Open Battles (Classic) 🏆
            </span>
            <hr className="w-full border-gray-300 dark:border-gray-700" />
          </div>
          <ChallengeList />
        </section>

        <section>
          <BattleList />
        </section>
      </main>
      <div className="fixed bottom-6 right-6">
        <Button size="icon" className="rounded-full bg-green-500 hover:bg-green-600 w-14 h-14">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-message-circle h-8 w-8 text-white"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>
        </Button>
      </div>
    </div>
  );
}
