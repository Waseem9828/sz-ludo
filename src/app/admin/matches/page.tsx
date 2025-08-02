
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const sampleMatches = [
  { id: '1', player1: 'NSXKW...', player2: 'KlwzB...', amount: 50, status: 'Under Review', winner: 'NSXKW...', screenshotUrl: 'https://placehold.co/400x800.png' },
  { id: '2', player1: 'cuvbd...', player2: 'MnMBR...', amount: 450, status: 'Completed', winner: 'cuvbd...', screenshotUrl: null },
  { id: '3', player1: 'IfffN...', player2: 'Shri...', amount: 150, status: 'Under Review', winner: 'Shri...', screenshotUrl: 'https://placehold.co/400x800.png' },
  { id: '4', player1: 'Mohit...', player2: 'JvNqA...', amount: 3500, status: 'Cancelled', winner: null, screenshotUrl: null },
  { id: '5', player1: 'Sahil...', player2: 'UmIIR...', amount: 650, status: 'Completed', winner: 'Sahil...', screenshotUrl: null },
];

type MatchStatus = 'Under Review' | 'Completed' | 'Cancelled' | 'Disputed';

export default function MatchesPage() {
    const [matches, setMatches] = useState(sampleMatches);

    const handleApprove = (matchId: string) => {
        setMatches(matches.map(m => m.id === matchId ? { ...m, status: 'Completed' } : m));
        // Here you would add logic to update the match status in Firestore
        // and update player wallets.
    };

    const handleDecline = (matchId: string) => {
        setMatches(matches.map(m => m.id === matchId ? { ...m, status: 'Disputed' } : m));
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
        <CardTitle className="text-red-600">Manage Matches</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Players</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Winner</TableHead>
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
                <TableCell>
                    <Badge variant={getStatusBadgeVariant(match.status as MatchStatus)}>{match.status}</Badge>
                </TableCell>
                <TableCell className="space-x-2">
                  {match.status === 'Under Review' && match.screenshotUrl && (
                     <Dialog>
                        <DialogTrigger asChild>
                           <Button variant="outline" size="sm">View Screenshot</Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                           <DialogHeader>
                              <DialogTitle>Match Screenshot</DialogTitle>
                           </DialogHeader>
                           <div className="mt-4">
                            <Image src={match.screenshotUrl} alt="Match Screenshot" width={400} height={800} className="rounded-md" data-ai-hint="game screenshot"/>
                           </div>
                           <div className="flex justify-end gap-2 mt-4">
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
