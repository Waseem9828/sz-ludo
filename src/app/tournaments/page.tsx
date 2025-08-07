
'use client';

import { useState, useEffect, useMemo } from 'react';
import Header from "@/components/header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { listenForTournaments, Tournament } from "@/lib/firebase/tournaments";
import { Loader, Users, Trophy, Percent } from 'lucide-react';
import { format, formatDistanceToNowStrict } from 'date-fns';
import { Progress } from '@/components/ui/progress';
import { SplashScreen } from '@/components/ui/splash-screen';
import { useAuth } from '@/context/auth-context';
import { Badge } from '@/components/ui/badge';
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
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AppUser, getUser } from '@/lib/firebase/users';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const defaultAvatar = "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEi_h6LUuqTTKYsn5TfUZwkI6Aib6Y0tOzQzcoZKstURqxyl-PJXW1DKTkF2cPPNNUbP3iuDNsOBVOYx7p-ZwrodI5w9fyqEwoabj8rU0mLzSbT5GCFUKpfCc4s_LrtHcWFDvvRstCghAfQi5Zfv2fipdZG8h4dU4vGt-eFRn-gS3QTg6_JJKhv0Yysr_ZY/s1600/82126.png";
const getInitials = (name?: string | null) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U';


const PrizeDistributionDialog = ({ tournament }: { tournament: Tournament }) => {
    const [players, setPlayers] = useState<AppUser[]>([]);
    const [loadingPlayers, setLoadingPlayers] = useState(false);

    const handleOpenChange = (isOpen: boolean) => {
        if (isOpen && tournament.players.length > 0 && players.length === 0) {
            fetchPlayers(tournament.players);
        }
    };
    
    const fetchPlayers = async (playerIds: string[]) => {
        setLoadingPlayers(true);
        try {
            const playerPromises = playerIds.map(uid => getUser(uid));
            const playerData = (await Promise.all(playerPromises)).filter(p => p !== null) as AppUser[];
            setPlayers(playerData);
        } catch (error) {
            // Handle error silently or show a toast
        } finally {
            setLoadingPlayers(false);
        }
    }

    const calculatedPrizeData = useMemo(() => {
        if (!tournament) return [];
        
        const prizePoolAfterCommission = tournament.prizePool * (1 - (tournament.adminCommission / 100));

        return tournament.prizeDistribution.map(dist => {
            const totalAmountForRange = prizePoolAfterCommission * (dist.percentage / 100);
            
            let rank = `${dist.rankStart}`;
            if (dist.rankEnd > dist.rankStart) {
                rank = `${dist.rankStart} - ${dist.rankEnd}`;
            }

            const totalWinnersInRange = Math.max(0, dist.rankEnd - dist.rankStart + 1);
            const amountPerPlayer = totalWinnersInRange > 0 ? totalAmountForRange / totalWinnersInRange : 0;

            return {
                rank,
                percentage: `${dist.percentage}%`,
                amountPerPlayer: `₹${amountPerPlayer.toFixed(2)}`,
            };
        });
    }, [tournament]);

    return (
        <Dialog onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button variant="outline" className="w-full">View Prizes</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Trophy className="h-6 w-6 text-yellow-500" />
                        Prize Info for "{tournament.title}"
                    </DialogTitle>
                </DialogHeader>
                 <Tabs defaultValue="leaderboard">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="leaderboard">Live Leaderboard</TabsTrigger>
                        <TabsTrigger value="plan">Prize Plan</TabsTrigger>
                    </TabsList>
                    <TabsContent value="leaderboard" className="mt-4">
                        {loadingPlayers ? <div className="text-center"><Loader className="animate-spin mx-auto"/></div> :
                         players.length > 0 ? (
                            <div className="max-h-80 overflow-y-auto space-y-2 pr-2">
                                {players.map((player, index) => (
                                <div key={player.uid} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                                    <div className="flex items-center gap-3">
                                        <span className="font-bold text-lg w-6 text-center">{index + 1}</span>
                                        <Avatar>
                                            <AvatarImage src={player.photoURL || undefined} alt={player.displayName || ''} />
                                            <AvatarFallback>{getInitials(player.displayName)}</AvatarFallback>
                                        </Avatar>
                                        <p className="font-semibold">{player.displayName}</p>
                                    </div>
                                    <p className="font-bold text-green-500">₹0</p>
                                </div>
                                ))}
                            </div>
                        ) : (
                             <p className="text-muted-foreground text-center py-4">No players have joined yet.</p>
                        )}
                        <p className="text-xs text-muted-foreground text-center mt-2">Leaderboard will update live once the tournament starts.</p>
                    </TabsContent>
                    <TabsContent value="plan" className="mt-4">
                        <Card className="bg-muted/50">
                            <CardContent className="p-4 text-sm space-y-2">
                                <div className="flex justify-between font-bold">
                                    <span>Total Prize Pool:</span>
                                    <span>₹{tournament.prizePool.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-red-600">
                                    <span>Admin Commission ({tournament.adminCommission}%):</span>
                                    <span>- ₹{(tournament.prizePool * (tournament.adminCommission / 100)).toFixed(2)}</span>
                                </div>
                                <hr/>
                                <div className="flex justify-between font-bold text-green-600">
                                    <span>Distributable Amount:</span>
                                    <span>₹{(tournament.prizePool * (1 - (tournament.adminCommission / 100))).toFixed(2)}</span>
                                </div>
                            </CardContent>
                        </Card>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Rank</TableHead>
                                    <TableHead>Percentage</TableHead>
                                    <TableHead className="text-right">Est. Amount/Player</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {calculatedPrizeData.map((row, index) => (
                                    <TableRow key={index}>
                                        <TableCell className="font-medium">{row.rank}</TableCell>
                                        <TableCell>{row.percentage}</TableCell>
                                        <TableCell className="text-right font-semibold">{row.amountPerPlayer}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    )
}

const TournamentCard = ({ tournament }: { tournament: Tournament }) => {
    const [timeLeft, setTimeLeft] = useState('');
    const { user } = useAuth();
    const { toast } = useToast();
    const [isJoining, setIsJoining] = useState(false);

    useEffect(() => {
        if (tournament.status !== 'upcoming' || !tournament.startTime) return;
        const interval = setInterval(() => {
            const distance = formatDistanceToNowStrict(tournament.startTime.toDate(), { addSuffix: true });
            setTimeLeft(distance);
        }, 1000);
        return () => clearInterval(interval);
    }, [tournament.startTime, tournament.status]);

    const playerProgress = (tournament.players.length / tournament.playerCap) * 100;
    const isUserJoined = user ? tournament.players.includes(user.uid) : false;
    const isJoinable = tournament.status === 'upcoming' && tournament.players.length < tournament.playerCap;

    const handleJoin = async () => {
        if (!user) {
            toast({ title: "Login Required", description: "You need to be logged in to join.", variant: "destructive" });
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
    
    return (
        <Card className="overflow-hidden shadow-lg hover:shadow-primary/20 hover:shadow-xl transition-shadow duration-300 group flex flex-col">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-xl font-bold font-headline text-red-600">{tournament.title}</CardTitle>
                         <CardDescription>
                            {tournament.status === 'upcoming' && timeLeft
                                ? `Starts ${timeLeft}`
                                : `Started on ${format(tournament.startTime.toDate(), 'PP')}`}
                        </CardDescription>
                    </div>
                    <Badge variant={tournament.status === 'live' ? 'destructive' : 'secondary'}>{tournament.status}</Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-4 flex-grow">
                <div className="flex justify-between items-center text-lg">
                    <div className="text-center">
                        <p className="text-sm text-muted-foreground">Entry Fee</p>
                        <p className="font-bold">₹{tournament.entryFee}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-sm text-muted-foreground">Prize Pool</p>
                        <p className="font-bold text-green-500">₹{tournament.prizePool.toFixed(2)}</p>
                    </div>
                </div>
                <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            <span>Players</span>
                        </div>
                        <span>{tournament.players.length} / {tournament.playerCap}</span>
                    </div>
                    <Progress value={playerProgress} />
                </div>
            </CardContent>
            <CardFooter className="p-4 bg-muted/50 grid grid-cols-2 gap-2">
                 {isUserJoined ? (
                    <Button className="w-full font-bold col-span-2" disabled>✅ Joined</Button>
                ) : (
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                           <Button className="w-full font-bold" disabled={!isJoinable || isJoining}>
                            {isJoining ? <Loader className="animate-spin" /> : isJoinable ? 'Join Now' : 'Tournament Full/Live'}
                           </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                            <AlertDialogTitle>Confirm to Join "{tournament.title}"?</AlertDialogTitle>
                            <AlertDialogDescription>
                                An entry fee of ₹{tournament.entryFee} will be deducted from your wallet balance. This action cannot be undone.
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleJoin}>Confirm & Join</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                )}
                 <div className={isUserJoined ? 'col-span-2' : ''}>
                    <PrizeDistributionDialog tournament={tournament} />
                 </div>
            </CardFooter>
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
            }
        );
        return () => unsubscribe();
    }, [toast]);

    if (loading) {
        return <SplashScreen />;
    }

    return (
        <div className="flex flex-col min-h-screen bg-background font-body">
            <Header />
            <main className="flex-grow container mx-auto px-4 py-6 space-y-6">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-red-600">Ludo Tournaments</h1>
                    <p className="text-muted-foreground">Join the battle and win big prizes!</p>
                </div>

                {tournaments.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {tournaments.map((t) => (
                            <TournamentCard key={t.id} tournament={t} />
                        ))}
                    </div>
                ) : (
                    <Card className="text-center p-10">
                        <Trophy className="mx-auto h-12 w-12 text-muted-foreground" />
                        <h3 className="mt-4 text-lg font-semibold">No Tournaments Available</h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                            There are no active or upcoming tournaments right now. Please check back later.
                        </p>
                    </Card>
                )}

                 {/* Spacer to prevent content from being hidden by the fixed bottom nav */}
                <div className="h-20 md:hidden" />
            </main>
        </div>
    );
}
