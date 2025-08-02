
'use client';

import React, { useState, useEffect } from 'react';
import Header from "@/components/play/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, AlertCircle, Loader } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';

export default function WalletPage() {
    const { toast } = useToast();
    const router = useRouter();
    const { user, loading } = useAuth();
    
    // TODO: Fetch balances from Firestore
    const [depositAmount, setDepositAmount] = useState(0);
    const [winningAmount, setWinningAmount] = useState(0);

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);


    const handleWithdrawChips = () => {
        if (winningAmount > 0) {
            // This would open a withdrawal form
            toast({
                title: "Withdrawal Request",
                description: `Your request to withdraw ₹${winningAmount} is being processed.`,
            });
            setWinningAmount(0); // Reset winnings after withdrawal
        } else {
            toast({
                title: "Withdrawal Failed",
                description: "You have no winnings to withdraw.",
                variant: "destructive",
            });
        }
    };
    
    if (loading || !user) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Loader className="h-16 w-16 animate-spin" />
            </div>
        );
    }

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

                <Card>
                    <CardHeader>
                        <CardTitle className="text-center text-lg font-semibold">Deposit Chips</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center space-y-4">
                        <div>
                            <p className="text-sm text-muted-foreground">Chips</p>
                            <p className="text-2xl font-bold">₹{depositAmount}</p>
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
                        <CardTitle className="text-center text-lg font-semibold">Winning Chips</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center space-y-4">
                        <div>
                            <p className="text-sm text-muted-foreground">Chips</p>
                            <p className="text-2xl font-bold">₹{winningAmount}</p>
                        </div>
                         <Button onClick={handleWithdrawChips} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold text-lg py-6">
                            Withdraw
                        </Button>
                    </CardContent>
                </Card>

            </main>
        </div>
    );
}
