
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { listenForTournaments, Tournament } from '@/lib/firebase/tournaments';
import { Loader, PlusCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function TournamentsPage() {
    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = listenForTournaments(
            (data) => {
                setTournaments(data);
                setLoading(false);
            },
            (error) => {
                toast({ title: "Error", description: `Could not fetch tournaments: ${error.message}`, variant: "destructive" });
                setLoading(false);
            }
        );
        return () => unsubscribe();
    }, [toast]);

    const getStatusVariant = (status: Tournament['status']) => {
        switch (status) {
            case 'live': return 'destructive';
            case 'upcoming': return 'secondary';
            case 'completed': return 'default';
            case 'cancelled': return 'outline';
            default: return 'default';
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full">
                <Loader className="h-16 w-16 animate-spin" />
            </div>
        );
    }

    return (
        <Card>
            <CardHeader className="flex flex-row justify-between items-center">
                <div>
                    <CardTitle>Tournaments</CardTitle>
                    <CardDescription>Manage all tournaments.</CardDescription>
                </div>
                <Link href="/admin/tournaments/create">
                    <Button>
                        <PlusCircle className="mr-2" /> Create Tournament
                    </Button>
                </Link>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Title</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Entry Fee</TableHead>
                            <TableHead>Players</TableHead>
                            <TableHead>Prize Pool</TableHead>
                            <TableHead>Starts At</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {tournaments.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                                    No tournaments found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            tournaments.map((t) => (
                                <TableRow key={t.id} className="hover:bg-muted/50 cursor-pointer" onClick={() => router.push(`/admin/tournaments/${t.id}`)}>
                                    <TableCell className="font-medium">{t.title}</TableCell>
                                    <TableCell><Badge variant={getStatusVariant(t.status)}>{t.status}</Badge></TableCell>
                                    <TableCell>₹{t.entryFee}</TableCell>
                                    <TableCell>{t.players.length} / {t.playerCap}</TableCell>
                                    <TableCell>₹{t.prizePool.toFixed(2)}</TableCell>
                                    <TableCell>{format(t.startTime.toDate(), 'PPpp')}</TableCell>
                                    <TableCell>
                                        <Button variant="outline" size="sm" asChild>
                                             <Link href={`/admin/tournaments/${t.id}`} onClick={(e) => e.stopPropagation()}>
                                                View
                                            </Link>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
