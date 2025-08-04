
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Game, listenForGames, updateGameStatus } from '@/lib/firebase/games';
import { Loader } from 'lucide-react';
import { updateUserWallet } from '@/lib/firebase/users';

type MatchStatus = 'under_review' | 'completed' | 'cancelled' | 'disputed';

export default function MatchesPage() {
    const [matches, setMatches] = useState<Game[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        const unsubscribe = listenForGames(
            (games) => {
                const reviewableGames = games.filter(g => g.status === 'under_review' || g.status === 'completed' || g.status === 'cancelled' || g.status === 'disputed');
                setMatches(reviewableGames);
                setLoading(false);
            },
            undefined, // No specific status filter, so we filter client-side for multiple statuses
            (error) => {
                console.error("Error fetching matches: ", error);
                toast({ title: "Error", description: "Could not fetch matches.", variant: "destructive" });
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [toast]);


    const handleApprove = async (match: Game) => {
        if (!match.winner || !match.player1 || !match.player2) {
             toast({
                title: 'Error',
                description: 'Match data is incomplete.',
                variant: 'destructive',
            });
            return;
        }

        const commission = match.amount * 0.05;
        const finalAmount = match.amount - commission;
        const loserId = match.winner === match.player1.uid ? match.player2.uid : match.player1.uid;

        try {
            // First, credit the winner
            await updateUserWallet(match.winner, finalAmount, 'winnings', 'winnings');

            // Then, deduct from the loser. This assumes the bet amount was held in an escrow or deducted from balance at match start.
            // For simplicity, we'll just log the logic here. A real system would have more complex transaction handling.
            // await updateUserWallet(loserId, -match.amount, 'balance');

            // Finally, update the game status
            await updateGameStatus(match.id, 'completed');

            toast({
                title: 'Match Approved!',
                description: `₹${finalAmount.toFixed(2)} has been credited to the winner.`,
            });
        } catch (error: any) {
             toast({
                title: 'Approval Failed',
                description: error.message,
                variant: 'destructive',
            });
        }
    };

    const handleDecline = async (matchId: string) => {
         try {
            await updateGameStatus(matchId, 'disputed');
            // Here you would add logic to handle the dispute, e.g., refund players.
            // For simplicity, we are just changing the status.
            toast({
                title: 'Match Declined',
                description: 'The match has been marked as disputed.',
                variant: 'destructive',
            });
         } catch (error: any) {
              toast({
                title: 'Decline Failed',
                description: error.message,
                variant: 'destructive',
            });
         }
    };
    
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
        <CardTitle className="text-red-600">Manage Matches</CardTitle>
        <CardDescription>Review match results and screenshots to approve or decline outcomes.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Players</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Winner</TableHead>
              <TableHead>Room Code</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {matches.map((match) => {
                const commission = match.amount * 0.05;
                const finalAmount = match.amount - commission;

                return (
              <TableRow key={match.id}>
                <TableCell>{match.player1?.displayName} vs {match.player2?.displayName}</TableCell>
                <TableCell>₹{match.amount}</TableCell>
                <TableCell>{match.winner === match.player1.uid ? match.player1.displayName : match.player2?.displayName || 'N/A'}</TableCell>
                <TableCell>{match.roomCode}</TableCell>
                <TableCell>
                    <Badge variant={getStatusBadgeVariant(match.status)}>{match.status.replace('_', ' ')}</Badge>
                </TableCell>
                <TableCell className="space-x-2">
                  {match.status === 'under_review' && match.screenshotUrl && (
                     <Dialog>
                        <DialogTrigger asChild>
                           <Button variant="outline" size="sm">Review Match</Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                           <DialogHeader>
                              <DialogTitle>Match Review</DialogTitle>
                              <DialogDescription>
                                Review the details and screenshot to verify the match winner.
                              </DialogDescription>
                           </DialogHeader>
                           <div className="mt-4 grid md:grid-cols-2 gap-6">
                              <div className="space-y-6">
                                  <Card>
                                     <CardHeader className="p-4">
                                        <CardTitle className="text-base">Match Details</CardTitle>
                                     </CardHeader>
                                     <CardContent className="p-4 text-sm space-y-2">
                                          <div className="flex justify-between">
                                            <span className="text-muted-foreground">Player 1:</span>
                                            <span className="font-medium">{match.player1.displayName}</span>
                                          </div>
                                          <div className="flex justify-between">
                                            <span className="text-muted-foreground">Player 2:</span>
                                            <span className="font-medium">{match.player2?.displayName}</span>
                                          </div>
                                           <div className="flex justify-between">
                                            <span className="text-muted-foreground">Room Code:</span>
                                            <span className="font-mono tracking-widest">{match.roomCode}</span>
                                          </div>
                                           <div className="flex justify-between">
                                            <span className="text-muted-foreground">Winner Declared:</span>
                                            <span className="font-medium">{match.winner === match.player1.uid ? match.player1.displayName : match.player2?.displayName}</span>
                                          </div>
                                     </CardContent>
                                  </Card>

                                  <Card>
                                     <CardHeader className="p-4">
                                        <CardTitle className="text-base">Payout Calculation</CardTitle>
                                     </CardHeader>
                                     <CardContent className="p-4 text-sm space-y-2">
                                         <div className="flex justify-between">
                                             <span className="text-muted-foreground">Prize Pool:</span>
                                             <span className="font-medium">₹{match.amount.toFixed(2)}</span>
                                         </div>
                                         <div className="flex justify-between text-red-600">
                                             <span className="text-muted-foreground">Platform Commission (5%):</span>
                                             <span className="font-medium">- ₹{commission.toFixed(2)}</span>
                                         </div>
                                         <hr/>
                                         <div className="flex justify-between font-bold">
                                             <span>Final Amount to Winner:</span>
                                             <span>₹{finalAmount.toFixed(2)}</span>
                                         </div>
                                     </CardContent>
                                  </Card>
                              </div>
                            
                              <div>
                                <h3 className="font-semibold mb-2 text-center">Submitted Screenshot</h3>
                                <div className="p-2 border rounded-md bg-muted">
                                   <Image src={match.screenshotUrl} alt="Match Screenshot" width={400} height={800} className="rounded-md mx-auto aspect-[9/16] object-contain" data-ai-hint="game screenshot"/>
                                </div>
                              </div>
                           </div>
                           <div className="flex justify-end gap-2 mt-6">
                                <DialogClose asChild>
                                    <Button variant="destructive" onClick={() => handleDecline(match.id)}>Decline</Button>
                                </DialogClose>
                                <DialogClose asChild>
                                    <Button onClick={() => handleApprove(match)}>Approve</Button>
                                </DialogClose>
                           </div>
                        </DialogContent>
                     </Dialog>
                  )}
                </TableCell>
              </TableRow>
            )})}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
