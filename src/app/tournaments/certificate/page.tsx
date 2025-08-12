
'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { SplashScreen } from '@/components/ui/splash-screen';
import Header from '@/components/header';
import Script from 'next/script';
import { listenForTournaments, Tournament } from '@/lib/firebase/tournaments';
import { updateUserWallet } from '@/lib/firebase/users';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const CertificatePage = () => {
    const { user, appUser, loading } = useAuth();
    const { toast } = useToast();
    const router = useRouter();

    const [isWinner, setIsWinner] = useState(false);
    const [dataLoading, setDataLoading] = useState(true);

    const [playerName, setPlayerName] = useState('');
    const [prize, setPrize] = useState('₹0');
    const [rank, setRank] = useState('Rank');
    const [date, setDate] = useState(new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }));
    const [title, setTitle] = useState('Mega Ludo Championship');
    const [subtitle, setSubtitle] = useState('You played. You conquered.');
    
    // Refs for DOM elements
    const playerNameRef = useRef<HTMLDivElement>(null);
    const prizeBadgeRef = useRef<HTMLDivElement>(null);
    const rankBadgeRef = useRef<HTMLDivElement>(null);
    const statDateRef = useRef<HTMLDivElement>(null);
    const titleTextRef = useRef<HTMLDivElement>(null);
    const subtitleTextRef = useRef<HTMLDivElement>(null);
    const wallpaperRef = useRef<HTMLDivElement>(null);
    const downloadBtnRef = useRef<HTMLButtonElement>(null);
    const tokenImgRef = useRef<HTMLImageElement>(null);

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        } else if (user) {
            listenForTournaments(
                (tournaments) => {
                    const completedTournaments = tournaments.filter(t => t.status === 'completed');
                    const userIsWinner = completedTournaments.some(t =>
                        t.leaderboard.some(p => p.uid === user.uid)
                    );
                    setIsWinner(userIsWinner);
                    setDataLoading(false);
                },
                (error) => {
                    toast({ title: "Error", description: `Could not fetch tournament data: ${error.message}`, variant: "destructive" });
                    setDataLoading(false);
                },
                ['completed']
            );

            if (appUser) {
                setPlayerName(appUser.displayName || 'Player');
            }
        }
    }, [loading, user, appUser, router, toast]);

    const applyPreview = () => {
        if (playerNameRef.current) playerNameRef.current.innerText = playerName;
        if (prizeBadgeRef.current) prizeBadgeRef.current.innerText = prize;
        if (rankBadgeRef.current) rankBadgeRef.current.innerText = rank;
        if (statDateRef.current) statDateRef.current.innerText = date;
        if (titleTextRef.current) titleTextRef.current.innerText = title;
        if (subtitleTextRef.current) subtitleTextRef.current.innerText = subtitle;
    };
    
    useEffect(applyPreview, [playerName, prize, rank, date, title, subtitle]);

    const handleDownload = async () => {
         if (!user || !appUser) {
            toast({ title: 'Error', description: 'You must be logged in.', variant: 'destructive' });
            return;
        }

        const prizeAmount = parseFloat(prize.replace('₹', '').replace(/,/g, ''));
        if (!isWinner) {
            if (isNaN(prizeAmount) || prizeAmount > 50000) {
                toast({ title: 'Invalid Prize', description: 'Prize amount cannot exceed ₹50,000 for non-winners.', variant: 'destructive' });
                return;
            }
            const totalBalance = (appUser.wallet?.balance || 0) + (appUser.wallet?.winnings || 0);
            if (totalBalance < 1) {
                toast({ title: 'Insufficient Balance', description: 'You need at least ₹1 to generate a certificate.', variant: 'destructive' });
                return;
            }

            try {
                await updateUserWallet(user.uid, -1, 'balance', 'penalty', 'Certificate Generation Fee');
                toast({ title: 'Fee Charged', description: '₹1 has been deducted for certificate generation.' });
            } catch (error: any) {
                toast({ title: 'Payment Failed', description: error.message, variant: 'destructive' });
                return;
            }
        }
        
        const el = wallpaperRef.current;
        const imgEl = tokenImgRef.current;
        if (!el || !imgEl || !window.html2canvas) return;

        downloadBtnRef.current!.disabled = true;
        downloadBtnRef.current!.innerText = 'Generating...';
        
        try {
            // Fetch image and convert to base64
            const response = await fetch(imgEl.src);
            const blob = await response.blob();
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = async () => {
                const base64data = reader.result;
                imgEl.src = base64data as string;

                // Now render the canvas
                const canvas = await window.html2canvas(el, {
                    backgroundColor: null,
                    scale: 3, // Higher scale for better resolution
                    useCORS: true,
                });

                const data = canvas.toDataURL('image/png');
                const a = document.createElement('a');
                const safePlayerName = (playerName || 'player').replace(/\s+/g, '_');
                a.href = data;
                a.download = `${safePlayerName}_SZLudo_winner_story.png`;
                a.click();

                // Revert image src if needed, although it's temporary
                imgEl.src = "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEg2oNx0s_EsUtQCxkYGCkEqHAcVCA4PAgVdyNX-mDF_KO228qsfmqMAOefbIFmb-yD98WpX7jVLor2AJzeDhfqG6wC8n7lWtxU9euuYIYhPWStqYgbGjkGp6gu1JrfKmXMwCn7I_KjLGu_GlGy3PMNmf9ljC8Yr__ZpsiGxHJRKbtH6MfTuG4ofViNRsAY/s1600/73555.png";
                if(downloadBtnRef.current) {
                    downloadBtnRef.current.disabled = false;
                    downloadBtnRef.current!.innerText = 'Download PNG';
                }
            };

        } catch (error) {
             console.error("Error generating canvas:", error);
             toast({title: "Error", description: "Could not generate certificate image.", variant: "destructive"});
              if(downloadBtnRef.current) {
                downloadBtnRef.current.disabled = false;
                downloadBtnRef.current!.innerText = 'Download PNG';
            }
        }
    };
    
    if (loading || dataLoading) {
        return <SplashScreen />;
    }

    return (
        <>
            <Script src="https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js" strategy="afterInteractive" />
            <Header />
            <div className="container mx-auto px-4 py-6">
                <style jsx global>{`
                    body { 
                        background: linear-gradient(180deg, hsl(var(--background)), hsl(var(--secondary))) !important;
                    }
                `}</style>

                <div className="w-full max-w-[420px] mx-auto flex flex-col gap-3 items-center">
                    <div className="w-full aspect-[9/16] max-w-[360px] relative rounded-[22px] overflow-hidden shadow-lg">
                        <div ref={wallpaperRef} className="wallpaper relative w-full h-full bg-gradient-to-b from-primary to-destructive flex flex-col p-7 gap-3 text-primary-foreground font-sans">
                            <div className="bg-shape absolute filter blur-xl opacity-10 rounded-full w-[420px] h-[420px] right-[-120px] top-[-60px] bg-white"></div>
                            <div className="bg-shape absolute filter blur-xl opacity-10 rounded-full w-[260px] h-[260px] left-[-80px] bottom-[-60px] bg-secondary"></div>
                            
                            <div className="flex items-center justify-between gap-3">
                                <div className="w-16 h-16 rounded-xl bg-gradient-to-b from-white to-secondary grid place-items-center text-primary font-black text-xl border-4 border-white/25">SZ</div>
                                <div className="flex-1 ml-2">
                                    <h1 ref={titleTextRef} className="m-0 text-lg font-extrabold text-primary-foreground tracking-wide" style={{textShadow:'0 6px 18px rgba(0,0,0,0.15)'}}></h1>
                                    <p ref={subtitleTextRef} className="m-0 text-xs opacity-95 text-primary-foreground/95"></p>
                                </div>
                            </div>

                            <div className="flex flex-col items-center justify-center p-2 rounded-2xl bg-gradient-to-b from-white/10 to-black/5 backdrop-blur-sm mt-1.5">
                                <div className="text-3xl font-black leading-none text-primary-foreground" style={{textShadow:'0 8px 26px rgba(0,0,0,0.15)'}}>Congratulations!</div>
                                <div className="text-xs opacity-95 text-primary-foreground mt-1.5">You've secured a top rank in the tournament</div>
                            </div>
                            
                            <div className="flex flex-col items-center gap-2.5 mt-1.5">
                                <div className="w-[170px] h-[170px] rounded-[22px] bg-gradient-to-b from-white to-secondary grid place-items-center border-8 border-white/70 shadow-lg">
                                    <img ref={tokenImgRef} src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEg2oNx0s_EsUtQCxkYGCkEqHAcVCA4PAgVdyNX-mDF_KO228qsfmqMAOefbIFmb-yD98WpX7jVLor2AJzeDhfqG6wC8n7lWtxU9euuYIYhPWStqYgbGjkGp6gu1JrfKmXMwCn7I_KjLGu_GlGy3PMNmf9ljC8Yr__ZpsiGxHJRKbtH6MfTuG4ofViNRsAY/s1600/73555.png" alt="token" className="w-[130px] h-[130px] object-contain" />
                                </div>
                                <div className="font-extrabold text-red-900 dark:text-red-200">Winner Token</div>
                            </div>

                            <div className="w-full flex flex-col gap-2 items-center mt-1.5">
                                <div ref={playerNameRef} className="text-xl font-black text-primary-foreground" style={{textShadow:'0 10px 30px rgba(0,0,0,0.22)'}}></div>
                                <div className="flex gap-2.5 mt-1">
                                    <div ref={rankBadgeRef} className="bg-white/10 backdrop-blur-sm py-2 px-3 rounded-xl font-extrabold text-primary-foreground"></div>
                                    <div ref={prizeBadgeRef} className="bg-white/10 backdrop-blur-sm py-2 px-3 rounded-xl font-extrabold text-primary-foreground"></div>
                                </div>
                            </div>

                            <div className="flex justify-between gap-2 mt-auto">
                                <div className="flex-1 bg-white/10 p-2 rounded-xl text-center"><b id="statScore" className="block text-sm font-black text-primary-foreground">452</b><small className="text-xs text-white/90">Score</small></div>
                                <div className="flex-1 bg-white/10 p-2 rounded-xl text-center"><b id="statWins" className="block text-sm font-black text-primary-foreground">12</b><small className="text-xs text-white/90">Wins</small></div>
                                <div className="flex-1 bg-white/10 p-2 rounded-xl text-center"><b ref={statDateRef} className="block text-sm font-black text-primary-foreground"></b><small className="text-xs text-white/90">Date</small></div>
                            </div>
                        </div>
                    </div>

                    <div className="w-full flex flex-col gap-2">
                        <div className="flex gap-2">
                            <Input placeholder="Player name" value={playerName} onChange={e => setPlayerName(e.target.value)} />
                            <Input placeholder="Prize" value={prize} onChange={e => setPrize(e.target.value)} />
                        </div>
                        <div className="flex gap-2">
                            <Input placeholder="Rank" value={rank} onChange={e => setRank(e.target.value)} />
                            <Input placeholder="Date" value={date} onChange={e => setDate(e.target.value)} />
                        </div>
                         <div className="flex gap-2">
                            <Input placeholder="Tournament title" value={title} onChange={e => setTitle(e.target.value)} />
                            <Input placeholder="Subtitle" value={subtitle} onChange={e => setSubtitle(e.target.value)} />
                        </div>

                        <div className="flex gap-2">
                            <Button className="w-full" onClick={applyPreview}>Apply</Button>
                            <Button ref={downloadBtnRef} className="w-full" onClick={handleDownload}>Download PNG</Button>
                        </div>
                        
                         {!isWinner && (
                            <p className="text-xs text-center text-destructive mt-2">Note: You are not a tournament winner. A fee of ₹1 will be charged to generate this certificate.</p>
                        )}
                    </div>
                </div>
            </div>
        </>
    