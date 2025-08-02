
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Withdrawal, listenForWithdrawals, updateWithdrawalStatus } from '@/lib/firebase/withdrawals';
import { Loader } from 'lucide-react';
import { updateUserWallet } from '@/lib/firebase/users';


export default function WithdrawalsPage() {
    const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
      const unsubscribe = listenForWithdrawals(
        (allWithdrawals) => {
          setWithdrawals(allWithdrawals);
          setLoading(false);
        },
        (error) => {
          console.error("Error fetching withdrawals:", error);
          toast({ title: "Error", description: "Could not fetch withdrawals.", variant: "destructive" });
          setLoading(false);
        }
      );
      return () => unsubscribe();
    }, [toast]);


    const handleApprove = async (withdrawal: Withdrawal) => {
        try {
            // In a real app, you would process the payment via a payment gateway here.
            // For this simulation, we assume payment is done manually.
            await updateWithdrawalStatus(withdrawal.id, 'approved');
            toast({
                title: 'Withdrawal Approved',
                description: 'The user will receive their funds shortly. Remember to process the payment manually.',
            });
        } catch (error: any) {
             toast({
                title: 'Approval Failed',
                description: error.message,
                variant: 'destructive',
            });
        }
    };

    const handleReject = async (withdrawal: Withdrawal) => {
        try {
            // Return funds to user's winning wallet
            await updateUserWallet(withdrawal.userId, withdrawal.amount, 'winnings');
            await updateWithdrawalStatus(withdrawal.id, 'rejected');
             toast({
                title: 'Withdrawal Rejected',
                description: 'The withdrawal request has been rejected. The funds have been returned to the user\'s wallet.',
                variant: 'destructive'
            });
        } catch (error: any) {
            toast({
                title: 'Rejection Failed',
                description: error.message,
                variant: 'destructive',
            });
        }
    };
    
    const getStatusBadgeVariant = (status: Withdrawal['status']) => {
        switch (status) {
            case 'approved':
                return 'default';
            case 'pending':
                return 'secondary';
            case 'rejected':
                return 'destructive';
            default:
                return 'outline';
        }
    };

    const getInitials = (name: string) => {
        return name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U';
    }
    
    if (loading) {
        return (
            <div className="flex justify-center items-center h-full">
                <Loader className="h-16 w-16 animate-spin" />
            </div>
        )
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
                <TableCell>{new Date(withdrawal.createdAt).toLocaleDateString()}</TableCell>
                <TableCell>
                    <Badge variant={getStatusBadgeVariant(withdrawal.status)}>{withdrawal.status}</Badge>
                </TableCell>
                <TableCell className="space-x-2">
                  {withdrawal.status === 'pending' && (
                     <>
                        <Button variant="destructive" size="sm" onClick={() => handleReject(withdrawal)}>Reject</Button>
                        <Button size="sm" onClick={() => handleApprove(withdrawal)}>Approve</Button>
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
