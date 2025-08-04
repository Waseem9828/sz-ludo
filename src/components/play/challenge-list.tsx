

'use client';

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Game, listenForGames, acceptChallenge } from "@/lib/firebase/games";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { updateUserWallet } from "@/lib/firebase/users";

export default function ChallengeList() {
    const [challenges, setChallenges] = useState<Game[]>([]);
    const { user, appUser } = useAuth();
    const { toast } = useToast();
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = listenForGames(setChallenges, 'challenge');
        return () => unsubscribe();
    }, []);

    const handleAccept = async (challenge: Game) => {
        if (!user || !appUser) {
            toast({ title: 'Login Required', description: 'You must be logged in to accept a challenge.', variant: 'destructive' });
            return;
        }

        if (appUser.status === 'suspended') {
            toast({
                title: 'Account Suspended',
                description: 'Your account is suspended. You cannot accept challenges.',
                variant: 'destructive',
            });
            return;
        }

        if (user.uid === challenge.createdBy.uid) {
            toast({ title: 'Cannot Accept Own Challenge', description: 'You cannot accept your own challenge.', variant: 'destructive' });
            return;
        }

        const totalBalance = (appUser.wallet?.balance || 0) + (appUser.wallet?.winnings || 0);
        if (totalBalance < challenge.amount) {
            toast({ title: 'Insufficient Balance', description: 'You do not have enough balance to accept this challenge.', variant: 'destructive' });
            return;
        }
        
        try {
            // Deduct amount from acceptor's wallet
            await updateUserWallet(user.uid, -challenge.amount, 'balance', 'Challenge Accepted');
            
            await acceptChallenge(challenge.id, {
                uid: user.uid,
                displayName: appUser.displayName || '',
                photoURL: appUser.photoURL || '',
            });

            toast({ title: 'Challenge Accepted!', description: `You are now in a battle for ₹${challenge.amount}.` });
            router.push(`/play/game?id=${challenge.id}`);
        } catch (error: any) {
             // Re-credit user if accept fails
            await updateUserWallet(user.uid, challenge.amount, 'balance', 'refund', 'Accept Challenge Failed');
            toast({ title: 'Failed to Accept', description: error.message, variant: 'destructive' });
        }
    };
    
    if (challenges.length === 0) {
        return (
            <div className="text-center text-muted-foreground py-4">
                <p>No open challenges right now.</p>
                <p className="text-xs">Why not create one?</p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
        {challenges.map((challenge) => (
            <Card key={challenge.id} className="bg-card shadow-sm">
            <CardContent className="p-3 flex items-center justify-between">
                <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">Challenge set by</span>
                    <div className="flex items-center gap-2 mt-1">
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={challenge.createdBy.photoURL || undefined} alt={challenge.createdBy.displayName || 'User'} />
                            <AvatarFallback>{challenge.createdBy.displayName?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="font-semibold">{challenge.createdBy.displayName}</span>
                    </div>
                </div>
                <div className="text-right">
                <p className="text-green-600 font-bold">₹ {challenge.amount}</p>
                <Button size="sm" className="mt-1" onClick={() => handleAccept(challenge)} disabled={user?.uid === challenge.createdBy.uid}>
                    Play
                </Button>
                </div>
            </CardContent>
            </Card>
        ))}
        </div>
    );
}
