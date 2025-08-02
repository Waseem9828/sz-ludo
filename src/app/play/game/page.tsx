
'use client';

import Header from '@/components/play/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ChevronLeft, Info, Upload, PartyPopper, Frown } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ResultDialog } from '@/components/play/result-dialog';


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
    const [selectedResult, setSelectedResult] = useState<string | null>(null);
    const [screenshot, setScreenshot] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isResultDialogOpen, setIsResultDialogOpen] = useState(false);
    const [resultDialogProps, setResultDialogProps] = useState({
        variant: 'won' as 'won' | 'lost',
        title: '',
        description: '',
    });


    const handleResultClick = (result: string) => {
        setSelectedResult(result);
        if (result === 'LOST' || result === 'CANCEL') {
            handleSubmit(result, null);
        }
    };
    
    const handleSubmit = (result: string | null, file: File | null) => {
        if (!result) return;

        if (result === 'WON' && !file) {
            toast({
                title: `Screenshot Required`,
                description: `Please upload a screenshot to declare you won.`,
                variant: 'destructive',
            });
            return;
        }

        console.log({ result, screenshot: file?.name });
        
        if (result === 'WON') {
             setResultDialogProps({
                variant: 'won',
                title: 'Congratulations!',
                description: `You won ₹${amount}! Your result is under review.`,
            });
        } else if (result === 'LOST') {
            setResultDialogProps({
                variant: 'lost',
                title: 'Better Luck Next Time!',
                description: 'You have declared that you lost the game.',
            });
        }
        
        if(result === 'WON' || result === 'LOST') {
            setIsResultDialogOpen(true);
        }

        if (result === 'CANCEL') {
            toast({
                title: 'Game Cancelled',
                description: 'Your cancellation request has been submitted.'
            });
        }

        // Reset state
        setSelectedResult(null);
        setScreenshot(null);
        if(fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }


    return (
        <>
        <ResultDialog
            isOpen={isResultDialogOpen}
            setIsOpen={setIsResultDialogOpen}
            variant={resultDialogProps.variant}
            title={resultDialogProps.title}
            description={resultDialogProps.description}
        />
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
                        <CardTitle className="text-center text-md font-semibold text-red-600">Room Code</CardTitle>
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
                        <CardTitle className="text-center text-md font-semibold text-red-600">Game Result</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-y-3">
                        <p className="text-center text-sm text-muted-foreground">After completion of your game, select the status of the game and post your screenshot below</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                             <Button onClick={() => handleResultClick('WON')} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3">I WON</Button>
                             <Button onClick={() => handleResultClick('LOST')} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3">I LOST</Button>
                             <Button onClick={() => handleResultClick('CANCEL')} variant="outline" className="w-full font-bold py-3 md:col-span-1">CANCEL</Button>
                        </div>

                       {selectedResult === 'WON' && (
                            <div className="p-4 border-2 border-dashed rounded-lg space-y-4">
                               <Label htmlFor="screenshot" className="text-center block font-semibold text-primary">Upload Winning Screenshot</Label>
                                <Input
                                    id="screenshot"
                                    type="file"
                                    accept="image/*"
                                    ref={fileInputRef}
                                    onChange={(e) => setScreenshot(e.target.files ? e.target.files[0] : null)}
                                    className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                                />
                                {screenshot && <p className="text-sm text-center text-muted-foreground">Selected: {screenshot.name}</p>}
                                <Button onClick={() => handleSubmit('WON', screenshot)} className="w-full" disabled={!screenshot}>
                                    <Upload className="mr-2 h-4 w-4" />
                                    Submit Result
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="py-3 bg-muted rounded-t-lg">
                        <CardTitle className="text-center text-md font-semibold text-red-600">Penalty</CardTitle>
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
        </>
    );
}


export default function GamePage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <GamePageComponent />
        </Suspense>
    )
}
