
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { SplashScreen } from '@/components/ui/splash-screen';
import { Tournament, listenForTournament } from '@/lib/firebase/tournaments';
import { AppUser } from '@/lib/firebase/users';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { ChevronLeft, Users, Trophy, Percent, Calendar, UserPlus, Star } from 'lucide-react';
import Image from 'next/image';

const StatCard = ({ title, value, icon: Icon }: { title: string, value: string | number, icon: React.ElementType }) => (
    <div className="flex items-center p-4 bg-muted rounded-lg">
        <Icon className="h-8 w-8 text-muted-foreground mr-4" />
        <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">
                {typeof value === 'string' && value.startsWith('₹') ? value : `₹${value}`}
            </p>
        </div>
    </div>
);

export default function TournamentDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { id } = params;
    const { toast } = useToast();

    const [tournament, setTournament] = useState<Tournament | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (typeof id !== 'string') return;

        const unsubscribe = listenForTournament(id, (data) => {
            if (data) {
                setTournament(data);
            } else {
                toast({ title: "Error", description: "Tournament not found.", variant: 'destructive' });
                router.push('/admin/tournaments');
            }
            setLoading(false);
        }, (error) => {
            console.error("Error fetching tournament:", error);
            toast({ title: "Error", description: "Failed to fetch tournament data.", variant: 'destructive' });
            setLoading(false);
        });

        return () => unsubscribe();
    }, [id, router, toast]);
    
    const getStatusVariant = (status: Tournament['status']) => {
        switch (status) {
            case 'live': return 'destructive';
            case 'upcoming': return 'secondary';
            case 'completed': return 'default';
            case 'cancelled': return 'outline';
            default: return 'default';
        }
    };

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
                totalAmountForRange: `₹${totalAmountForRange.toFixed(2)}`,
            };
        });
    }, [tournament]);

    if (loading || !tournament) {
        return <SplashScreen />;
    }
    
    const playerProgress = (tournament.players.length / tournament.playerCap) * 100;
    const getInitials = (name?: string | null) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U';
    
    const leaderboard = tournament.leaderboard?.sort((a, b) => b.points - a.points) || [];

    return (
        <div className="space-y-6">
            <Link href="/admin/tournaments" className='mb-4 inline-block'>
                <Button variant="outline">
                    <ChevronLeft /> Back to Tournaments
                </Button>
            </Link>

            <Card>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="text-3xl">{tournament.title}</CardTitle>
                            <CardDescription>
                                Starts on {format(tournament.startTime.toDate(), 'PPP p')}
                            </CardDescription>
                        </div>
                        <Badge variant={getStatusVariant(tournament.status)} className="text-base">{tournament.status}</Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <StatCard title="Entry Fee" value={`₹${tournament.entryFee}`} icon={UserPlus} />
                        <StatCard title="Prize Pool" value={`₹${tournament.prizePool.toFixed(2)}`} icon={Trophy} />
                        <StatCard title="Admin Commission" value={`${tournament.adminCommission}%`} icon={Percent} />
                        <StatCard title="Created At" value={format(tournament.createdAt.toDate(), 'PP')} icon={Calendar} />
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
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle>Leaderboard ({leaderboard.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="w-full overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Rank</TableHead>
                                        <TableHead>Player</TableHead>
                                        <TableHead className="text-right">Points</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {leaderboard.length > 0 ? leaderboard.map((player, index) => (
                                        <TableRow key={player.uid}>
                                            <TableCell>{index + 1}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarImage src={player.photoURL || undefined} alt={player.displayName || ''} data-ai-hint="avatar person" />
                                                        <AvatarFallback>{getInitials(player.displayName)}</AvatarFallback>
                                                    </Avatar>
                                                    <span className="font-medium whitespace-nowrap">{player.displayName}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right font-bold">{player.points}</TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={3} className="text-muted-foreground text-center py-4">No players have joined yet.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                <Card className="lg:col-span-2">
                     <CardHeader>
                        <CardTitle>Prize Distribution</CardTitle>
                        <CardDescription>This is a live preview based on the current prize pool.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Rank</TableHead>
                                    <TableHead>Percentage</TableHead>
                                    <TableHead>Amount/Player</TableHead>
                                    <TableHead>Total for Range</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {calculatedPrizeData.map((row, index) => (
                                    <TableRow key={index}>
                                        <TableCell className="font-medium">{row.rank}</TableCell>
                                        <TableCell>{row.percentage}</TableCell>
                                        <TableCell>{row.amountPerPlayer}</TableCell>
                                        <TableCell>{row.totalAmountForRange}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
