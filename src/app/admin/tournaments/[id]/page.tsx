
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { SplashScreen } from '@/components/ui/splash-screen';
import { Tournament, listenForTournament } from '@/lib/firebase/tournaments';
import { AppUser, getUser } from '@/lib/firebase/users';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { ChevronLeft, Users, Trophy, Percent, Calendar, UserPlus } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon }: { title: string, value: string | number, icon: React.ElementType }) => (
    <div className="flex items-center p-4 bg-muted rounded-lg">
        <Icon className="h-8 w-8 text-muted-foreground mr-4" />
        <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
        </div>
    </div>
);

export default function TournamentDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { id } = params;
    const { toast } = useToast();

    const [tournament, setTournament] = useState<Tournament | null>(null);
    const [players, setPlayers] = useState<AppUser[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (typeof id !== 'string') return;

        const unsubscribe = listenForTournament(id, (data) => {
            if (data) {
                setTournament(data);
                if(data.players.length > 0) {
                    fetchPlayers(data.players);
                } else {
                    setLoading(false);
                }
            } else {
                toast({ title: "Error", description: "Tournament not found.", variant: 'destructive' });
                router.push('/admin/tournaments');
                setLoading(false);
            }
        }, (error) => {
            console.error("Error fetching tournament:", error);
            toast({ title: "Error", description: "Failed to fetch tournament data.", variant: 'destructive' });
            setLoading(false);
        });

        const fetchPlayers = async (playerIds: string[]) => {
            try {
                const playerPromises = playerIds.map(uid => getUser(uid));
                const playerData = (await Promise.all(playerPromises)).filter(p => p !== null) as AppUser[];
                setPlayers(playerData);
            } catch (error) {
                 toast({ title: "Error", description: "Failed to fetch player data.", variant: 'destructive' });
            } finally {
                setLoading(false);
            }
        }

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
            const totalWinnersInRange = dist.rankEnd - dist.rankStart + 1;
            const totalAmountForRange = prizePoolAfterCommission * (dist.percentage / 100);
            const amountPerPlayer = totalWinnersInRange > 0 ? totalAmountForRange / totalWinnersInRange : 0;
            return {
                rank: dist.rankStart === dist.rankEnd ? `${dist.rankStart}` : `${dist.rankStart} - ${dist.rankEnd}`,
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
                        <CardTitle>Players ({players.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="max-h-96 overflow-y-auto space-y-2">
                            {players.length > 0 ? players.map(player => (
                                <div key={player.uid} className="flex items-center gap-3 p-2 rounded-md bg-muted/50">
                                    <Avatar>
                                        <AvatarImage src={player.photoURL || undefined} alt={player.displayName || ''} data-ai-hint="avatar person" />
                                        <AvatarFallback>{getInitials(player.displayName)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-semibold">{player.displayName}</p>
                                        <p className="text-xs text-muted-foreground">{player.uid}</p>
                                    </div>
                                </div>
                            )) : (
                                <p className="text-muted-foreground text-center py-4">No players have joined yet.</p>
                            )}
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
