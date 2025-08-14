
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Withdrawal, listenForWithdrawals } from '@/lib/firebase/withdrawals';
import { Loader, TrendingUp, TrendingDown, User, AlertCircle } from 'lucide-react';
import { AppUser, getUser } from '@/lib/firebase/users';
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
            if (allWithdrawals.length === 0) {
                setWithdrawals([]);
                setLoading(false);
                return;
            }
            const userIds = [...new Set(allWithdrawals.map(w => w.userId))];
            const userPromises = userIds.map(id => getUser(id));
            const users = (await Promise.all(userPromises)).filter(u => u) as AppUser[];
            const userMap = new Map(users.map(u => [u.uid, u]));

            const withdrawalsWithUserData = allWithdrawals.map(w => ({
                ...w,
                user: userMap.get(w.userId)
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
    
    const getStatusBadgeVariant = (status: Withdrawal['status']): "default" | "secondary" | "destructive" | "outline" => {
        switch (status) {
            case 'approved':
                return 'default';
            case 'pending':
            case 'assigned':
                return 'secondary';
            case 'rejected':
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
        <CardTitle>All Withdrawals</CardTitle>
        <CardDescription>A log of all user withdrawal requests.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="w-full overflow-x-auto">
            <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Agent</TableHead>
                    <TableHead>UTR</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {withdrawals.map((withdrawal) => (
                <TableRow key={withdrawal.id}>
                    <TableCell>
                        <Link href={`/admin/users/${withdrawal.userId}`}>
                            <div className="flex items-center gap-3 hover:underline whitespace-nowrap">
                                <Avatar>
                                    <AvatarImage src={withdrawal.userAvatar} alt={withdrawal.userName} data-ai-hint="avatar person" />
                                    <AvatarFallback>{getInitials(withdrawal.userName)}</AvatarFallback>
                                </Avatar>
                                <div className="font-medium">{withdrawal.userName}</div>
                            </div>
                        </Link>
                    </TableCell>
                    <TableCell className="font-sans">
                        ₹{withdrawal.amount}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{withdrawal.createdAt?.toDate().toLocaleDateString()}</TableCell>
                     <TableCell>
                        <Badge variant={getStatusBadgeVariant(withdrawal.status)}>{withdrawal.status}</Badge>
                    </TableCell>
                     <TableCell>
                        {withdrawal.processedByAdminName || 'N/A'}
                    </TableCell>
                    <TableCell>
                        {withdrawal.utr || 'N/A'}
                    </TableCell>
                </TableRow>
                ))}
                {withdrawals.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">No withdrawal requests found.</TableCell>
                    </TableRow>
                )}
            </TableBody>
            </Table>
        </div>
      </CardContent>
    </Card>
  );
}
