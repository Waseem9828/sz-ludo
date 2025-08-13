
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Loader } from 'lucide-react';
import { updateUserWallet } from '@/lib/firebase/users';
import { listenForDepositRequests, updateDepositStatus, DepositRequest } from '@/lib/firebase/deposits';
import Link from 'next/link';

export default function DepositsPage() {
    const [requests, setRequests] = useState<DepositRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        const unsubscribe = listenForDepositRequests(
            (allRequests) => {
                setRequests(allRequests);
                setLoading(false);
            },
            (error) => {
                console.error("Error fetching deposit requests: ", error);
                toast({ title: "Error", description: "Could not fetch deposit requests.", variant: "destructive" });
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [toast]);


    const handleApprove = async (request: DepositRequest) => {
        try {
            // First, credit the user's wallet
            await updateUserWallet(request.userId, request.amount, 'balance', 'deposit', `Manual Deposit Approved: ${request.utr}`, request.id);
            // Then, update the deposit request status
            await updateDepositStatus(request.id, 'approved');

            toast({
                title: 'Deposit Approved!',
                description: `Successfully credited ${request.userName}.`,
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
                variant: 'destructive',
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
                return 'default'; // Greenish in some themes
            case 'pending':
                return 'secondary';
            case 'rejected':
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
            <CardTitle>Manual Deposits</CardTitle>
            <CardDescription>Review and process user deposit requests.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="w-full overflow-x-auto">
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>UTR</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {requests.map((request) => (
                    <TableRow key={request.id}>
                        <TableCell>
                            <Link href={`/admin/users/${request.userId}`} className="font-medium hover:underline whitespace-nowrap">
                            {request.userName}
                            </Link>
                        </TableCell>
                        <TableCell className="font-sans">
                            ₹{request.amount}
                        </TableCell>
                        <TableCell>{request.utr}</TableCell>
                        <TableCell className="whitespace-nowrap">{new Date(request.createdAt?.toDate()).toLocaleString()}</TableCell>
                        <TableCell>
                            <Badge variant={getStatusBadgeVariant(request.status)}>{request.status}</Badge>
                        </TableCell>
                        <TableCell className="space-x-2">
                        {request.status === 'pending' && (
                            <Dialog>
                                <DialogTrigger asChild>
                                <Button variant="outline" size="sm">Review</Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-md">
                                <DialogHeader>
                                    <DialogTitle>Review Deposit</DialogTitle>
                                    <DialogDescription>
                                        Verify the payment details and screenshot before approval.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="mt-4 space-y-4">
                                <div className="text-sm">
                                    <p><span className="font-semibold">User:</span> {request.userName}</p>
                                    <p><span className="font-semibold">Amount:</span> <span className="font-sans">₹{request.amount}</span></p>
                                    <p><span className="font-semibold">UTR:</span> {request.utr}</p>
                                    <p><span className="font-semibold">Paid to UPI:</span> {request.upiId}</p>
                                </div>
                                    <div>
                                        <h3 className="font-semibold mb-2 text-center">Submitted Screenshot</h3>
                                        <div className="p-2 border rounded-md bg-muted">
                                        <a href={request.screenshotUrl} target="_blank" rel="noopener noreferrer">
                                            <Image src={request.screenshotUrl} alt="Deposit Screenshot" width={400} height={800} className="rounded-md mx-auto aspect-[9/16] object-contain" data-ai-hint="payment screenshot" />
                                        </a>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2 mt-6">
                                        <DialogClose asChild>
                                            <Button variant="destructive" onClick={() => handleReject(request)}>Reject</Button>
                                        </DialogClose>
                                        <DialogClose asChild>
                                            <Button onClick={() => handleApprove(request)}>Approve</Button>
                                        </DialogClose>
                                </div>
                                </DialogContent>
                            </Dialog>
                        )}
                        </TableCell>
                    </TableRow>
                    ))}
                    {requests.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={6} className="text-center text-muted-foreground">No deposit requests found.</TableCell>
                        </TableRow>
                    )}
                </TableBody>
                </Table>
            </div>
        </CardContent>
        </Card>
    );
}
