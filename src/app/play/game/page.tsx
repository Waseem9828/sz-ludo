
'use client';

import Header from '@/components/play/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ChevronLeft, Info } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

const penalties = [
    { amount: '₹100', reason: 'Fraud / Fake Screenshot' },
    { amount: '₹50', reason: 'Wrong Update' },
    { amount: '₹50', reason: 'No Update' },
    { amount: '₹25', reason: 'Abusing' },
];

export default function GamePage() {
    return (
        <div className="flex flex-col min-h-screen bg-gray-100 font-body">
            <Header />
            <main className="flex-grow container mx-auto px-4 py-6 space-y-6">
                <div className="flex justify-between items-center">
                    <Link href="/play">
                        <Button variant="outline" className="bg-primary text-primary-foreground hover:bg-primary/90">
                            <ChevronLeft className="mr-2 h-4 w-4" />
                            Back
                        </Button>
                    </Link>
                    <Button variant="outline" className="border-red-500 text-red-500 hover:bg-red-50 hover:text-red-600">
                        <Info className="mr-2 h-4 w-4" />
                        Rules
                    </Button>
                </div>

                <Card>
                    <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Avatar className="h-10 w-10">
                                <AvatarImage src="https://placehold.co/40x40.png" alt="NSXKW..." data-ai-hint="avatar person" />
                                <AvatarFallback>NS</AvatarFallback>
                            </Avatar>
                            <span className="font-semibold">NSXKW...</span>
                        </div>
                        <div className="text-center">
                            <Image src="/vs.png" alt="vs" width={24} height={24} className="mx-auto" />
                            <p className="font-bold text-green-600 mt-1">₹ 50</p>
                        </div>
                        <div className="flex items-center gap-2">
                             <span className="font-semibold">KlwzB...</span>
                            <Avatar className="h-10 w-10">
                                <AvatarImage src="https://placehold.co/40x40.png" alt="KlwzB..." data-ai-hint="avatar person" />
                                <AvatarFallback>KL</AvatarFallback>
                            </Avatar>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="py-3 bg-gray-50 rounded-t-lg">
                        <CardTitle className="text-center text-md font-semibold text-gray-600">Room Code</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 text-center">
                        <p className="text-4xl font-bold tracking-widest my-4">01063482</p>
                        <Button className="w-full bg-gray-700 hover:bg-gray-800 text-white">
                             <Image src="/ludo_king.png" alt="Ludo King" width={20} height={20} className="mr-2" />
                            Play
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                     <CardHeader className="py-3 bg-gray-50 rounded-t-lg">
                        <CardTitle className="text-center text-md font-semibold text-gray-600">Game Result</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-y-3">
                        <p className="text-center text-sm text-muted-foreground">After completion of your game, select the status of the game and post your screenshot below</p>
                        <Button className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3">I WON</Button>
                        <Button className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3">I LOST</Button>
                        <Button variant="outline" className="w-full font-bold py-3">CANCEL</Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="py-3 bg-gray-50 rounded-t-lg">
                        <CardTitle className="text-center text-md font-semibold text-gray-600">Penalty</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="font-bold text-foreground">Amount</TableHead>
                                    <TableHead className="font-bold text-foreground">Reason</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {penalties.map((penalty, index) => (
                                    <TableRow key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                                        <TableCell className="font-medium">{penalty.amount}</TableCell>
                                        <TableCell>{penalty.reason}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
