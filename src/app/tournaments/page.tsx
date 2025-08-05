
'use client';

import { useState, useEffect } from 'react';
import Header from "@/components/header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { listenForTournaments, Tournament, joinTournament } from "@/lib/firebase/tournaments";
import { Loader, Users, Trophy } from 'lucide-react';
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
                        <CardTitle className="text-xl font-bold font-headline text-red-600 animate-shine">{tournament.title}</CardTitle>
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
            <CardFooter className="p-4 bg-muted/50">
                 {isUserJoined ? (
                    <Button className="w-full font-bold" disabled>✅ Joined</Button>
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
                    <h1 className="text-3xl font-bold text-red-600 animate-shine">Ludo Tournaments</h1>
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
            </main>
        </div>
    );
}
