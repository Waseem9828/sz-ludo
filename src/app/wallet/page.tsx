
'use client';

import React, { useState } from 'react';
import Header from "@/components/play/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';

export default function WalletPage() {
    const { toast } = useToast();
    const router = useRouter();
    const [depositAmount, setDepositAmount] = useState(0);
    const [winningAmount, setWinningAmount] = useState(0);

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

    return (
        <div className="flex flex-col min-h-screen bg-gray-100 font-body">
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

                <Card className="bg-red-100 border-red-300">
                    <CardContent className="p-3 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <AlertCircle className="h-5 w-5 text-red-600" />
                            <span className="font-semibold text-red-800">KYC Pending</span>
                        </div>
                        <Link href="/kyc">
                            <Button variant="destructive" size="sm">Complete Here</Button>
                        </Link>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-center text-lg font-semibold text-gray-700">Deposit Chips</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center space-y-4">
                        <div>
                            <p className="text-sm text-muted-foreground">Chips</p>
                            <p className="text-2xl font-bold">₹{depositAmount}</p>
                        </div>
                        <Link href="/wallet/add-cash">
                            <Button className="w-full bg-gray-800 hover:bg-gray-900 text-white font-bold text-lg py-6">
                                Add Cash
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardHeader>
                        <CardTitle className="text-center text-lg font-semibold text-gray-700">Winning Chips</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center space-y-4">
                        <div>
                            <p className="text-sm text-muted-foreground">Chips</p>
                            <p className="text-2xl font-bold">₹{winningAmount}</p>
                        </div>
                         <Button onClick={handleWithdrawChips} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-lg py-6">
                            Withdraw
                        </Button>
                    </CardContent>
                </Card>

            </main>
        </div>
    );
}
