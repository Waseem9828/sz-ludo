
'use client';

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useEffect, useState } from "react";
import { Game, listenForGames, acceptChallenge, deleteChallenge } from "@/lib/firebase/games";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { updateUserWallet } from "@/lib/firebase/users";
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
            toast({ title: 'Login Required', description: 'You must be logged in to accept a battle.', variant: 'destructive' });
            router.push('/login');
            return;
        }
        
        const ongoingGamesCount = await listenForGames((games) => games.filter(g => g.player1.uid === user.uid || g.player2?.uid === user.uid).length, 'ongoing');
        if (ongoingGamesCount > 0) {
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
            await updateUserWallet(user.uid, -challenge.amount, 'balance', 'Challenge Accepted');
            
            await acceptChallenge(challenge.id, {
                uid: user.uid,
                displayName: appUser.displayName || '',
                photoURL: appUser.photoURL || '',
                isKycVerified: appUser.kycStatus === 'Verified',
            });

            toast({ title: 'Battle Accepted!', description: `You are now in a battle for ₹${challenge.amount}.` });
            router.push(`/play/game?id=${challenge.id}`);
        } catch (error: any) {
            await updateUserWallet(user.uid, challenge.amount, 'balance', 'refund', 'Accept Battle Failed');
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
        <div className="space-y-4">
        {challenges.map((challenge) => (
            <motion.div 
                key={challenge.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, ease: "easeOut" }}
            >
                <Card className="bg-card shadow-sm">
                    <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Avatar className="h-10 w-10">
                                    <AvatarImage src={challenge.createdBy.photoURL || undefined} alt={challenge.createdBy.displayName || 'User'} />
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
                                <p className="text-xl text-green-600 font-bold">₹ {challenge.amount}</p>
                            </div>
                        </div>
                         {challenge.message && (
                             <div className="relative mt-3 ml-4">
                                 <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-0 h-0 border-y-8 border-y-transparent border-r-8 border-r-muted"></div>
                                 <div className="bg-muted p-2 rounded-md flex items-center gap-2">
                                     <MessageSquare className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                    <p className="text-sm text-muted-foreground italic">"{challenge.message}"</p>
                                 </div>
                             </div>
                         )}
                        <div className="mt-3">
                            {user?.uid === challenge.createdBy.uid ? (
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button size="sm" variant="destructive" className="w-full">
                                            Delete Battle
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
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
                                <Button size="sm" className="w-full" onClick={() => handleAccept(challenge)}>
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
