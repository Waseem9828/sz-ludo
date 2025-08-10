

'use client';

import Header from '@/components/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ChevronLeft, Info, Upload, Loader, Send, Copy, Clock, Hash, AlertTriangle, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/auth-context';
import { Game, listenForGameUpdates, submitPlayerResult, updateGameRoomCode } from '@/lib/firebase/games';
import { SplashScreen } from '@/components/ui/splash-screen';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { add, format } from 'date-fns';
import { ResultDialog } from '@/components/play/result-dialog';
import { hasJoinedLiveTournament } from '@/lib/firebase/tournaments';

const penalties = [
    { amount: '₹100', reason: 'Fraud / Fake Screenshot' },
    { amount: '₹50', reason: 'Wrong Update' },
    { amount: '₹50', reason: 'No update after 2 hours' },
    { amount: '₹25', reason: 'Abusing' },
];

const defaultAvatar = "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEi_h6LUuqTTKYsn5TfUZwkI6Aib6Y0tOzQzcoZKstURqxyl-PJXW1DKTkF2cPPNNUbP3iuDNsOBVOYx7p-ZwrodI5w9fyqEwoabj8rU0mLzSbT5GCFUKpfCc4s_LrtHcWFDvvRstCghAfQi5Zfv2fipdZG8h4dU4vGt-eFRn-gS3QTg6_JJKhv0Yysr_ZY/s1600/82126.png";

