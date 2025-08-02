
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Withdrawal, listenForWithdrawals, updateWithdrawalStatus } from '@/lib/firebase/withdrawals';
import { Loader, TrendingUp, TrendingDown } from 'lucide-react';
import { updateUserWallet, AppUser, getUser } from '@/lib/firebase/users';
import Link from 'next/link';

type WithdrawalWithUser = Withdrawal & {
    user?: AppUser;
};

export default function WithdrawalsPage() {
    const [withdrawals, setWithdrawals] = useState<WithdrawalWithUser[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
      const unsubscribe = listenForWithdrawals(
        async (allWithdrawals) => {
            const withdrawalsWithUserData = await Promise.all(allWithdrawals.map(async (w) => {
                const user = await getUser(w.userId);
                return { ...w, user };
            }));
          setWithdrawals(withdrawalsWithUserData);
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
            await updateUserWallet(withdrawal.userId, withdrawal.amount, 'winnings', 'Withdrawal Rejected');
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

     const getKycBadgeVariant = (status?: 'Pending' | 'Verified' | 'Rejected') => {
        switch (status) {
            case 'Verified':
                return 'default';
            case 'Pending':
                return 'secondary';
            case 'Rejected':
                return 'destructive';
            default:
                return 'outline';
        }
    };

    const getInitials = (name?: string | null) => {
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
        <CardDescription>Review and process user withdrawal requests.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>UPI ID</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>KYC</TableHead>
              <TableHead>Lifetime (Dep/With)</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {withdrawals.map((withdrawal) => (
              <TableRow key={withdrawal.id}>
                 <TableCell>
                    <Link href={`/admin/users/${withdrawal.userId}`}>
                        <div className="flex items-center gap-3 hover:underline">
                            <Avatar>
                                <AvatarImage src={withdrawal.userAvatar} alt={withdrawal.userName} data-ai-hint="avatar person" />
                                <AvatarFallback>{getInitials(withdrawal.userName)}</AvatarFallback>
                            </Avatar>
                            <div className="font-medium">{withdrawal.userName}</div>
                        </div>
                    </Link>
                </TableCell>
                <TableCell>₹{withdrawal.amount}</TableCell>
                <TableCell>{withdrawal.upiId}</TableCell>
                <TableCell>{new Date(withdrawal.createdAt?.toDate()).toLocaleDateString()}</TableCell>
                <TableCell>
                    <Badge variant={getKycBadgeVariant(withdrawal.user?.kycStatus)}>{withdrawal.user?.kycStatus || 'N/A'}</Badge>
                </TableCell>
                <TableCell>
                    <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-1 text-green-600">
                           <TrendingUp size={14}/>
                           <span>₹{withdrawal.user?.lifetimeStats?.totalDeposits || 0}</span>
                        </div>
                        <div className="flex items-center gap-1 text-red-600">
                           <TrendingDown size={14}/>
                           <span>₹{withdrawal.user?.lifetimeStats?.totalWithdrawals || 0}</span>
                        </div>
                     </div>
                </TableCell>
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
