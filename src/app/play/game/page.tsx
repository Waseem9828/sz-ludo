
'use client';

import Header from '@/components/play/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ChevronLeft, Info, Upload, Loader, Send, Copy } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useState, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ResultDialog } from '@/components/play/result-dialog';
import { useAuth } from '@/context/auth-context';
import { Game, listenForGameUpdates, updateGameStatus, submitGameResult, updateGameRoomCode } from '@/lib/firebase/games';
import { SplashScreen } from '@/components/ui/splash-screen';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const penalties = [
    { amount: '₹100', reason: 'Fraud / Fake Screenshot' },
    { amount: '₹50', reason: 'Wrong Update' },
    { amount: '₹50', reason: 'No Update' },
    { amount: '₹25', reason: 'Abusing' },
];

function GamePageComponent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const gameId = searchParams.get('id');
    const { toast } = useToast();
    const { user, appUser } = useAuth();

    const [game, setGame] = useState<Game | null>(null);
    const [loading, setLoading] = useState(true);
    const [roomCode, setRoomCode] = useState('');
    const [selectedResult, setSelectedResult] = useState<string | null>(null);
    const [screenshot, setScreenshot] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [isResultDialogOpen, setIsResultDialogOpen] = useState(false);
    const [resultDialogProps, setResultDialogProps] = useState({
        variant: 'won' as 'won' | 'lost',
        title: '',
        description: '',
    });

    useEffect(() => {
        if (!gameId || !user) {
            if (!loading) router.push('/play');
            return;
        }

        const unsubscribe = listenForGameUpdates(gameId, (gameData) => {
            if (gameData) {
                // Check if user is part of the game
                const isPlayer = gameData.player1.uid === user.uid || gameData.player2?.uid === user.uid;
                if (!isPlayer) {
                    toast({ title: 'Error', description: 'You are not part of this game.', variant: 'destructive' });
                    router.push('/play');
                } else {
                    setGame(gameData);
                }
            } else {
                toast({ title: 'Error', description: 'Game not found.', variant: 'destructive' });
                router.push('/play');
            }
            setLoading(false);
        });

        return () => unsubscribe();

    }, [gameId, router, toast, user, loading]);

    const handleRoomCodeSubmit = async () => {
        if (!game || !roomCode) return;
        setIsSubmitting(true);
        try {
            await updateGameRoomCode(game.id, roomCode);
            toast({ title: 'Room Code Submitted', description: 'The room code has been shared with the opponent.' });
        } catch (err: any) {
            toast({ title: 'Error', description: err.message, variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleResultClick = async (result: 'WON' | 'LOST' | 'CANCEL') => {
        if (!game || !user) return;
        setSelectedResult(result);

        if (result === 'LOST' || result === 'CANCEL') {
            setIsSubmitting(true);
            try {
                const status = result === 'LOST' ? 'completed' : 'cancelled';
                // If I lost, the other player won
                const winnerId = result === 'LOST' ? (game.player1.uid === user.uid ? game.player2?.uid : game.player1.uid) : null;
                
                await updateGameStatus(game.id, status, winnerId || undefined);

                if (result === 'LOST') {
                    setResultDialogProps({
                        variant: 'lost',
                        title: 'Better Luck Next Time!',
                        description: 'You have declared that you lost the game.',
                    });
                    setIsResultDialogOpen(true);
                } else {
                     toast({ title: 'Game Cancelled', description: 'Your cancellation request has been submitted.' });
                     router.push('/play');
                }

            } catch (err: any) {
                toast({ title: 'Error', description: err.message, variant: 'destructive' });
            } finally {
                setIsSubmitting(false);
            }
        }
    };
    
    const handleSubmitWin = async () => {
        if (!game || !user || !screenshot) {
            toast({ title: `Screenshot Required`, description: `Please upload a screenshot to declare you won.`, variant: 'destructive'});
            return;
        }
        
        setIsSubmitting(true);
        try {
            await submitGameResult(game.id, user.uid, screenshot);
            setResultDialogProps({
                variant: 'won',
                title: 'Congratulations!',
                description: `You won ₹${game.amount}! Your result is under review.`,
            });
            setIsResultDialogOpen(true);

             // Reset state
            setSelectedResult(null);
            setScreenshot(null);
            if(fileInputRef.current) {
                fileInputRef.current.value = '';
            }

        } catch (err: any) {
            toast({ title: 'Submission Failed', description: err.message, variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    }

    const handleCopyRoomCode = () => {
        if (!game?.roomCode) return;
        navigator.clipboard.writeText(game.roomCode);
        toast({ title: 'Copied!', description: 'Room code copied to clipboard.' });
    };
    
    if (loading || !game || !appUser) {
        return <SplashScreen />;
    }

    const opponent = game.player1.uid === appUser.uid ? game.player2 : game.player1;
    const isHost = game.createdBy.uid === appUser.uid;

    const renderRoomCodeSection = () => {
        // Case 1: Room code exists, show it to both players
        if (game.roomCode) {
            return (
                 <Card>
                    <CardHeader className="py-3 bg-muted rounded-t-lg">
                        <CardTitle className="text-center text-md font-semibold text-red-600">Room Code</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 text-center space-y-4">
                        <div className="flex items-center justify-center gap-2">
                            <p className="text-4xl font-bold tracking-widest">{game.roomCode}</p>
                            <Button size="icon" variant="ghost" onClick={handleCopyRoomCode}>
                                <Copy className="h-6 w-6"/>
                            </Button>
                        </div>
                        <a href="https://play.google.com/store/apps/details?id=com.ludo.king" target="_blank" rel="noopener noreferrer">
                            <Button className="w-full bg-gray-700 hover:bg-gray-800 text-white">
                                <Image src="/ludo_king.png" alt="Ludo King" width={20} height={20} className="mr-2" data-ai-hint="ludo icon" />
                                Open Ludo King
                            </Button>
                        </a>
                    </CardContent>
                </Card>
            );
        }

        // Case 2: No room code, current user is the host -> show input
        if (!game.roomCode && isHost) {
            return (
                 <Card>
                    <CardHeader className="py-3 bg-muted rounded-t-lg">
                        <CardTitle className="text-center text-md font-semibold text-red-600">Enter Room Code</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-y-2">
                        <Label htmlFor="room-code-input">Share Ludo King Room Code</Label>
                        <div className="flex items-center gap-2">
                            <Input 
                                id="room-code-input"
                                value={roomCode}
                                onChange={(e) => setRoomCode(e.target.value)}
                                placeholder="Enter your room code"
                                disabled={isSubmitting}
                            />
                            <Button onClick={handleRoomCodeSubmit} disabled={isSubmitting || !roomCode} size="icon">
                                {isSubmitting ? <Loader className="animate-spin" /> : <Send />}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            );
        }

        // Case 3: No room code, current user is the opponent -> show waiting message
        if (!game.roomCode && !isHost) {
             return (
                 <Card>
                    <CardHeader className="py-3 bg-muted rounded-t-lg">
                        <CardTitle className="text-center text-md font-semibold text-red-600">Room Code</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 text-center">
                       <Alert>
                           <Loader className="h-4 w-4 animate-spin" />
                           <AlertTitle>Waiting for Host</AlertTitle>
                           <AlertDescription>
                               Waiting for {game.createdBy.displayName} to share the Room Code. The page will update automatically.
                           </AlertDescription>
                       </Alert>
                    </CardContent>
                </Card>
             )
        }
        
        return null;
    }


    return (
        <>
        <ResultDialog
            isOpen={isResultDialogOpen}
            setIsOpen={setIsResultDialogOpen}
            variant={resultDialogProps.variant}
            title={resultDialogProps.title}
            description={resultDialogProps.description}
            onClose={() => router.push('/play')}
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
                                <AvatarImage src={appUser.photoURL || `https://placehold.co/40x40.png`} alt={appUser.displayName || 'You'} data-ai-hint="avatar person" />
                                <AvatarFallback>{appUser.displayName?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span className="font-semibold">{appUser.displayName}</span>
                        </div>
                        <div className="text-center">
                            <Image src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEilS2_YhPAJBDjdcIRsoMJLTWafsJuIyola3KN50zXQAZYWSSIbhLhWhOJGMG6UYkUB5ZOiVKgsy2bVstr2af0LVf2g-eWjXHnGO4Z0IbaePP4E7TSDB9x_eK8OqTidX968zc5Wn9p6uGlkLoD9iglU3KZ28_2IbXgl29zHTZgwxzMWPvbN6zhA5AhyH7s/s1600/74920.png" alt="vs" width={64} height={32} className="mx-auto" data-ai-hint="versus icon" />
                            <p className="font-bold text-green-600 mt-1">₹ {game.amount}</p>
                        </div>
                        <div className="flex items-center gap-2">
                             <span className="font-semibold">{opponent?.displayName}</span>
                            <Avatar className="h-10 w-10">
                                <AvatarImage src={opponent?.photoURL || 'https://placehold.co/40x40.png'} alt={opponent?.displayName || 'Opponent'} data-ai-hint="avatar person" />
                                <AvatarFallback>{opponent?.displayName?.charAt(0)}</AvatarFallback>
                            </Avatar>
                        </div>
                    </CardContent>
                </Card>

                {game.status === 'ongoing' && renderRoomCodeSection()}


                {game.roomCode && game.status === 'ongoing' && (
                     <Card>
                         <CardHeader className="py-3 bg-muted rounded-t-lg">
                            <CardTitle className="text-center text-md font-semibold text-red-600">Game Result</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 space-y-3">
                            <p className="text-center text-sm text-muted-foreground">After completion of your game, select the status of the game and post your screenshot below</p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                 <Button onClick={() => handleResultClick('WON')} disabled={isSubmitting} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3">I WON</Button>
                                 <Button onClick={() => handleResultClick('LOST')} disabled={isSubmitting} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3">I LOST</Button>
                                 <Button onClick={() => handleResultClick('CANCEL')} disabled={isSubmitting} variant="outline" className="w-full font-bold py-3 md:col-span-1">CANCEL</Button>
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
                                        disabled={isSubmitting}
                                    />
                                    {screenshot && <p className="text-sm text-center text-muted-foreground">Selected: {screenshot.name}</p>}
                                    <Button onClick={handleSubmitWin} className="w-full" disabled={!screenshot || isSubmitting}>
                                        {isSubmitting ? <Loader className="animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                                        Submit Result
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}
                
                 {game.status !== 'ongoing' && game.status !== 'challenge' && (
                    <Card>
                        <CardHeader>
                             <CardTitle className="text-center text-lg font-semibold text-red-600">Game Over</CardTitle>
                        </CardHeader>
                        <CardContent className="text-center">
                            <p className="text-muted-foreground">This game is <span className="font-bold">{game.status.replace('_', ' ')}</span>.</p>
                             <p className="text-sm mt-2">The result is under review by the admin.</p>
                             <Link href="/play">
                                <Button variant="outline" className="mt-4">Back to Lobby</Button>
                             </Link>
                        </CardContent>
                    </Card>
                )}


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
        <Suspense fallback={<SplashScreen />}>
            <GamePageComponent />
        </Suspense>
    )
}

    