function GamePageComponent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const gameId = searchParams.get('id');
    const { toast } = useToast();
    const { user, appUser } = useAuth();

    const [game, setGame] = useState<Game | null>(null);
    const [loading, setLoading] = useState(true);
    const [roomCode, setRoomCode] = useState('');
    const [screenshot, setScreenshot] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // State for the result dialog
    const [isResultDialogOpen, setIsResultDialogOpen] = useState(false);
    const [resultDialogData, setResultDialogData] = useState({ variant: 'won', title: '', description: '', points: 0, showTournamentPrompt: false });

    const [hasJoinedTournament, setHasJoinedTournament] = useState(false);

    useEffect(() => {
        if (user?.uid) {
            hasJoinedLiveTournament(user.uid).then(setHasJoinedTournament);
        }
    }, [user?.uid]);
    
    const showResultDialog = useCallback((variant: 'won' | 'lost', points: number) => {
        const isWinner = variant === 'won';
        if (hasJoinedTournament) {
            setResultDialogData({
                variant,
                title: isWinner ? 'Congratulations, You Won!' : 'Better Luck Next Time!',
                description: `You've earned ${points} points for this game. Keep playing to climb the tournament leaderboard!`,
                points: points,
                showTournamentPrompt: false,
            });
        } else {
             setResultDialogData({
                variant,
                title: isWinner ? 'Congratulations, You Won!' : 'Better Luck Next Time!',
                description: `You just missed out on ${points} tournament points! Join a tournament to start ranking up.`,
                points: points,
                showTournamentPrompt: true,
            });
        }
        setIsResultDialogOpen(true);
    }, [hasJoinedTournament]);
    
    useEffect(() => {
        if (!gameId || !user) {
            if (!loading) router.push('/play');
            return;
        }

        const unsubscribe = listenForGameUpdates(gameId, (gameData) => {
            if (gameData) {
                const isPlayer = gameData.player1.uid === user.uid || gameData.player2?.uid === user.uid;
                if (!isPlayer) {
                    toast({ title: 'Error', description: 'You are not part of this game.', variant: 'destructive' });
                    router.push('/play');
                } else {
                    // Check if the game status has just changed to show the dialog
                    const oldStatus = game?.status;
                    const newStatus = gameData.status;
                    
                    if (oldStatus === 'under_review' && (newStatus === 'completed' || newStatus === 'cancelled' || newStatus === 'disputed')) {
                        if (gameData.winner === user.uid) {
                           showResultDialog('won', gameData.amount);
                        } else if (gameData.loser === user.uid) {
                           showResultDialog('lost', gameData.amount);
                        }
                    }
                    setGame(gameData);
                }
            } else {
                toast({ title: 'Error', description: 'Game not found.', variant: 'destructive' });
                router.push('/play');
            }
            setLoading(false);
        });

        return () => unsubscribe();

    }, [gameId, router, toast, user, loading, game?.status, showResultDialog]);

    const gameDetails = useMemo(() => {
        if (!game || !game.createdAt) return null;
        const createdAtDate = game.createdAt.toDate();
        const updateDeadlineDate = add(createdAtDate, { hours: 2 });
        return {
            id: game.id,
            createdAt: format(createdAtDate, 'PPpp'),
            updateDeadline: format(updateDeadlineDate, 'PPpp')
        }
    }, [game]);

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
    
    const handleResultSubmit = async (result: 'WON' | 'LOST' | 'CANCEL') => {
        if (!game || !user) return;
        
        let screenshotFile: File | undefined = undefined;
        if (result === 'WON') {
            if (!screenshot) {
                toast({ title: `Screenshot Required`, description: `Please upload a screenshot to declare you won.`, variant: 'destructive'});
                return;
            }
            screenshotFile = screenshot;
        }
        
        setIsSubmitting(true);
        try {
            await submitPlayerResult(game.id, user.uid, result, screenshotFile);
            toast({title: 'Result Submitted', description: 'Waiting for opponent to submit their result.'});
            
            // Reset local state after submission
            setScreenshot(null);
            if (fileInputRef.current) fileInputRef.current.value = '';

        } catch (err: any) {
            toast({ title: 'Submission Failed', description: err.message, variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    };


    const handleCopyRoomCode = () => {
        if (!game?.roomCode) return;
        navigator.clipboard.writeText(game.roomCode);
        toast({ title: 'Copied!', description: 'Room code copied to clipboard.' });
    };
    
    if (loading || !game || !appUser || !gameDetails) {
        return <SplashScreen />;
    }

    const opponent = game.player1.uid === appUser.uid ? game.player2 : game.player1;
    const isHost = game.createdBy.uid === appUser.uid;
    const myResult = game.player1.uid === appUser.uid ? game.player1_result : game.player2_result;
    
    const renderRoomCodeSection = () => {
        if (game.roomCode) {
            return (
                 <Card>
                    <CardHeader className="py-3 bg-muted rounded-t-lg">
                        <CardTitle className="text-center text-md font-semibold text-primary">Room Code</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 text-center space-y-4">
                        <div className="flex items-center justify-center gap-2">
                            <p className="text-4xl font-bold tracking-widest">{game.roomCode}</p>
                            <Button size="icon" variant="ghost" onClick={handleCopyRoomCode}>
                                <Copy className="h-6 w-6"/>
                            </Button>
                        </div>
                        <a href="https://play.google.com/store/apps/details?id=com.ludo.king" target="_blank" rel="noopener noreferrer" className="inline-block">
                            <Image 
                                src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgoZZmcBoW0TCUW_GBV0y6geNF5cxhpZX1dzBSwgve-9WoDxPBmOYnQGHtzf48FRyNwKH0U0Yd_qHiHhldRdbLY5IWLu7llJsdAfC9L2nh_rjOYHDfCh0AcMltEKWfn5fin1TY5NfKL-RXC5qcR81Xdix4BTJO42BY8edSIkmUP5lNKTOgzAeowrsx8LVc/s180/76984.webp"
                                alt="Open Ludo King" 
                                width={180}
                                height={54}
                                className="mx-auto"
                                data-ai-hint="ludo king button"
                            />
                        </a>
                    </CardContent>
                </Card>
            );
        }

        if (!game.roomCode && isHost) {
            return (
                 <Card>
                    <CardHeader className="py-3 bg-muted rounded-t-lg">
                        <CardTitle className="text-center text-md font-semibold text-primary">Enter Room Code</CardTitle>
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

        if (!game.roomCode && !isHost) {
             return (
                 <Card>
                    <CardHeader className="py-3 bg-muted rounded-t-lg">
                        <CardTitle className="text-center text-md font-semibold text-primary">Room Code</CardTitle>
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

    const renderResultSection = () => {
        if (myResult) {
            return (
                <Card>
                    <CardHeader className="py-3 bg-muted rounded-t-lg">
                        <CardTitle className="text-center text-md font-semibold text-green-600">Result Submitted</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 text-center space-y-2">
                        <CheckCircle className="h-10 w-10 mx-auto text-green-500"/>
                        <p>You submitted: <span className="font-bold">{myResult}</span></p>
                        <p className="text-muted-foreground text-sm">Waiting for opponent to submit their result...</p>
                    </CardContent>
                </Card>
            )
        }
        
        return (
            <Card>
                <CardHeader className="py-3 bg-muted rounded-t-lg">
                    <CardTitle className="text-center text-md font-semibold text-primary">Game Result</CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                    <p className="text-center text-sm text-muted-foreground">After your game is complete, select the outcome and submit your result.</p>
                    
                    <div className="p-4 border-2 border-dashed rounded-lg space-y-4">
                        <Label htmlFor="screenshot" className="text-center block font-semibold text-primary">Upload Winning Screenshot (Required if you WON)</Label>
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
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        <Button onClick={() => handleResultSubmit('WON')} disabled={isSubmitting || !screenshot} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3">I WON</Button>
                        <Button onClick={() => handleResultSubmit('LOST')} disabled={isSubmitting} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3">I LOST</Button>
                        <Button onClick={() => handleResultSubmit('CANCEL')} disabled={isSubmitting} variant="outline" className="w-full font-bold py-3 md:col-span-1">CANCEL</Button>
                    </div>
                </CardContent>
            </Card>
        );
    }


    return (
        <>
        <ResultDialog 
            isOpen={isResultDialogOpen}
            setIsOpen={setIsResultDialogOpen}
            onClose={() => router.push('/play')}
            {...resultDialogData}
        />
        <div className="flex flex-col min-h-screen bg-background font-body">
            <Header />
            <main className="flex-grow container mx-auto px-4 py-6 space-y-6">
                <div className="flex justify-between items-center">
                    <Link href="/play">
                        <Button variant="outline">
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
                                <AvatarImage src={appUser.photoURL || defaultAvatar} alt={appUser.displayName || 'You'} data-ai-hint="avatar person" />
                                <AvatarFallback>{appUser.displayName?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span className="font-semibold">{appUser.displayName}</span>
                        </div>
                        <div className="text-center">
                            <div className="font-bold text-green-600 mt-1 flex items-center gap-1">
                                <Image src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEj01a-tA55LItcrvtalUaOwdFji0EZjLW15nqZKCiNP4b6T_v7b79g7eUrg3YAsYW5i-FfbZDEONDIv-jXI_wJcwFZCbVWRuyW1hBUdPHlJ6u8SpjD_-ZveIEuDAFSTsB_7OfvxveJyyqKoyf6AsLtPZwEF2lryvPHsqXQB5MNMBGYGfEc0F0wmq9r5CmA/s1600/84440.png" alt="coin" width={20} height={20} data-ai-hint="gold coin"/>
                                <span>₹ {game.amount}</span>
                            </div>
                             <Image src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEilS2_YhPAJBDjdcIRsoMJLTWafsJuIyola3KN50zXQAZYWSSIbhLhWhOJGMG6UYkUB5ZOiVKgsy2bVstr2af0LVf2g-eWjXHnGO4Z0IbaePP4E7TSDB9x_eK8OqTidX968zc5Wn9p6uGlkLoD9iglU3KZ28_2IbXgl29zHTZgwxzMWPvbN6zhA5AhyH7s/s1600/74920.png" alt="vs" width={32} height={16} className="mx-auto" data-ai-hint="versus icon" />
                        </div>
                        <div className="flex items-center gap-2">
                             <span className="font-semibold">{opponent?.displayName}</span>
                            <Avatar className="h-10 w-10">
                                <AvatarImage src={opponent?.photoURL || defaultAvatar} alt={opponent?.displayName || 'Opponent'} data-ai-hint="avatar person" />
                                <AvatarFallback>{opponent?.displayName?.charAt(0)}</AvatarFallback>
                            </Avatar>
                        </div>
                    </CardContent>
                </Card>

                 <Card>
                    <CardHeader className="py-3 bg-muted rounded-t-lg">
                        <CardTitle className="text-center text-md font-semibold text-primary">Battle Details</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 text-sm space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground flex items-center gap-2"><Hash />Battle ID</span>
                            <span className="font-mono text-xs">{gameDetails.id}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground flex items-center gap-2"><Clock />Last Updated</span>
                            <span className="font-medium">{format(game.lastUpdatedAt.toDate(), 'PPpp')}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground flex items-center gap-2"><AlertTriangle />Update Deadline</span>
                            <span className="font-medium">{gameDetails.updateDeadline}</span>
                        </div>
                    </CardContent>
                </Card>

                {game.status === 'ongoing' && renderResultSection()}
                
                {game.status !== 'ongoing' && game.status !== 'challenge' && (
                    <Card>
                        <CardHeader>
                             <CardTitle className="text-center text-lg font-semibold text-primary">Game Over</CardTitle>
                        </CardHeader>
                        <CardContent className="text-center space-y-3">
                            <p className="text-muted-foreground">This game is <span className="font-bold capitalize">{game.status.replace('_', ' ')}</span>.</p>
                            {game.status === 'under_review' && <p className="text-sm mt-2">The result is under review by the admin.</p>}
                            {game.status === 'disputed' && <p className="text-sm mt-2 text-destructive">The result is disputed. Admin will investigate.</p>}
                            {game.status === 'completed' && <p className="text-sm mt-2">This battle is complete. Winner: {game.winner === game.player1.uid ? game.player1.displayName : game.player2?.displayName}</p>}
                            {game.status === 'cancelled' && <p className="text-sm mt-2">This battle was cancelled.</p>}
                             <Link href="/play">
                                <Button variant="outline" className="mt-4">Back to Lobby</Button>
                             </Link>
                        </CardContent>
                    </Card>
                )}


                <Card>
                    <CardHeader className="py-3 bg-muted rounded-t-lg">
                        <CardTitle className="text-center text-md font-semibold text-primary">Penalty</CardTitle>
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
