
'use client';

import { useState, useEffect, useMemo } from 'react';
import Header from "@/components/header";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { listenForTournaments, Tournament, joinTournament } from "@/lib/firebase/tournaments";
import { Loader, Users, Trophy, Star } from 'lucide-react';
import { format, formatDistanceToNowStrict } from 'date-fns';
import { SplashScreen } from '@/components/ui/splash-screen';
import { useAuth } from '@/context/auth-context';
import Image from 'next/image';
import { Card, CardContent } from "@/components/ui/card";
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
} from "@/components/ui/alert-dialog";
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const pointCoinImage = "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiwhVedr1V1ByzcPPUm-nlj7zY0CT7Fab4i9PDN7cj4iovWSZNHabrcsmOlwWrv2hRGgAHbBMtD6_HgNneu5DVasF1waibkgxSsnJ7hs56p5bdEECWsXuJtvMlduioy4c9cQI3UXawKt1Sib5Qr9XauGwaJ4a9Ea7tcZ0dJYA9sycViqE7ZKsvyUG8n-U4/s1600/84333.png";

const TournamentCard = ({ tournament }: { tournament: Tournament }) => {
    const { user, appUser } = useAuth();
    const { toast } = useToast();
    const [isJoining, setIsJoining] = useState(false);

    const timeLeft = useMemo(() => {
        if (tournament.status !== 'upcoming' || !tournament.startTime) return '';
        try {
            return formatDistanceToNowStrict(tournament.startTime.toDate(), { addSuffix: true });
        } catch {
            return 'Invalid date';
        }
    }, [tournament.startTime, tournament.status]);

    const isUserJoined = user ? tournament.players.includes(user.uid) : false;
    const isJoinable = tournament.status === 'upcoming' && tournament.players.length < tournament.playerCap;

    const handleJoin = async () => {
        if (!user || !appUser) {
            toast({ title: "Login Required", description: "You need to be logged in to join.", variant: "destructive" });
            return;
        }
        if (appUser.kycStatus !== 'Verified') {
            toast({ title: 'KYC Required', description: 'Please complete your KYC to join tournaments.', variant: 'destructive' });
            return;
        }
        setIsJoining(true);
        try {
            await joinTournament(tournament.id, user.uid);
            toast({ title: "Successfully Joined!", description: `You have joined the "${tournament.title}" tournament.` });
        } catch (error: any) {
            toast({ title: "Join Failed", description: error.message, variant: "destructive" });
        } finally {
            setIsJoining(false);
        }
    };

    const calculatedPrizeData = useMemo(() => {
        if (!tournament) return [];
        const prizePoolAfterCommission = tournament.prizePool * (1 - (tournament.adminCommission / 100));
        return tournament.prizeDistribution.map(dist => {
            let rank = `${dist.rankStart}`;
            if (dist.rankEnd > dist.rankStart) {
                rank = `${dist.rankStart}-${dist.rankEnd}`;
            }
            const totalWinnersInRange = Math.max(0, dist.rankEnd - dist.rankStart + 1);
            const amountPerPlayer = totalWinnersInRange > 0 ? (prizePoolAfterCommission * (dist.percentage / 100)) / totalWinnersInRange : 0;
            return {
                rank,
                amount: `₹${amountPerPlayer.toFixed(2)}`,
            };
        }).slice(0, 10);
    }, [tournament]);

    const leaderboard = tournament.leaderboard?.sort((a, b) => b.points - a.points) || [];

    return (
      <Card className="w-full max-w-[920px] bg-gradient-to-b from-[rgba(255,255,255,0.9)] to-[rgba(255,255,255,0.85)] dark:from-gray-800/80 dark:to-gray-900/80 rounded-2xl p-3.5 shadow-lg overflow-hidden">
        <div className="flex flex-col lg:flex-row gap-6 items-start">
            <div className="flex-shrink-0 w-full lg:w-[420px]">
                <div className="w-full h-[250px] rounded-xl relative overflow-hidden group">
                    <Image src="https://placehold.co/400x300.png" alt="tournament banner" fill className="object-cover transition-transform duration-700 ease-in-out group-hover:scale-105" data-ai-hint="game tournament"/>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent rounded-xl"></div>
                    <div className="absolute top-4 left-4">
                        <Badge variant="destructive" className="capitalize text-sm shadow-lg">{tournament.status}</Badge>
                    </div>
                     <div className="absolute bottom-4 left-0 right-0 px-4">
                        <h2 className="text-2xl font-extrabold text-white m-0 drop-shadow-md">{tournament.title}</h2>
                        <p className="m-0 text-white/90 text-sm drop-shadow-sm">
                            Starts {tournament.status === 'upcoming' && timeLeft ? timeLeft : `on ${format(tournament.startTime.toDate(), 'PP')}`}
                        </p>
                    </div>
                </div>
                 <div className="grid grid-cols-3 gap-2.5 mt-3">
                    {[
                        { label: 'Prize Pool', value: `₹${tournament.prizePool.toFixed(0)}` },
                        { label: 'Join Fee', value: `₹${tournament.entryFee}` },
                        { label: 'Slots', value: `${tournament.players.length}/${tournament.playerCap}` },
                    ].map(item => (
                        <div key={item.label} className="bg-white/10 dark:bg-black/20 p-2 rounded-lg text-center text-gray-900 dark:text-white">
                        <strong className="block text-base">
                            {item.value}
                        </strong>
                        <small className="block text-xs text-gray-700 dark:text-gray-400">{item.label}</small>
                        </div>
                    ))}
                    </div>
                     <div className="mt-3">
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                            <Button className="w-full h-auto py-3 rounded-xl bg-gradient-to-r from-red-500 to-red-600 border-none text-white font-extrabold shadow-lg animate-glowPulse hover:shadow-xl disabled:opacity-70" disabled={!isJoinable || isJoining}>
                                {isJoining ? <Loader className="animate-spin" /> : isUserJoined ? '✅ Joined' : 'Join Now'}
                            </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Confirm to Join "{tournament.title}"?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        An entry fee of <span className='font-bold'>₹{tournament.entryFee}</span> will be deducted from your wallet balance. This action cannot be undone.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleJoin}>Confirm & Join</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
            </div>

            <div className="flex-1 w-full">
                <Tabs defaultValue="leaderboard" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
                        <TabsTrigger value="prizes">Prizes</TabsTrigger>
                    </TabsList>
                    <TabsContent value="leaderboard">
                         <div className="grid gap-2 mt-2">
                            {leaderboard.length > 0 ? leaderboard.map((player, index) => {
                            const rankClass = 
                                index === 0 ? "bg-gradient-to-r from-amber-400 to-orange-500 shadow-md shadow-amber-500/20" :
                                index === 1 ? "bg-gradient-to-r from-slate-300 to-slate-400 text-slate-800 shadow-md shadow-slate-500/20" :
                                index === 2 ? "bg-gradient-to-r from-orange-300 to-yellow-300 text-orange-900 shadow-md shadow-orange-500/20" :
                                "bg-transparent border-2 border-red-500/10";
                            return (
                            <div key={index} className="flex items-center gap-3 p-2.5 rounded-xl bg-gradient-to-b from-white/90 to-white/80 dark:from-gray-800/90 dark:to-gray-800/80 shadow-md transition-transform duration-200 ease-in-out hover:-translate-y-1">
                                <div className={cn("w-10 h-10 rounded-full grid place-items-center font-extrabold text-white flex-shrink-0", rankClass)}>
                                    {index + 1}
                                </div>
                                <Avatar className="h-10 w-10 border-2 border-white">
                                    <AvatarImage src={player.photoURL || undefined} alt={player.displayName} />
                                    <AvatarFallback>{player.displayName?.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <div className="font-bold text-gray-800 dark:text-gray-200">{player.displayName}</div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Image src={pointCoinImage} alt="Points" width={24} height={24} data-ai-hint="gold coin"/>
                                    <div className="font-black text-lg text-red-700 dark:text-red-400">{player.points}</div>
                                </div>
                            </div>
                            );
                            }) : (
                                <p className="text-center text-muted-foreground py-4">No players on the leaderboard yet.</p>
                            )}
                        </div>
                    </TabsContent>
                    <TabsContent value="prizes">
                        <div className="grid gap-2 mt-2">
                            {calculatedPrizeData.map((item, index) => {
                            const rankClass = 
                                index === 0 ? "bg-gradient-to-r from-amber-400 to-orange-500 shadow-md shadow-amber-500/20" :
                                index === 1 ? "bg-gradient-to-r from-slate-300 to-slate-400 text-slate-800 shadow-md shadow-slate-500/20" :
                                index === 2 ? "bg-gradient-to-r from-orange-300 to-yellow-300 text-orange-900 shadow-md shadow-orange-500/20" :
                                "bg-transparent border-2 border-red-500/10 text-red-700 dark:text-red-300";
                            return (
                            <div key={index} className="flex items-center gap-3 p-2.5 rounded-xl bg-gradient-to-b from-white/90 to-white/80 dark:from-gray-800/90 dark:to-gray-800/80 shadow-md transition-transform duration-200 ease-in-out hover:-translate-y-1">
                                <div className={cn("w-12 h-12 rounded-full grid place-items-center font-extrabold text-white flex-shrink-0", rankClass)}>
                                {item.rank}
                                </div>
                                <div className="flex-1">
                                    <div className="font-bold text-gray-800 dark:text-gray-200">Rank {item.rank} Prize</div>
                                </div>
                                <div className="font-black text-lg text-red-700 dark:text-red-400">
                                    {item.amount}
                                </div>
                            </div>
                            );
                            })}
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
      </Card>
    );
};

