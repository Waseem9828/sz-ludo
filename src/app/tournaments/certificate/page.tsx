
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
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { Crown, Gamepad2, Sparkles, Gem, Award } from 'lucide-react';

const templates = [
    { id: 'classic', name: 'Classic Red', cost: 0, icon: Award },
    { id: 'dark-royal', name: 'Dark Royal', cost: 1, icon: Gem },
    { id: 'gamers-edge', name: 'Gamer\'s Edge', cost: 2, icon: Gamepad2 },
    { id: 'vintage', name: 'Vintage Grandeur', cost: 4, icon: Crown },
    { id: 'minimalist', name: 'Minimalist Clean', cost: 3, icon: Sparkles },
    { id: 'vibrant', name: 'Vibrant Blast', cost: 5, icon: Sparkles },
];

const CertificatePage = () => {
    const { user, appUser, loading } = useAuth();
    const { toast } = useToast();
    const router = useRouter();

    const [isWinner, setIsWinner] = useState(false);
    const [dataLoading, setDataLoading] = useState(true);
    
    const [selectedTemplate, setSelectedTemplate] = useState('classic');

    const [playerName, setPlayerName] = useState('');
    const [prize, setPrize] = useState('₹0');
    const [rank, setRank] = useState('Rank');
    const [date, setDate] = useState(new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }));
    const [title, setTitle] = useState('Mega Ludo Championship');
    const [subtitle, setSubtitle] = useState('You played. You conquered.');
    
    // Refs for DOM elements
    const previewWrapRef = useRef<HTMLDivElement>(null);
    const downloadBtnRef = useRef<HTMLButtonElement>(null);

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

    const handleDownload = async () => {
         if (!user || !appUser) {
            toast({ title: 'Error', description: 'You must be logged in.', variant: 'destructive' });
            return;
        }

        const templateInfo = templates.find(t => t.id === selectedTemplate);
        if (!templateInfo) return;
        
        const cost = templateInfo.cost;
        const prizeAmount = parseFloat(prize.replace('₹', '').replace(/,/g, ''));
        
        if (!isWinner) {
            if (isNaN(prizeAmount) || prizeAmount > 50000) {
                toast({ title: 'Invalid Prize', description: 'Prize amount cannot exceed ₹50,000 for non-winners.', variant: 'destructive' });
                return;
            }
            const totalBalance = (appUser.wallet?.balance || 0) + (appUser.wallet?.winnings || 0);
            if (totalBalance < cost) {
                toast({ title: 'Insufficient Balance', description: `You need at least ₹${cost} to generate this certificate.`, variant: 'destructive' });
                return;
            }

            if (cost > 0) {
                try {
                    await updateUserWallet(user.uid, -cost, 'balance', 'penalty', `Certificate Generation: ${templateInfo.name}`);
                    toast({ title: 'Fee Charged', description: `₹${cost} has been deducted for the certificate.` });
                } catch (error: any) {
                    toast({ title: 'Payment Failed', description: error.message, variant: 'destructive' });
                    return;
                }
            }
        }
        
        const el = previewWrapRef.current;
        if (!el || !window.html2canvas) return;

        const wallpaperEl = el.querySelector('.wallpaper');
        if (!wallpaperEl) return;

        const tokenImgEl = wallpaperEl.querySelector('#tokenImg') as HTMLImageElement;


        downloadBtnRef.current!.disabled = true;
        downloadBtnRef.current!.innerText = 'Generating...';
        
        try {
            // Fetch image and convert to base64
            const response = await fetch(tokenImgEl.src);
            const blob = await response.blob();
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = async () => {
                const base64data = reader.result;
                tokenImgEl.src = base64data as string;

                // Now render the canvas
                const canvas = await window.html2canvas(wallpaperEl, {
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
                    /* Base Wallpaper Styles */
                    .wallpaper{position:relative;width:100%;height:100%;display:flex;flex-direction:column;padding:28px;gap:12px;color:white; overflow: hidden;}
                    .wallpaper .bg-shape{position:absolute;filter:blur(40px);border-radius:50%}
                    .wallpaper .top-row{display:flex;align-items:center;justify-content:space-between;gap:12px;z-index: 1;}
                    .wallpaper .logo{width:64px;height:64px;border-radius:12px;display:grid;place-items:center;font-weight:900;font-size:20px;border:4px solid rgba(255,255,255,0.25)}
                    .wallpaper .tourney{flex:1;margin-left:8px}
                    .wallpaper .tourney h1{margin:0;font-size:18px;letter-spacing:0.2px;font-weight:800;text-shadow:0 6px 18px rgba(0,0,0,0.15)}
                    .wallpaper .tourney p{margin:0;font-size:12px;opacity:0.95;}
                    .wallpaper .congrats{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:8px 6px;border-radius:14px;margin-top:6px; z-index: 1;}
                    .wallpaper .congrats .big{font-size:28px;font-weight:900;line-height:1;text-shadow:0 8px 26px rgba(0,0,0,0.15)}
                    .wallpaper .congrats .sub{font-size:12px;opacity:0.95;margin-top:6px}
                    .wallpaper .center-area{display:flex;flex-direction:column;align-items:center;gap:10px;margin-top:6px; z-index: 1;}
                    .wallpaper .token-wrap{width:170px;height:170px;border-radius:22px;display:grid;place-items:center;border-width:8px;box-shadow:0 18px 40px rgba(0,0,0,0.12)}
                    .wallpaper .token-wrap img{width:130px;height:130px;object-fit:contain}
                    .wallpaper .token-label{font-weight:800;}
                    .wallpaper .player-box{width:100%;display:flex;flex-direction:column;gap:8px;align-items:center;margin-top:6px; z-index: 1;}
                    .wallpaper .player-name{font-size:20px;font-weight:900;text-shadow:0 10px 30px rgba(0,0,0,0.22)}
                    .wallpaper .player-meta{display:flex;gap:10px;margin-top:4px}
                    .wallpaper .meta-badge{padding:8px 12px;border-radius:12px;font-weight:800; font-family: sans-serif;}
                    .wallpaper .stats{display:flex;justify-content:space-between;gap:8px;margin-top:auto; z-index: 1;}
                    .wallpaper .stat{flex:1;padding:8px;border-radius:12px;text-align:center}
                    .wallpaper .stat b{display:block;font-size:14px;font-weight:900;}
                    .wallpaper .stat small{font-size:11px;}
                    .wallpaper .confetti-piece{position:absolute;width:8px;height:18px;opacity:0.95;transform-origin:center;animation:fall 2.8s linear infinite;}
                    @keyframes fall{0%{transform:translateY(-40vh) rotate(0) }100%{transform:translateY(110vh) rotate(360deg)}}

                    /* Template: Classic Red */
                    .wallpaper.template-classic{background:linear-gradient(180deg, #ff3b3b, #ff7a7a); color: white;}
                    .wallpaper.template-classic .logo{background:linear-gradient(180deg,#fff,#ffecec); color: #ff3b3b;}
                    .wallpaper.template-classic .tourney h1{color:#fff;}
                    .wallpaper.template-classic .tourney p{color:rgba(255,255,255,0.95)}
                    .wallpaper.template-classic .congrats{background:linear-gradient(180deg,rgba(255,255,255,0.06),rgba(0,0,0,0.03));backdrop-filter:blur(4px);}
                    .wallpaper.template-classic .congrats .big, .wallpaper.template-classic .congrats .sub{color:#fff}
                    .wallpaper.template-classic .token-wrap{background:linear-gradient(180deg,#fff,#fff8f8); border-color: rgba(255,255,255,0.7);}
                    .wallpaper.template-classic .token-label{color:#6b0000}
                    .wallpaper.template-classic .player-name{color:#fff}
                    .wallpaper.template-classic .meta-badge{background:rgba(255,255,255,0.12); color:#fff}
                    .wallpaper.template-classic .stat{background:rgba(255,255,255,0.08);}
                    .wallpaper.template-classic .stat b{color:#fff}
                    .wallpaper.template-classic .stat small{color:rgba(255,255,255,0.9)}

                    /* Template: Dark Royal */
                    .wallpaper.template-dark-royal{background:linear-gradient(180deg, #1D2B64, #000000); color: #FFD700;}
                    .wallpaper.template-dark-royal .bg-shape{background: #FFD700; opacity: 0.05;}
                    .wallpaper.template-dark-royal .logo{background:linear-gradient(180deg, #000, #111); color: #FFD700; border-color: #FFD700;}
                    .wallpaper.template-dark-royal .tourney h1, .wallpaper.template-dark-royal .tourney p {color: #fff;}
                    .wallpaper.template-dark-royal .congrats{background:rgba(255,215,0,0.1); border: 1px solid rgba(255,215,0,0.2)}
                    .wallpaper.template-dark-royal .congrats .big, .wallpaper.template-dark-royal .congrats .sub{color:#fff}
                    .wallpaper.template-dark-royal .token-wrap{background:linear-gradient(180deg,#333,#000); border-color: #FFD700;}
                    .wallpaper.template-dark-royal .token-label{color:#FFD700}
                    .wallpaper.template-dark-royal .player-name{color:#FFD700}
                    .wallpaper.template-dark-royal .meta-badge{background:rgba(255,215,0,0.1); color:#FFD700; border: 1px solid rgba(255,215,0,0.2)}
                    .wallpaper.template-dark-royal .stat{background:rgba(255,215,0,0.05);}
                    .wallpaper.template-dark-royal .stat b, .wallpaper.template-dark-royal .stat small{color:#fff}

                    /* Template: Gamer's Edge */
                    .wallpaper.template-gamers-edge{background: #0f0c29; font-family: 'Courier New', monospace;}
                    .wallpaper.template-gamers-edge::before{content:''; position:absolute; inset:0; background:linear-gradient(transparent 70%, rgba(0,255,255,0.1) 70%), linear-gradient(90deg, transparent 98%, rgba(255,0,255,0.2) 98%); background-size: 100% 4px, 4px 100%;}
                    .wallpaper.template-gamers-edge .logo{background:#0f0c29; color: #00ff00; border: 2px solid #00ff00; text-shadow: 0 0 5px #00ff00;}
                    .wallpaper.template-gamers-edge .tourney h1{color:#f0f; text-shadow: 0 0 8px #f0f;}
                    .wallpaper.template-gamers-edge .tourney p{color:#0ff; text-shadow: 0 0 5px #0ff;}
                    .wallpaper.template-gamers-edge .congrats{background:rgba(0,255,0,0.05); border: 1px solid #0f0;}
                    .wallpaper.template-gamers-edge .token-wrap{background:#0f0c29; border: 4px solid #f0f;}
                    .wallpaper.template-gamers-edge .token-label{color:#f0f; text-shadow: 0 0 5px #f0f;}
                    .wallpaper.template-gamers-edge .player-name{color:#0f0; text-shadow: 0 0 8px #0f0;}
                    .wallpaper.template-gamers-edge .meta-badge{background:none; border: 1px solid #0ff; color: #0ff;}
                    .wallpaper.template-gamers-edge .stat{background:none; border: 1px solid rgba(255,255,255,0.1)}
                    .wallpaper.template-gamers-edge .stat b, .wallpaper.template-gamers-edge .stat small{color: #fff;}

                    /* Template: Vintage Grandeur */
                    .wallpaper.template-vintage{background: #fdf5e6; color: #5d4037; font-family: 'Times New Roman', serif; border: 10px solid #c0a080; border-image: linear-gradient(145deg, #d4af37, #b2842d) 1;}
                    .wallpaper.template-vintage .logo{background: #eaddc7; color: #5d4037; border-color: #5d4037;}
                    .wallpaper.template-vintage .tourney h1, .wallpaper.template-vintage .congrats .big, .wallpaper.template-vintage .player-name, .wallpaper.template-vintage .stat b {color: #5d4037; text-shadow: none;}
                    .wallpaper.template-vintage .tourney p, .wallpaper.template-vintage .congrats .sub, .wallpaper.template-vintage .stat small, .wallpaper.template-vintage .token-label{color: #8d6e63; text-shadow: none;}
                    .wallpaper.template-vintage .congrats{background: rgba(93,64,55,0.05);}
                    .wallpaper.template-vintage .token-wrap{background: #eaddc7; border-color: #5d4037;}
                    .wallpaper.template-vintage .meta-badge{background: #5d4037; color: #fdf5e6;}
                    .wallpaper.template-vintage .stat{background: rgba(93,64,55,0.05);}

                    /* Template: Minimalist Clean */
                    .wallpaper.template-minimalist{background: #f8f9fa; color: #212529; align-items:center; justify-content:center; text-align:center;}
                    .wallpaper.template-minimalist .logo{display:none;}
                    .wallpaper.template-minimalist .tourney{margin-left:0;}
                    .wallpaper.template-minimalist .congrats, .wallpaper.template-minimalist .stats, .wallpaper.template-minimalist .center-area, .wallpaper.template-minimalist .player-box{margin-top:20px;}
                    .wallpaper.template-minimalist .player-name{font-size:32px; color: #212529;}
                    .wallpaper.template-minimalist .meta-badge{background: #e9ecef; color: #495057;}
                    .wallpaper.template-minimalist .token-wrap, .wallpaper.template-minimalist .congrats, .wallpaper.template-minimalist .stat {display: none;}

                    /* Template: Vibrant Blast */
                    .wallpaper.template-vibrant{background: linear-gradient(45deg, #f97794, #623aa2); color:white;}
                    .wallpaper.template-vibrant .logo{background: rgba(255,255,255,0.2); color:white; border-color: rgba(255,255,255,0.5)}
                    .wallpaper.template-vibrant .congrats, .wallpaper.template-vibrant .meta-badge, .wallpaper.template-vibrant .stat{background: rgba(255,255,255,0.1); backdrop-filter: blur(5px);}
                    .wallpaper.template-vibrant .token-wrap{background: rgba(255,255,255,0.2); border-color: rgba(255,255,255,0.5)}
                    .wallpaper.template-vibrant .token-label{color: white; font-weight: bold;}
                `}</style>
                <div className="w-full max-w-[420px] mx-auto flex flex-col gap-3 items-center">
                    <div ref={previewWrapRef} className="wallpaper-wrap aspect-[9/16] max-w-[360px] relative rounded-[22px] overflow-hidden shadow-lg">
                        <div id="wallpaper" className={cn("wallpaper", `template-${selectedTemplate}`)}>
                            <div className="bg-shape shape-1"></div>
                            <div className="bg-shape shape-2"></div>

                            <div className="top-row">
                                <div className="logo" id="logoText">SZ</div>
                                <div className="tourney">
                                <h1 id="titleText">{title}</h1>
                                <p id="subtitleText">{subtitle}</p>
                                </div>
                            </div>

                            <div className="congrats">
                                <div className="big" id="congratsTitle">Congratulations!</div>
                                <div className="sub" id="congratsSub">You've secured a top rank</div>
                            </div>

                            <div className="center-area">
                                <div className="token-wrap" id="tokenWrap">
                                <img id="tokenImg" src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEg2oNx0s_EsUtQCxkYGCkEqHAcVCA4PAgVdyNX-mDF_KO228qsfmqMAOefbIFmb-yD98WpX7jVLor2AJzeDhfqG6wC8n7lWtxU9euuYIYhPWStqYgbGjkGp6gu1JrfKmXMwCn7I_KjLGu_GlGy3PMNmf9ljC8Yr__ZpsiGxHJRKbtH6MfTuG4ofViNRsAY/s1600/73555.png" alt="token" className="w-[130px] h-[130px] object-contain" crossOrigin="anonymous"/>
                                </div>
                                <div className="token-label" id="tokenLabel">Winner Token</div>
                            </div>

                            <div className="player-box">
                                <div className="player-name">{playerName}</div>
                                <div className="player-meta">
                                <div className="meta-badge">{rank}</div>
                                <div className="meta-badge">{prize}</div>
                                </div>
                            </div>

                            <div className="stats">
                                <div className="stat"><b>452</b><small>Score</small></div>
                                <div className="stat"><b>12</b><small>Wins</small></div>
                                <div className="stat"><b>{date}</b><small>Date</small></div>
                            </div>
                        </div>
                    </div>
                    
                     <Card className="w-full">
                        <CardContent className="p-4">
                            <Label className="text-lg font-semibold">Choose Template</Label>
                             <RadioGroup value={selectedTemplate} onValueChange={setSelectedTemplate} className="grid grid-cols-2 gap-2 mt-2">
                                {templates.map((template) => (
                                <Label key={template.id} htmlFor={template.id} className={cn("flex flex-col items-center justify-center rounded-md border-2 p-2 hover:bg-accent hover:text-accent-foreground cursor-pointer", selectedTemplate === template.id ? "border-primary" : "border-muted")}>
                                     <RadioGroupItem value={template.id} id={template.id} className="sr-only" />
                                     <template.icon className="h-5 w-5 mb-1" />
                                     <span className="text-sm font-medium">{template.name}</span>
                                     <span className="text-xs font-bold text-primary font-sans">
                                        {isWinner ? 'FREE' : template.cost === 0 ? 'FREE' : `₹${template.cost}`}
                                    </span>
                                </Label>
                                ))}
                            </RadioGroup>
                        </CardContent>
                    </Card>

                    <Card className="w-full">
                        <CardContent className="p-4">
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

                                <Button ref={downloadBtnRef} className="w-full" onClick={handleDownload}>Download PNG</Button>
                                
                                {!isWinner && templates.find(t => t.id === selectedTemplate)!.cost > 0 && (
                                    <p className="text-xs text-center text-destructive mt-2 font-sans">
                                        Note: A fee of ₹{templates.find(t => t.id === selectedTemplate)!.cost} will be charged to generate this certificate.
                                    </p>
                                )}
                                {isWinner && <p className="text-xs text-center text-green-600 mt-2">As a winner, you can download any template for free!</p>}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}

export default CertificatePage;
