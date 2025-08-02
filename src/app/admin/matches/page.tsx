
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';

const sampleMatches = [
  { id: '1', player1: 'NSXKW...', player2: 'KlwzB...', amount: 50, status: 'Under Review', winner: 'NSXKW...', screenshotUrl: 'https://placehold.co/400x800.png', roomCode: '01063482' },
  { id: '2', player1: 'cuvbd...', player2: 'MnMBR...', amount: 450, status: 'Completed', winner: 'cuvbd...', screenshotUrl: null, roomCode: '98765432' },
  { id: '3', player1: 'IfffN...', player2: 'Shri...', amount: 150, status: 'Under Review', winner: 'Shri...', screenshotUrl: 'https://placehold.co/400x800.png', roomCode: '11223344' },
  { id: '4', player1: 'Mohit...', player2: 'JvNqA...', amount: 3500, status: 'Cancelled', winner: null, screenshotUrl: null, roomCode: '55667788' },
  { id: '5', player1: 'Sahil...', player2: 'UmIIR...', amount: 650, status: 'Completed', winner: 'Sahil...', screenshotUrl: null, roomCode: '34345656' },
];

type MatchStatus = 'Under Review' | 'Completed' | 'Cancelled' | 'Disputed';

export default function MatchesPage() {
    const [matches, setMatches] = useState(sampleMatches);

    const handleApprove = (matchId: string) => {
        setMatches(matches.map(m => m.id === matchId ? { ...m, status: 'Completed' as MatchStatus } : m));
        // Here you would add logic to update the match status in Firestore
        // and update player wallets.
    };

    const handleDecline = (matchId: string) => {
        setMatches(matches.map(m => m.id === matchId ? { ...m, status: 'Disputed' as MatchStatus } : m));
         // Here you would add logic to handle the dispute, e.g., refund players.
    };
    
    const getStatusBadgeVariant = (status: MatchStatus) => {
        switch (status) {
            case 'Completed':
                return 'default'; // Greenish in some themes
            case 'Under Review':
                return 'secondary';
            case 'Cancelled':
                return 'destructive';
            case 'Disputed':
                return 'destructive';
            default:
                return 'outline';
        }
    };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage Matches</CardTitle>
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
            {matches.map((match) => (
              <TableRow key={match.id}>
                <TableCell>{match.player1} vs {match.player2}</TableCell>
                <TableCell>₹{match.amount}</TableCell>
                <TableCell>{match.winner || 'N/A'}</TableCell>
                <TableCell>{match.roomCode}</TableCell>
                <TableCell>
                    <Badge variant={getStatusBadgeVariant(match.status as MatchStatus)}>{match.status}</Badge>
                </TableCell>
                <TableCell className="space-x-2">
                  {match.status === 'Under Review' && match.screenshotUrl && (
                     <Dialog>
                        <DialogTrigger asChild>
                           <Button variant="outline" size="sm">Review Match</Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-lg">
                           <DialogHeader>
                              <DialogTitle>Match Review</DialogTitle>
                              <DialogDescription>
                                Review the details and screenshot to verify the match winner.
                              </DialogDescription>
                           </DialogHeader>
                           <div className="mt-4 space-y-6">
                              <Card>
                                 <CardHeader className="p-4">
                                    <CardTitle className="text-base">Match Details</CardTitle>
                                 </CardHeader>
                                 <CardContent className="p-4 text-sm space-y-2">
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">Player 1:</span>
                                        <span className="font-medium">{match.player1}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">Player 2:</span>
                                        <span className="font-medium">{match.player2}</span>
                                      </div>
                                       <div className="flex justify-between">
                                        <span className="text-muted-foreground">Room Code:</span>
                                        <span className="font-mono tracking-widest">{match.roomCode}</span>
                                      </div>
                                       <div className="flex justify-between">
                                        <span className="text-muted-foreground">Winner Declared:</span>
                                        <span className="font-medium">{match.winner}</span>
                                      </div>
                                 </CardContent>
                              </Card>
                            
                              <div>
                                <h3 className="font-semibold mb-2 text-center">Submitted Screenshot</h3>
                                <div className="p-2 border rounded-md bg-muted">
                                   <Image src={match.screenshotUrl} alt="Match Screenshot" width={400} height={800} className="rounded-md mx-auto" data-ai-hint="game screenshot"/>
                                </div>
                              </div>
                           </div>
                           <div className="flex justify-end gap-2 mt-6">
                                <Button variant="destructive" onClick={() => handleDecline(match.id)}>Decline</Button>
                                <Button onClick={() => handleApprove(match.id)}>Approve</Button>
                           </div>
                        </DialogContent>
                     </Dialog>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
