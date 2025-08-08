
'use client';

import React, { useState, useEffect } from 'react';
import Header from "@/components/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChevronLeft, AlertCircle, Plus, Minus, Loader, Gamepad2, Trophy, Users, TrendingUp, TrendingDown } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { SplashScreen } from '@/components/ui/splash-screen';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createWithdrawalRequest } from '@/lib/firebase/withdrawals';
import { Transaction, TransactionType, listenForUserTransactions } from '@/lib/firebase/transactions';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Game, listenForUserGames } from '@/lib/firebase/games';
import Image from 'next/image';

const quickWithdrawAmounts = [300, 1000, 5000, 10000];

export default function WalletPage() {
    const { toast } = useToast();
    const router = useRouter();
    const { user, appUser, loading } = useAuth();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [games, setGames] = useState<Game[]>([]);
    const [isWithdrawDialogOpen, setIsWithdrawDialogOpen] = useState(false);
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [upiId, setUpiId] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
            return;
        }
        if (appUser?.upiId) {
            setUpiId(appUser.upiId);
        }

        if (user) {
            const unsubscribeTransactions = listenForUserTransactions(user.uid, setTransactions);
            const unsubscribeGames = listenForUserGames(user.uid, 20, setGames);
            return () => {
                unsubscribeTransactions();
                unsubscribeGames();
            };
        }

    }, [user, appUser, loading, router]);


    const handleWithdrawChips = async () => {
        if (!user || !appUser) return;
        
        if (appUser.kycStatus !== 'Verified') {
            toast({ title: "KYC Not Verified", description: "Please complete and verify your KYC to enable withdrawals.", variant: "destructive" });
            setIsWithdrawDialogOpen(false);
            router.push('/kyc');
            return;
        }

        const amount = parseFloat(withdrawAmount);
        
        if (isNaN(amount) || amount < 300) {
            toast({ title: "Invalid Amount", description: "Minimum withdrawal amount is ₹300.", variant: "destructive" });
            return;
        }
        
        if (amount > 10000) {
            toast({ title: "Invalid Amount", description: "Maximum withdrawal amount is ₹10,000.", variant: "destructive" });
            return;
        }

        if (amount > (appUser.wallet?.winnings || 0)) {
            toast({ title: "Insufficient Winnings", description: "You cannot withdraw more than your winning balance.", variant: "destructive" });
            return;
        }

        if (!upiId) {
            toast({ title: "UPI ID Required", description: "Please enter your UPI ID in the KYC section.", variant: "destructive" });
            return;
        }

        setIsSubmitting(true);
        try {
            await createWithdrawalRequest({
                userId: user.uid,
                userName: appUser.displayName || 'N/A',
                userAvatar: appUser.photoURL || '',
                amount,
                upiId,
                status: 'pending'
            });

            toast({
                title: "Withdrawal Request Submitted",
                description: `Your request to withdraw ₹${amount} has been sent for approval.`,
            });
            setIsWithdrawDialogOpen(false);
            setWithdrawAmount('');

        } catch (error: any) {
            toast({ title: "Withdrawal Failed", description: error.message, variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    if (loading || !user || !appUser) {
        return <SplashScreen />;
    }

    const totalBalance = (appUser.wallet?.balance || 0) + (appUser.wallet?.winnings || 0);
    const isKycPending = appUser.kycStatus !== 'Verified';

    const getStatusBadgeVariant = (status: Transaction['status']) => {
        switch (status) {
            case 'approved':
            case 'completed':
                return 'default';
            case 'pending':
                return 'secondary';
            case 'rejected':
            case 'failed':
                return 'destructive';
            default:
                return 'outline';
        }
    };

    const isCredit = (type: TransactionType) => {
        return ['deposit', 'winnings', 'Admin Credit', 'refund', 'Referral Earning'].includes(type);
    }


    return (
        <div className="flex flex-col min-h-screen bg-background font-body">
            <Header />
            <main className="flex-grow container mx-auto px-4 py-6 space-y-6">
                <Card>
                    <CardHeader className="text-center">
                        <CardDescription>Total Balance</CardDescription>
                        <CardTitle className="text-4xl font-bold flex items-center justify-center gap-2">
                             <Image src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEj01a-tA55LItcrvtalUaOwdFji0EZjLW15nqZKCiNP4b6T_v7b79g7eUrg3YAsYW5i-FfbZDEONDIv-jXI_wJcwFZCbVWRuyW1hBUdPHlJ6u8SpjD_-ZveIEuDAFSTsB_7OfvxveJyyqKoyf6AsLtPZwEF2lryvPHsqXQB5MNMBGYGfEc0F0wmq9r5CmA/s1600/84440.png" alt="coin" width={36} height={36} data-ai-hint="gold coin"/>
                            ₹{totalBalance.toFixed(2)}
                        </CardTitle>
                    </CardHeader>
                </Card>

                {isKycPending && (
                    <Card className="bg-destructive/10 border-destructive/50">
                        <CardContent className="p-3 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <AlertCircle className="h-5 w-5 text-destructive" />
                                <span className="font-semibold text-destructive">KYC Not Verified</span>
                            </div>
                            <Link href="/kyc">
                                <Button variant="destructive" size="sm">Complete Now</Button>
                            </Link>
                        </CardContent>
                    </Card>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-center text-lg font-semibold text-red-600">Deposit Chips</CardTitle>
                            <CardDescription className="text-center">Available for Gameplay</CardDescription>
                        </CardHeader>
                        <CardContent className="text-center space-y-4">
                            <p className="text-3xl font-bold flex items-center justify-center gap-2">
                                <Image src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEj01a-tA55LItcrvtalUaOwdFji0EZjLW15nqZKCiNP4b6T_v7b79g7eUrg3YAsYW5i-FfbZDEONDIv-jXI_wJcwFZCbVWRuyW1hBUdPHlJ6u8SpjD_-ZveIEuDAFSTsB_7OfvxveJyyqKoyf6AsLtPZwEF2lryvPHsqXQB5MNMBGYGfEc0F0wmq9r5CmA/s1600/84440.png" alt="coin" width={32} height={32} data-ai-hint="gold coin"/>
                                ₹{(appUser.wallet?.balance || 0).toFixed(2)}
                            </p>
                            <Link href="/wallet/add-cash">
                                <Button className="w-full bg-primary hover:bg-primary/90 font-bold text-lg py-6">
                                    <Plus className="mr-2"/>
                                    Add Cash
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                    
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-center text-lg font-semibold text-red-600">Winning Chips</CardTitle>
                            <CardDescription className="text-center">Withdrawable Balance</CardDescription>
                        </CardHeader>
                        <CardContent className="text-center space-y-4">
                            <p className="text-3xl font-bold flex items-center justify-center gap-2">
                                <Image src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEj01a-tA55LItcrvtalUaOwdFji0EZjLW15nqZKCiNP4b6T_v7b79g7eUrg3YAsYW5i-FfbZDEONDIv-jXI_wJcwFZCbVWRuyW1hBUdPHlJ6u8SpjD_-ZveIEuDAFSTsB_7OfvxveJyyqKoyf6AsLtPZwEF2lryvPHsqXQB5MNMBGYGfEc0F0wmq9r5CmA/s1600/84440.png" alt="coin" width={32} height={32} data-ai-hint="gold coin"/>
                                ₹{(appUser.wallet?.winnings || 0).toFixed(2)}
                            </p>
                            <Dialog open={isWithdrawDialogOpen} onOpenChange={setIsWithdrawDialogOpen}>
                                <DialogTrigger asChild>
                                     <Button className="w-full bg-green-600 hover:bg-green-700 text-white font-bold text-lg py-6" disabled={isKycPending || (appUser.wallet?.winnings || 0) < 300}>
                                        <Minus className="mr-2" />
                                        Withdraw
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Request Withdrawal</DialogTitle>
                                        <DialogDescription>
                                            Enter the amount you wish to withdraw from your winnings of ₹{(appUser.wallet?.winnings || 0).toFixed(2)}.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                         <div>
                                            <Label htmlFor="withdraw-amount">Amount (Min: ₹300, Max: ₹10,000)</Label>
                                            <Input
                                                id="withdraw-amount"
                                                type="number"
                                                value={withdrawAmount}
                                                onChange={(e) => setWithdrawAmount(e.target.value)}
                                                placeholder="Enter amount"
                                            />
                                        </div>
                                        <div className="grid grid-cols-4 gap-2">
                                            {quickWithdrawAmounts.map(qAmount => (
                                                <Button 
                                                    key={qAmount}
                                                    variant="outline"
                                                    onClick={() => setWithdrawAmount(qAmount.toString())}
                                                >
                                                    ₹{qAmount}
                                                </Button>
                                            ))}
                                        </div>
                                        <div>
                                            <Label htmlFor="upi-id">UPI ID (from KYC)</Label>
                                            <Input
                                                id="upi-id"
                                                value={upiId}
                                                readOnly
                                                className="bg-muted"
                                            />
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <DialogClose asChild>
                                            <Button variant="outline">Cancel</Button>
                                        </DialogClose>
                                        <Button onClick={handleWithdrawChips} disabled={isSubmitting}>
                                            {isSubmitting ? <Loader className="animate-spin" /> : 'Submit Request'}
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                             {isKycPending && <p className="text-xs text-destructive mt-2">KYC verification required to withdraw.</p>}
                             {!isKycPending && (appUser.wallet?.winnings || 0) < 300 && <p className="text-xs text-muted-foreground mt-2">Minimum withdrawal is ₹300.</p>}
                        </CardContent>
                    </Card>
                </div>

                 <Card>
                    <CardHeader>
                        <CardTitle className="text-center text-lg font-semibold text-red-600">Recent Battles</CardTitle>
                    </CardHeader>
                    <CardContent>
                       <ScrollArea className="h-72">
                         <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Opponent</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Result</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {games.map(game => {
                                    const opponent = game.player1.uid === user.uid ? game.player2 : game.player1;
                                    const isWinner = game.winner === user.uid;
                                    const result = game.status === 'completed' ? (isWinner ? 'Won' : 'Lost') : 'N/A';
                                    return (
                                        <TableRow key={game.id}>
                                            <TableCell>
                                                <div className="font-medium">{opponent?.displayName || 'N/A'}</div>
                                                <div className="text-xs text-muted-foreground">{new Date(game.createdAt?.toDate()).toLocaleDateString()}</div>
                                            </TableCell>
                                            <TableCell className="font-bold">
                                                ₹{game.amount}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={result === 'Won' ? 'default' : result === 'Lost' ? 'destructive' : 'secondary'}>
                                                    {result}
                                                </Badge>
                                            </TableCell>
                                            <TableCell><Badge variant="secondary">{game.status.replace(/_/g, ' ')}</Badge></TableCell>
                                        </TableRow>
                                    )
                                })}
                                {games.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center text-muted-foreground">No recent battles found.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                       </ScrollArea>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-center text-lg font-semibold text-red-600">Recent Transactions</CardTitle>
                    </CardHeader>
                    <CardContent>
                       <ScrollArea className="h-72">
                         <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {transactions.map(tx => (
                                    <TableRow key={tx.id}>
                                        <TableCell className="text-xs">{new Date(tx.createdAt?.toDate()).toLocaleString()}</TableCell>
                                        <TableCell className={`font-bold flex items-center gap-1 ${isCredit(tx.type) ? 'text-green-600' : 'text-red-600'}`}>
                                            {isCredit(tx.type) ? <TrendingUp size={14}/> : <TrendingDown size={14}/>}
                                            ₹{tx.amount.toFixed(2)}
                                        </TableCell>
                                        <TableCell><Badge variant="secondary">{tx.type.replace(/_/g, ' ')}</Badge></TableCell>
                                        <TableCell><Badge variant={getStatusBadgeVariant(tx.status)}>{tx.status}</Badge></TableCell>
                                    </TableRow>
                                ))}
                                {transactions.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center text-muted-foreground">No transactions yet.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                       </ScrollArea>
                    </CardContent>
                </Card>

                 {/* Spacer to prevent content from being hidden by the fixed bottom nav */}
                <div className="h-20 md:hidden" />
            </main>
        </div>
    );
}
