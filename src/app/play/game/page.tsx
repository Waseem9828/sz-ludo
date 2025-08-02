
'use client';

import Header from '@/components/play/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ChevronLeft, Info } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { useToast } from '@/hooks/use-toast';


const penalties = [
    { amount: '₹100', reason: 'Fraud / Fake Screenshot' },
    { amount: '₹50', reason: 'Wrong Update' },
    { amount: '₹50', reason: 'No Update' },
    { amount: '₹25', reason: 'Abusing' },
];

function GamePageComponent() {
    const searchParams = useSearchParams();
    const amount = searchParams.get('amount') || '50';
    const { toast } = useToast();

    const handleResultClick = (result: string) => {
        toast({
            title: `Game Result Submitted`,
            description: `You have declared that you ${result}. Your result is under review.`,
        });
    };

    const handleCancelClick = () => {
         toast({
            title: `Game Cancelled`,
            description: `You have cancelled the game.`,
            variant: 'destructive'
        });
    }

    return (
        <div className="flex flex-col min-h-screen bg-background font-body">
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
                            <Image src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEj87ucMyvvhf-gat6BSvABT1AQ0Jgo9VeN51TwF_iTZZk8j-PSlq2QTluQo7z1h70sI8CTAsPwe-UUfTiZG78qE4PcEPdm4ToEi1Q7Ei39Xo3TBYZbck2-xgEC5G7k2OWGOJQ22I3LQ82fHFILKGYEL9yP3ODdU-G_2Ho9TUOTGFEX6Xr8kFHNAnWEMy9c/s3264/74483.png" alt="vs" width={64} height={32} className="mx-auto" data-ai-hint="versus icon" />
                            <p className="font-bold text-green-600 mt-1">₹ {amount}</p>
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
                    <CardHeader className="py-3 bg-muted rounded-t-lg">
                        <CardTitle className="text-center text-md font-semibold text-muted-foreground">Room Code</CardTitle>
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
                     <CardHeader className="py-3 bg-muted rounded-t-lg">
                        <CardTitle className="text-center text-md font-semibold text-muted-foreground">Game Result</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-y-3">
                        <p className="text-center text-sm text-muted-foreground">After completion of your game, select the status of the game and post your screenshot below</p>
                        <Button onClick={() => handleResultClick('WON')} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3">I WON</Button>
                        <Button onClick={() => handleResultClick('LOST')} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3">I LOST</Button>
                        <Button onClick={handleCancelClick} variant="outline" className="w-full font-bold py-3">CANCEL</Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="py-3 bg-muted rounded-t-lg">
                        <CardTitle className="text-center text-md font-semibold text-muted-foreground">Penalty</CardTitle>
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
                                    <TableRow key={index} className={index % 2 === 0 ? 'bg-muted/50' : 'bg-card'}>
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


export default function GamePage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <GamePageComponent />
        </Suspense>
    )
}