export default function TournamentsPage() {
    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        const unsubscribe = listenForTournaments(
            (data) => {
                setTournaments(data.filter(t => t.status === 'upcoming' || t.status === 'live'));
                setLoading(false);
            },
            (error) => {
                toast({ title: "Error", description: `Could not fetch tournaments: ${error.message}`, variant: "destructive" });
                setLoading(false);
            },
            ['upcoming', 'live']
        );
        return () => unsubscribe();
    }, [toast]);

    if (loading) {
        return <SplashScreen />;
    }

    return (
        <div className="flex flex-col min-h-screen bg-gradient-to-b from-white to-red-100/50 dark:from-gray-900 dark:to-red-900/20 font-body">
            <Header />
            <main className="flex-grow container mx-auto px-4 py-6 space-y-8">
                <div className="text-center">
                    <h1 className="text-4xl font-extrabold text-red-600 animate-shine">SZ Ludo Tournaments</h1>
                    <p className="text-muted-foreground mt-1">Join the battle and win big prizes!</p>
                </div>

                {tournaments.length > 0 ? (
                    <div className="flex flex-col items-center gap-8">
                        {tournaments.map((t) => (
                            <TournamentCard key={t.id} tournament={t} />
                        ))}
                    </div>
                ) : (
                    <Card className="text-center p-10 max-w-md mx-auto bg-white/50 dark:bg-gray-800/50">
                        <Trophy className="mx-auto h-12 w-12 text-muted-foreground" />
                        <h3 className="mt-4 text-lg font-semibold">No Tournaments Available</h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                            There are no active or upcoming tournaments right now. Please check back later.
                        </p>
                    </Card>
                )}
                 <div className="h-20 md:hidden" />
            </main>
        </div>
    );
}
