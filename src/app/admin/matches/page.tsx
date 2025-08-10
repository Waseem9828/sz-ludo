
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Game, listenForGamesHistory } from '@/lib/firebase/games';
import { Loader } from 'lucide-react';
import { updateUserWallet } from '@/lib/firebase/users';

export default function MatchesPage() {
    const [matches, setMatches] = useState<Game[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        const unsubscribe = listenForGamesHistory(
            (games) => {
                // Sort client-side
                const sortedGames = games.sort((a, b) => {
                    const dateA = a.createdAt?.toDate() || 0;
                    const dateB = b.createdAt?.toDate() || 0;
                    return (dateB as number) - (dateA as number);
                });
                setMatches(sortedGames);
                setLoading(false);
            },
            (error) => {
                console.error("Error fetching match history: ", error);
                toast({ title: "Error", description: "Could not fetch match history.", variant: "destructive" });
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [toast]);

    const getStatusBadgeVariant = (status: Game['status']) => {
        switch (status) {
            case 'completed':
                return 'default'; // Greenish in some themes
            case 'under_review':
                return 'secondary';
            case 'cancelled':
                return 'destructive';
            case 'disputed':
                return 'destructive';
            default:
                return 'outline';
        }
    };
    
    const getWinnerDisplayName = (match: Game) => {
        if (!match.winner) return 'N/A';
        if (match.player1?.uid === match.winner) return match.player1.displayName;
        if (match.player2?.uid === match.winner) return match.player2.displayName;
        return match.winner; // Fallback to UID if names not found
    }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader className="h-16 w-16 animate-spin" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Match History</CardTitle>
        <CardDescription>A log of all completed, cancelled, or disputed matches.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="w-full overflow-x-auto">
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead>Players</TableHead>
                <TableHead>Bet Amount</TableHead>
                <TableHead>Winner</TableHead>
                <TableHead>Room Code</TableHead>
                <TableHead>Status</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {matches.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                            No historical matches found.
                        </TableCell>
                    </TableRow>
                )}
                {matches.map((match) => (
                <TableRow key={match.id}>
                    <TableCell className="whitespace-nowrap">{match.player1?.displayName} vs {match.player2?.displayName || 'N/A'}</TableCell>
                    <TableCell>₹{match.amount}</TableCell>
                    <TableCell className="whitespace-nowrap">{getWinnerDisplayName(match)}</TableCell>
                    <TableCell>{match.roomCode}</TableCell>
                    <TableCell>
                        <Badge variant={getStatusBadgeVariant(match.status)}>{match.status.replace('_', ' ')}</Badge>
                    </TableCell>
                </TableRow>
                ))}
            </TableBody>
            </Table>
        </div>
      </CardContent>
    </Card>
  );
}
