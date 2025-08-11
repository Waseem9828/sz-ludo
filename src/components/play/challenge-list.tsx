

'use client';

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useEffect, useState, useMemo } from "react";
import { Game, listenForGames, acceptChallenge, deleteChallenge } from "@/lib/firebase/games";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { MessageSquare, ShieldCheck } from "lucide-react";
import { motion } from 'framer-motion';
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import Image from 'next/image';

const defaultAvatar = "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEi_h6LUuqTTKYsn5TfUZwkI6Aib6Y0tOzQzcoZKstURqxyl-PJXW1DKTkF2cPPNNUbP3iuDNsOBVOYx7p-ZwrodI5w9fyqEwoabj8rU0mLzSbT5GCFUKpfCc4s_LrtHcWFDvvRstCghAfQi5Zfv2fipdZG8h4dU4vGt-eFRn-gS3QTg6_JJKhv0Yysr_ZY/s1600/82126.png";


export default function ChallengeList() {
    const [challenges, setChallenges] = useState<Game[]>([]);
    const { user, appUser } = useAuth();
    const { toast } = useToast();
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = listenForGames((games) => {
            const sortedGames = games.sort((a, b) => (b.createdAt?.toDate() || 0) - (a.createdAt?.toDate() || 0));
            setChallenges(sortedGames);
        }, 'challenge');
        return () => unsubscribe();
    }, []);

    const sortedChallenges = useMemo(() => {
        if (!user) return challenges;
        
        // Then, bring user's own challenges to the top
        return [...challenges].sort((a, b) => {
            if (a.createdBy.uid === user.uid && b.createdBy.uid !== user.uid) return -1;
            if (a.createdBy.uid !== user.uid && b.createdBy.uid === user.uid) return 1;
            // Fallback to original sort order if owners are the same or neither is the user
            return 0;
        });
    }, [challenges, user]);


    const handleAccept = async (challenge: Game) => {
        if (!user || !appUser) {
            toast({ title: 'Login Required', description: 'You must be logged in to accept a battle.', variant: 'destructive' });
            router.push('/login');
            return;
        }
        
        // Check if user is already in an ongoing game
        const gamesRef = collection(db, "games");
        const q = query(
            gamesRef,
            where('status', '==', 'ongoing'),
            where('playerUids', 'array-contains', user.uid)
        );
        const ongoingGamesSnapshot = await getDocs(q);

        if (!ongoingGamesSnapshot.empty) {
            toast({ title: 'Battle Limit Reached', description: 'You can only be in one ongoing battle at a time.', variant: 'destructive' });
            return;
        }

        if (appUser.status === 'suspended') {
            toast({
                title: 'Account Suspended',
                description: 'Your account is suspended. You cannot accept open battles.',
                variant: 'destructive',
            });
            return;
        }

        if (user.uid === challenge.createdBy.uid) {
            toast({ title: 'Cannot Accept Own Battle', description: 'You cannot accept your own open battle.', variant: 'destructive' });
            return;
        }

        const totalBalance = (appUser.wallet?.balance || 0) + (appUser.wallet?.winnings || 0);
        if (totalBalance < challenge.amount) {
            toast({ title: 'Insufficient Balance', description: 'You do not have enough balance to accept this battle.', variant: 'destructive' });
            return;
        }
        
        try {
            const gameId = await acceptChallenge(challenge.id, {
                uid: user.uid,
                displayName: appUser.displayName || '',
                photoURL: appUser.photoURL || '',
                isKycVerified: appUser.kycStatus === 'Verified',
            });

            toast({ title: 'Battle Accepted!', description: `You are now in a battle for ${challenge.amount}.` });
            router.push(`/play/game?id=${gameId}`);
        } catch (error: any) {
            toast({ title: 'Failed to Accept', description: error.message, variant: 'destructive' });
        }
    };
    
    const handleDelete = async (challenge: Game) => {
        if (!user || user.uid !== challenge.createdBy.uid) {
             toast({ title: 'Not Authorized', description: 'You can only delete your own open battles.', variant: 'destructive' });
            return;
        }
        try {
            await deleteChallenge(challenge.id);
             toast({ title: 'Battle Deleted', description: 'Your open battle has been successfully removed.' });
        } catch (error: any) {
             toast({ title: 'Error', description: `Failed to delete open battle: ${error.message}`, variant: 'destructive' });
        }
    }
    
    if (challenges.length === 0) {
        return (
            <div className="text-center text-muted-foreground py-4">
                <p>No open battles right now.</p>
                <p className="text-xs">Why not create one?</p>
            </div>
        )
    }

    return (
        <div className="space-y-8">
        {sortedChallenges.map((challenge) => (
            <motion.div
                key={challenge.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="relative"
            >
                {challenge.message && (
                     <div className="speech-bubble mb-2">
                        <p className="text-sm md:text-base text-muted-foreground italic">"{challenge.message}"</p>
                    </div>
                 )}
                <Card className="bg-card shadow-sm cursor-pointer"
                    onClick={() => {
                        if (user?.uid === challenge.createdBy.uid) {
                            router.push(`/play/game?id=${challenge.id}`);
                        }
                    }}>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Avatar className="h-10 w-10 border-2 border-primary">
                                    <AvatarImage src={challenge.createdBy.photoURL || defaultAvatar} alt={challenge.createdBy.displayName || 'User'} data-ai-hint="avatar person" />
                                    <AvatarFallback>{challenge.createdBy.displayName?.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                     <div className="flex items-center gap-1">
                                        <span className="font-semibold">{challenge.createdBy.displayName}</span>
                                        {challenge.createdBy.isKycVerified && <ShieldCheck className="h-4 w-4 text-blue-500" />}
                                     </div>
                                     <p className="text-xs text-muted-foreground">has created an open battle</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-xl text-red-600 font-bold flex items-center gap-1">
                                    <Image src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEj01a-tA55LItcrvtalUaOwdFji0EZjLW15nqZKCiNP4b6T_v7b79g7eUrg3YAsYW5i-FfbZDEONDIv-jXI_wJcwFZCbVWRuyW1hBUdPHlJ6u8SpjD_-ZveIEuDAFSTsB_7OfvxveJyyqKoyf6AsLtPZwEF2lryvPHsqXQB5MNMBGYGfEc0F0wmq9r5CmA/s1600/84440.png" alt="coin" width={20} height={20} data-ai-hint="gold coin"/>
                                    {challenge.amount}
                                </p>
                            </div>
                        </div>
                        
                        <div className="mt-4">
                            {user?.uid === challenge.createdBy.uid ? (
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button size="sm" variant="destructive" className="w-full" onClick={(e) => e.stopPropagation()}>
                                            Delete Battle
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                                        <AlertDialogHeader>
                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This will permanently delete your open battle and refund the amount to your wallet.
                                        </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDelete(challenge)}>Yes, Delete</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            ) : (
                                <Button size="sm" className="w-full" onClick={(e) => { e.stopPropagation(); handleAccept(challenge); }}>
                                    Accept Battle
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        ))}
        </div>
    );
}
