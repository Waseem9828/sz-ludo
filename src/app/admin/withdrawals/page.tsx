
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';

type WithdrawalStatus = 'Pending' | 'Approved' | 'Rejected';

const sampleWithdrawals = [
  { id: 'w1', userId: '1', userName: 'NSXKW...', amount: 200, upiId: 'nsxkw@upi', date: '2023-10-27', status: 'Pending' as WithdrawalStatus, userAvatar: 'https://placehold.co/40x40.png' },
  { id: 'w2', userId: '2', userName: 'cuvbd...', amount: 150, upiId: 'cuvbd@upi', date: '2023-10-26', status: 'Pending' as WithdrawalStatus, userAvatar: 'https://placehold.co/40x40.png' },
  { id: 'w3', userId: '5', userName: 'Sahil...', amount: 500, upiId: 'sahil@upi', date: '2023-10-25', status: 'Approved' as WithdrawalStatus, userAvatar: 'https://placehold.co/40x40.png' },
   { id: 'w4', userId: '4', userName: 'Mohit...', amount: 100, upiId: 'mohit@upi', date: '2023-10-24', status: 'Rejected' as WithdrawalStatus, userAvatar: 'https://placehold.co/40x40.png' },
];

export default function WithdrawalsPage() {
    const [withdrawals, setWithdrawals] = useState(sampleWithdrawals);
    const { toast } = useToast();

    const handleApprove = (withdrawalId: string) => {
        setWithdrawals(withdrawals.map(w => w.id === withdrawalId ? { ...w, status: 'Approved' } : w));
        toast({
            title: 'Withdrawal Approved',
            description: 'The user will receive their funds shortly.',
        });
        // Here you would add logic to update the request in Firestore and deduct from the user's winning wallet.
    };

    const handleReject = (withdrawalId: string) => {
        setWithdrawals(withdrawals.map(w => w.id === withdrawalId ? { ...w, status: 'Rejected' } : w));
         toast({
            title: 'Withdrawal Rejected',
            description: 'The withdrawal request has been rejected. The funds remain in the user\'s wallet.',
            variant: 'destructive'
        });
        // Here you would update the request status in Firestore.
    };
    
    const getStatusBadgeVariant = (status: WithdrawalStatus) => {
        switch (status) {
            case 'Approved':
                return 'default';
            case 'Pending':
                return 'secondary';
            case 'Rejected':
                return 'destructive';
            default:
                return 'outline';
        }
    };

    const getInitials = (name: string) => {
        return name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U';
    }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage Withdrawals</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>UPI ID</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {withdrawals.map((withdrawal) => (
              <TableRow key={withdrawal.id}>
                 <TableCell>
                    <div className="flex items-center gap-3">
                        <Avatar>
                            <AvatarImage src={withdrawal.userAvatar} alt={withdrawal.userName} data-ai-hint="avatar person" />
                            <AvatarFallback>{getInitials(withdrawal.userName)}</AvatarFallback>
                        </Avatar>
                        <div className="font-medium">{withdrawal.userName}</div>
                    </div>
                </TableCell>
                <TableCell>₹{withdrawal.amount}</TableCell>
                <TableCell>{withdrawal.upiId}</TableCell>
                <TableCell>{withdrawal.date}</TableCell>
                <TableCell>
                    <Badge variant={getStatusBadgeVariant(withdrawal.status)}>{withdrawal.status}</Badge>
                </TableCell>
                <TableCell className="space-x-2">
                  {withdrawal.status === 'Pending' && (
                     <>
                        <Button variant="destructive" size="sm" onClick={() => handleReject(withdrawal.id)}>Reject</Button>
                        <Button size="sm" onClick={() => handleApprove(withdrawal.id)}>Approve</Button>
                     </>
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
