
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { DepositRequest, listenForDepositRequests, updateDepositStatus } from '@/lib/firebase/transactions';
import { Loader, Eye } from 'lucide-react';
import { updateUserWallet } from '@/lib/firebase/users';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import Image from 'next/image';
import { incrementUpiAmount } from '@/lib/firebase/settings';

export default function DepositsPage() {
    const [deposits, setDeposits] = useState<DepositRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        const unsubscribe = listenForDepositRequests(
            (allDeposits) => {
                setDeposits(allDeposits);
                setLoading(false);
            },
            (error) => {
                console.error("Error fetching deposits:", error);
                toast({ title: "Error", description: "Could not fetch deposit requests.", variant: "destructive" });
                setLoading(false);
            }
        );
        return () => unsubscribe();
    }, [toast]);

    const handleApprove = async (request: DepositRequest) => {
        try {
            // First, update user's wallet and lifetime stats
            await updateUserWallet(request.userId, request.amount, 'balance', 'deposit');
            
            // Then, update the request status
            await updateDepositStatus(request.id, 'approved');

            // Then, increment the UPI ID's current amount
            await incrementUpiAmount(request.upiId, request.amount);

            toast({
                title: 'Deposit Approved',
                description: `₹${request.amount} has been added to ${request.userName}'s wallet.`,
            });
        } catch (error: any) {
            toast({
                title: 'Approval Failed',
                description: error.message,
                variant: 'destructive',
            });
        }
    };

    const handleReject = async (request: DepositRequest) => {
        try {
            await updateDepositStatus(request.id, 'rejected');
            toast({
                title: 'Deposit Rejected',
                description: 'The deposit request has been rejected.',
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

    const getStatusBadgeVariant = (status: DepositRequest['status']) => {
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
                <CardTitle>Manage Deposits</CardTitle>
                <CardDescription>Review and process user deposit requests.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Paid To UPI</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Screenshot</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {deposits.map((request) => (
                            <TableRow key={request.id}>
                                <TableCell>
                                    <Link href={`/admin/users/${request.userId}`}>
                                        <div className="flex items-center gap-3 hover:underline">
                                            <Avatar>
                                                <AvatarImage src={request.userAvatar} alt={request.userName} data-ai-hint="avatar person" />
                                                <AvatarFallback>{getInitials(request.userName)}</AvatarFallback>
                                            </Avatar>
                                            <div className="font-medium">{request.userName}</div>
                                        </div>
                                    </Link>
                                </TableCell>
                                <TableCell>₹{request.amount}</TableCell>
                                <TableCell>{request.upiId}</TableCell>
                                <TableCell>{new Date(request.createdAt?.toDate()).toLocaleString()}</TableCell>
                                <TableCell>
                                    {request.screenshotUrl ? (
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button variant="outline" size="icon">
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle>Payment Screenshot</DialogTitle>
                                                </DialogHeader>
                                                <div className="mt-4">
                                                    <Image src={request.screenshotUrl} alt="Payment Screenshot" width={600} height={800} className="w-full h-auto rounded-md" />
                                                </div>
                                            </DialogContent>
                                        </Dialog>
                                    ) : (
                                        <span>N/A</span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <Badge variant={getStatusBadgeVariant(request.status)}>{request.status}</Badge>
                                </TableCell>
                                <TableCell className="space-x-2">
                                    {request.status === 'pending' && (
                                        <>
                                            <Button variant="destructive" size="sm" onClick={() => handleReject(request)}>Reject</Button>
                                            <Button size="sm" onClick={() => handleApprove(request)}>Approve</Button>
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
