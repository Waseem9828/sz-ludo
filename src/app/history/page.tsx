
'use client';

import React, { useState, useEffect } from 'react';
import Header from "@/components/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader, Gamepad2, Trophy, Users, TrendingUp, TrendingDown, Swords, Landmark } from "lucide-react";
import Link from "next/link";
import { useAuth } from '@/context/auth-context';
import { SplashScreen } from '@/components/ui/splash-screen';
import { Transaction, TransactionType, listenForUserTransactions } from '@/lib/firebase/transactions';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Game, listenForUserGames } from '@/lib/firebase/games';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Image from 'next/image';

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
    const creditTypes: TransactionType[] = ['deposit', 'winnings', 'Admin Credit', 'refund', 'Referral Earning'];
    return creditTypes.includes(type);
}

export default function HistoryPage() {
    const { user, loading } = useAuth();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [games, setGames] = useState<Game[]>([]);
    const [dataLoading, setDataLoading] = useState(true);

    useEffect(() => {
        if (user) {
            const unsubscribeTransactions = listenForUserTransactions(user.uid, (data) => {
                setTransactions(data);
                if(dataLoading) setDataLoading(false);
            });
            const unsubscribeGames = listenForUserGames(user.uid, 50, (data) => {
                setGames(data);
                 if(dataLoading) setDataLoading(false);
            });
            return () => {
                unsubscribeTransactions();
                unsubscribeGames();
            };
        }
    }, [user, dataLoading]);

    if (loading || dataLoading) {
        return <SplashScreen />;
    }

    return (
        <div className="flex flex-col min-h-screen bg-background font-body">
            <Header />
            <main className="flex-grow container mx-auto px-4 py-6 space-y-6">
                <div className="text-center">
                    <h1 className="text-3xl font-bold font-headline">My History</h1>
                    <p className="text-muted-foreground">A record of your battles and transactions.</p>
                </div>

                <Tabs defaultValue="battles" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="battles"><Swords className="mr-2" />Battle History</TabsTrigger>
                        <TabsTrigger value="transactions"><Landmark className="mr-2" />Transaction History</TabsTrigger>
                    </TabsList>
                    <TabsContent value="battles">
                         <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Recent Battles</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ScrollArea className="h-96">
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
                                            const opponent = game.player1.uid === user?.uid ? game.player2 : game.player1;
                                            const isWinner = game.winner === user?.uid;
                                            const result = game.status === 'completed' ? (isWinner ? 'Won' : 'Lost') : 'N/A';
                                            return (
                                                <TableRow key={game.id}>
                                                    <TableCell>
                                                        <div className="font-medium">{opponent?.displayName || 'N/A'}</div>
                                                        <div className="text-xs text-muted-foreground">{new Date(game.createdAt?.toDate()).toLocaleDateString()}</div>
                                                    </TableCell>
                                                    <TableCell className="font-bold font-sans">
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
                    </TabsContent>
                    <TabsContent value="transactions">
                         <Card>
                             <CardHeader>
                                <CardTitle className="text-lg">Recent Transactions</CardTitle>
                            </CardHeader>
                            <CardContent>
                            <ScrollArea className="h-96">
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
                                                <TableCell className={`font-bold flex items-center gap-1 ${isCredit(tx.type) ? 'text-success' : 'text-destructive'}`}>
                                                    {isCredit(tx.type) ? <TrendingUp size={14}/> : <TrendingDown size={14}/>}
                                                    <span className="font-sans">₹{tx.amount.toFixed(2)}</span>
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
                    </TabsContent>
                </Tabs>


                <div className="h-20 md:hidden" />
            </main>
        </div>
    );
}
