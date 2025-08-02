
'use client';

import React, { useState, useEffect } from 'react';
import Header from "@/components/play/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChevronLeft, AlertCircle } from "lucide-react";
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
import { updateUserWallet } from '@/lib/firebase/users';


export default function WalletPage() {
    const { toast } = useToast();
    const router = useRouter();
    const { user, appUser, loading } = useAuth();
    const [isWithdrawDialogOpen, setIsWithdrawDialogOpen] = useState(false);
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [upiId, setUpiId] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
        if (!loading && appUser && appUser.upiId) {
            setUpiId(appUser.upiId);
        }
    }, [user, appUser, loading, router]);


    const handleWithdrawChips = async () => {
        if (!user || !appUser) return;
        const amount = parseFloat(withdrawAmount);
        
        if (isNaN(amount) || amount <= 0) {
            toast({ title: "Invalid Amount", description: "Please enter a valid amount to withdraw.", variant: "destructive" });
            return;
        }

        if (amount > (appUser.wallet?.winnings || 0)) {
            toast({ title: "Insufficient Winnings", description: "You cannot withdraw more than your winning balance.", variant: "destructive" });
            return;
        }

        if (!upiId) {
            toast({ title: "UPI ID Required", description: "Please enter your UPI ID.", variant: "destructive" });
            return;
        }

        setIsSubmitting(true);
        try {
            // Deduct from winning wallet immediately
            await updateUserWallet(user.uid, -amount, 'winnings');

            // Create withdrawal request for admin to process
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
            // If request fails, refund the winnings
            await updateUserWallet(user.uid, amount, 'winnings');
            toast({ title: "Withdrawal Failed", description: error.message, variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    if (loading || !user || !appUser) {
        return <SplashScreen />;
    }

    const totalBalance = (appUser.wallet?.balance || 0) + (appUser.wallet?.winnings || 0);
    const isKycPending = !appUser.kycStatus || appUser.kycStatus === 'Pending' || appUser.kycStatus === 'Rejected';

    return (
        <div className="flex flex-col min-h-screen bg-background font-body">
            <Header />
            <main className="flex-grow container mx-auto px-4 py-6 space-y-6">
                <div className="flex justify-between items-center">
                    <Link href="/">
                        <Button variant="outline">
                            <ChevronLeft className="mr-2 h-4 w-4" />
                            Back
                        </Button>
                    </Link>
                    <Button variant="outline">Wallet History</Button>
                </div>

                <Card>
                    <CardHeader className="text-center">
                        <CardDescription>Total Balance</CardDescription>
                        <CardTitle className="text-4xl font-bold">₹{totalBalance.toFixed(2)}</CardTitle>
                    </CardHeader>
                </Card>

                {isKycPending && (
                    <Card className="bg-destructive/10 border-destructive/50">
                        <CardContent className="p-3 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <AlertCircle className="h-5 w-5 text-destructive" />
                                <span className="font-semibold text-destructive">KYC Pending</span>
                            </div>
                            <Link href="/kyc">
                                <Button variant="destructive" size="sm">Complete Here</Button>
                            </Link>
                        </CardContent>
                    </Card>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle className="text-center text-lg font-semibold text-red-600">Deposit Chips</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center space-y-4">
                        <div>
                            <p className="text-sm text-muted-foreground">Available for Gameplay</p>
                            <p className="text-2xl font-bold">₹{(appUser.wallet?.balance || 0).toFixed(2)}</p>
                        </div>
                        <Link href="/wallet/add-cash">
                            <Button className="w-full bg-primary hover:bg-primary/90 font-bold text-lg py-6">
                                Add Cash
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardHeader>
                        <CardTitle className="text-center text-lg font-semibold text-red-600">Winning Chips</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center space-y-4">
                        <div>
                            <p className="text-sm text-muted-foreground">Withdrawable Balance</p>
                            <p className="text-2xl font-bold">₹{(appUser.wallet?.winnings || 0).toFixed(2)}</p>
                        </div>
                        <Dialog open={isWithdrawDialogOpen} onOpenChange={setIsWithdrawDialogOpen}>
                            <DialogTrigger asChild>
                                 <Button className="w-full bg-green-600 hover:bg-green-700 text-white font-bold text-lg py-6" disabled={isKycPending || (appUser.wallet?.winnings || 0) <= 0}>
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
                                        <Label htmlFor="withdraw-amount">Amount</Label>
                                        <Input
                                            id="withdraw-amount"
                                            type="number"
                                            value={withdrawAmount}
                                            onChange={(e) => setWithdrawAmount(e.target.value)}
                                            placeholder="Enter amount"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="upi-id">UPI ID</Label>
                                        <Input
                                            id="upi-id"
                                            value={upiId}
                                            onChange={(e) => setUpiId(e.target.value)}
                                            placeholder="Enter your UPI ID"
                                        />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <DialogClose asChild>
                                        <Button variant="outline">Cancel</Button>
                                    </DialogClose>
                                    <Button onClick={handleWithdrawChips} disabled={isSubmitting}>
                                        {isSubmitting ? 'Submitting...' : 'Submit Request'}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </CardContent>
                </Card>

            </main>
        </div>
    );
}
