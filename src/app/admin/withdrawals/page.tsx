
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Withdrawal, listenForWithdrawals, updateWithdrawalStatus } from '@/lib/firebase/withdrawals';
import { Loader, TrendingUp, TrendingDown, User, AlertCircle } from 'lucide-react';
import { updateUserWallet, AppUser, getUser } from '@/lib/firebase/users';
import Link from 'next/link';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import Image from 'next/image';
import { useAuth } from '@/context/auth-context';
import { Alert, AlertDescription } from '@/components/ui/alert';

type WithdrawalWithUser = Withdrawal & {
    user?: AppUser;
};

export default function WithdrawalsPage() {
    const [withdrawals, setWithdrawals] = useState<WithdrawalWithUser[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const { appUser: adminUser } = useAuth(); // The currently logged-in admin

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


    const handleApprove = async (withdrawal: Withdrawal) => {
        if (!adminUser || !adminUser.uid) {
            toast({ title: 'Error', description: 'Could not identify the admin.', variant: 'destructive' });
            return;
        }

        try {
            await updateWithdrawalStatus(withdrawal.id, 'approved', adminUser.uid);
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
        if (!adminUser || !adminUser.uid) {
            toast({ title: 'Error', description: 'Could not identify the admin.', variant: 'destructive' });
            return;
        }
         try {
            await updateWithdrawalStatus(withdrawal.id, 'rejected', adminUser.uid);
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
    
    const getStatusBadgeVariant = (status: Withdrawal['status']): "default" | "secondary" | "destructive" | "outline" => {
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

     const getKycBadgeVariant = (status?: 'Pending' | 'Verified' | 'Rejected'): "default" | "secondary" | "destructive" | "outline" => {
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
        {adminUser?.role === 'finance' && (
            <Alert className="mt-4 bg-blue-50 border-blue-200 text-blue-700">
                <User className="h-4 w-4 !text-blue-700" />
                <CardTitle className="text-blue-800">Your Agent Wallet</CardTitle>
                <AlertDescription>
                    Your current balance for paying out withdrawals is 
                    <span className="font-bold text-lg flex items-center gap-1">
                        <Image src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEj01a-tA55LItcrvtalUaOwdFji0EZjLW15nqZKCiNP4b6T_v7b79g7eUrg3YAsYW5i-FfbZDEONDIv-jXI_wJcwFZCbVWRuyW1hBUdPHlJ6u8SpjD_-ZveIEuDAFSTsB_7OfvxveJyyqKoyf6AsLtPZwEF2lryvPHsqXQB5MNMBGYGfEc0F0wmq9r5CmA/s1600/84440.png" alt="coin" width={16} height={16} data-ai-hint="gold coin"/>
                        {(adminUser.agentWallet?.balance || 0).toFixed(2)}
                    </span>.
                    You cannot approve withdrawals exceeding this amount.
                </AlertDescription>
            </Alert>
        )}
      </CardHeader>
      <CardContent>
        <div className="w-full overflow-x-auto">
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
                {withdrawals.map((withdrawal) => {
                    const upiLink = `upi://pay?pa=${withdrawal.upiId}&pn=${encodeURIComponent(withdrawal.userName)}&am=${withdrawal.amount}&cu=INR`;
                    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiLink)}`;
                    const canApprove = adminUser?.role === 'finance' 
                        ? (adminUser.agentWallet?.balance || 0) >= withdrawal.amount
                        : true; // superadmin can always approve in theory

                    return (
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
                    <TableCell className='flex items-center gap-1'>
                        <Image src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEj01a-tA55LItcrvtalUaOwdFji0EZjLW15nqZKCiNP4b6T_v7b79g7eUrg3YAsYW5i-FfbZDEONDIv-jXI_wJcwFZCbVWRuyW1hBUdPHlJ6u8SpjD_-ZveIEuDAFSTsB_7OfvxveJyyqKoyf6AsLtPZwEF2lryvPHsqXQB5MNMBGYGfEc0F0wmq9r5CmA/s1600/84440.png" alt="coin" width={14} height={14} data-ai-hint="gold coin"/>
                        {withdrawal.amount}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{withdrawal.upiId}</TableCell>
                    <TableCell className="whitespace-nowrap">{withdrawal.createdAt?.toDate().toLocaleDateString()}</TableCell>
                    <TableCell>
                        <Badge variant={getKycBadgeVariant(withdrawal.user?.kycStatus)}>{withdrawal.user?.kycStatus || 'N/A'}</Badge>
                    </TableCell>
                    <TableCell>
                        <div className="space-y-1 text-xs whitespace-nowrap">
                            <div className="flex items-center gap-1 text-green-600">
                            <TrendingUp size={14}/>
                            <span className='flex items-center gap-1'>
                                <Image src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEj01a-tA55LItcrvtalUaOwdFji0EZjLW15nqZKCiNP4b6T_v7b79g7eUrg3YAsYW5i-FfbZDEONDIv-jXI_wJcwFZCbVWRuyW1hBUdPHlJ6u8SpjD_-ZveIEuDAFSTsB_7OfvxveJyyqKoyf6AsLtPZwEF2lryvPHsqXQB5MNMBGYGfEc0F0wmq9r5CmA/s1600/84440.png" alt="coin" width={12} height={12} data-ai-hint="gold coin"/>
                                {withdrawal.user?.lifetimeStats?.totalDeposits || 0}
                            </span>
                            </div>
                            <div className="flex items-center gap-1 text-red-600 animate-shine">
                            <TrendingDown size={14}/>
                            <span className='flex items-center gap-1'>
                                <Image src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEj01a-tA55LItcrvtalUaOwdFji0EZjLW15nqZKCiNP4b6T_v7b79g7eUrg3YAsYW5i-FfbZDEONDIv-jXI_wJcwFZCbVWRuyW1hBUdPHlJ6u8SpjD_-ZveIEuDAFSTsB_7OfvxveJyyqKoyf6AsLtPZwEF2lryvPHsqXQB5MNMBGYGfEc0F0wmq9r5CmA/s1600/84440.png" alt="coin" width={12} height={12} data-ai-hint="gold coin"/>
                                {withdrawal.user?.lifetimeStats?.totalWithdrawals || 0}
                            </span>
                            </div>
                        </div>
                    </TableCell>
                    <TableCell>
                        <Badge variant={getStatusBadgeVariant(withdrawal.status)}>{withdrawal.status}</Badge>
                        {withdrawal.status === 'approved' && withdrawal.processedByAdminName && (
                            <p className="text-xs text-muted-foreground mt-1 whitespace-nowrap">by {withdrawal.processedByAdminName}</p>
                        )}
                    </TableCell>
                    <TableCell className="space-x-2">
                    {withdrawal.status === 'pending' && (
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="sm" disabled={withdrawal.user?.kycStatus !== 'Verified' || !canApprove}>
                                    {withdrawal.user?.kycStatus !== 'Verified' ? 'KYC Pending' : !canApprove ? 'Insuff. Funds' : 'Review & Pay'}
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md">
                            <DialogHeader>
                                    <DialogTitle>Step 1: Pay Manually</DialogTitle>
                                    <DialogDescription>
                                        Scan the QR code with your UPI app to pay the user. After successful payment, click "Approve".
                                    </DialogDescription>
                            </DialogHeader>
                            <div className="mt-4 space-y-4 text-center">
                                    <div className="p-4 border rounded-lg bg-white inline-block">
                                        <Image src={qrCodeUrl} alt="UPI QR Code" width={250} height={250} data-ai-hint="qr code" />
                                    </div>
                                <div className="text-sm">
                                    <p><span className="font-semibold">User:</span> {withdrawal.userName}</p>
                                    <p><span className="font-semibold">UPI ID:</span> {withdrawal.upiId}</p>
                                    <p className="text-2xl font-bold flex items-center justify-center gap-1">
                                        Pay: 
                                        <Image src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEj01a-tA55LItcrvtalUaOwdFji0EZjLW15nqZKCiNP4b6T_v7b79g7eUrg3YAsYW5i-FfbZDEONDIv-jXI_wJcwFZCbVWRuyW1hBUdPHlJ6u8SpjD_-ZveIEuDAFSTsB_7OfvxveJyyqKoyf6AsLtPZwEF2lryvPHsqXQB5MNMBGYGfEc0F0wmq9r5CmA/s1600/84440.png" alt="coin" width={24} height={24} data-ai-hint="gold coin"/>
                                        {withdrawal.amount}
                                    </p>
                                </div>
                                </div>
                            <div className="mt-6 space-y-2">
                                    <p className="text-center font-semibold text-lg">Step 2: Confirm Transaction</p>
                                    <div className="flex justify-end gap-2">
                                        <DialogClose asChild>
                                            <Button variant="destructive" onClick={() => handleReject(withdrawal)}>Reject</Button>
                                        </DialogClose>
                                        <DialogClose asChild>
                                            <Button onClick={() => handleApprove(withdrawal)}>Approve</Button>
                                        </DialogClose>
                                    </div>
                            </div>
                            </DialogContent>
                        </Dialog>
                    )}
                    </TableCell>
                </TableRow>
                )})}
                {withdrawals.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={8} className="text-center text-muted-foreground">No withdrawal requests found.</TableCell>
                    </TableRow>
                )}
            </TableBody>
            </Table>
        </div>
      </CardContent>
    </Card>
  );
}
