
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
import { CreateChallengeDialog } from '@/components/play/create-challenge-dialog';


export default function PlayPage() {
  const [amount, setAmount] = useState('');
  const [challengeAmount, setChallengeAmount] = useState(0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);


  const handleSetChallenge = () => {
    const numericAmount = Number(amount);
    if (amount && !isNaN(numericAmount) && numericAmount > 0) {
      setChallengeAmount(numericAmount);
      setIsDialogOpen(true);
    } else {
       toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid amount to set a challenge.',
        variant: 'destructive',
      });
    }
  };

  const handleChallengeCreated = () => {
    toast({
        title: 'Challenge Created!',
        description: `Your challenge for ₹${challengeAmount} has been set.`,
    });
    setAmount('');
    setChallengeAmount(0);
  }

   if (loading || !user) {
    return (
        <div className="flex justify-center items-center min-h-screen">
            <Loader className="h-16 w-16 animate-spin" />
        </div>
    );
  }


  return (
    <>
    <CreateChallengeDialog
        isOpen={isDialogOpen}
        setIsOpen={setIsDialogOpen}
        amount={challengeAmount}
        onChallengeCreated={handleChallengeCreated}
    />
    <div className="flex flex-col min-h-screen bg-background text-foreground font-body">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-6 space-y-8">
        <div className="flex items-center gap-2">
          <Input 
            type="number" 
            placeholder="Amount" 
            className="bg-card dark:bg-gray-800" 
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <Button className="bg-primary text-primary-foreground" onClick={handleSetChallenge}>Set</Button>
        </div>
        
        <section>
           <div className="flex items-center justify-center my-4">
            <hr className="w-full border-gray-300 dark:border-gray-700" />
            <span className="mx-4 text-red-600 font-semibold whitespace-nowrap">
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
    </>
  );
}
