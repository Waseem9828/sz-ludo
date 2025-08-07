
'use client';

import React, { useState, useEffect } from 'react';
import Header from "@/components/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/context/auth-context';
import { SplashScreen } from '@/components/ui/splash-screen';
import { getSettings, AppSettings } from '@/lib/firebase/settings';
import { Share2, Swords, Wallet } from 'lucide-react';

const WhatsAppIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-white">
        <path d="M16.75 13.96c.25.58.12 1.19-.29 1.59l-1.12 1.11c-.39.39-1 .4-1.4.03-.4-.36-.88-.78-1.4-1.25-.54-.48-1.07-.99-1.58-1.55-.5-.54-1-1.07-1.52-1.58-.46-.52-.87-1-1.22-1.43-.37-.41-.35-1.02.04-1.42l1.11-1.12c.39-.41.99-.54 1.57-.29.41.17.78.44 1.11.78.33.34.6.71.78 1.13Z" />
        <path d="M19.17 4.83A9.92 9.92 0 0 0 12 2C6.48 2 2 6.48 2 12c0 1.77.46 3.45 1.27 4.94L2 22l5.06-1.27c1.5.81 3.17 1.27 4.94 1.27h.01c5.52 0 10-4.48 10-10 0-2.76-1.12-5.26-2.9-7.07Zm-1.63 12.54a8.37 8.37 0 0 1-11.23-11.23 8.37 8.37 0 0 1 11.23 11.23Z" />
    </svg>
)

const TelegramIcon = () => (
     <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
        <path d="M22 2 11 13" />
        <path d="m22 2-7 20-4-9-9-4 20-7z" />
    </svg>
)

const defaultSettings = {
    imageUrl: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEigtvhhJRucPCHR_BWwPVLk335J3yeFT8CTExF13JYJbogG0IOrplIRwu2FzgAca1G8ssvc83saCCnC7NdVFP15FnIOppoCDc0pa31pziFzf6hGq8qCo7yZa2K9_92MtBQet6Ii0wgVFYMEyfUn8R3s6vOgo2aavCvuzdNcsYX0YizIEy9xzVB_mBt5o_4/s320/77621.png',
    shareText: "Hey! I'm playing on SZ LUDO and earning real cash. You should join too! Use my code {{referralCode}} to sign up and get a bonus. Let's play! Link: {{referralLink}}",
    howItWorksText: "You can refer and earn 2% of your referral winning, every time. Like if your player plays for ₹10000 and wins, You will get ₹200 as referral amount."
};


export default function ReferPage() {
    const { toast } = useToast();
    const { user, appUser, loading: authLoading } = useAuth();
    const [settings, setSettings] = useState<AppSettings['referralSettings']>(undefined);
    const [settingsLoading, setSettingsLoading] = useState(true);
    
    useEffect(() => {
        getSettings().then(s => {
            setSettings(s.referralSettings);
            setSettingsLoading(false);
        });
    }, []);
    
    const referralSettings = settings || defaultSettings;
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const referralCode = user ? `SZLUDO${user.uid.substring(0, 8).toUpperCase()}` : '';
    const referralLink = `${baseUrl}/login?ref=${referralCode}`;
    const shareText = (referralSettings.shareText || defaultSettings.shareText)
        .replace('{{referralCode}}', referralCode)
        .replace('{{referralLink}}', referralLink);

    const handleCopyToClipboard = () => {
        navigator.clipboard.writeText(referralLink);
        toast({
            title: "Copied to clipboard!",
            description: "Your referral link has been copied.",
        });
    };

    const handleShare = (platform: 'whatsapp' | 'telegram') => {
        let url = '';
        if (platform === 'whatsapp') {
            url = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
        } else if (platform === 'telegram') {
            url = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(shareText)}`;
        }
        window.open(url, '_blank');
    };

    if (authLoading || settingsLoading || !user || !appUser) {
        return <SplashScreen />;
    }

    return (
        <div className="flex flex-col min-h-screen bg-background font-body">
            <Header />
            <main className="flex-grow container mx-auto px-4 py-6 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-center text-lg font-semibold text-red-600">Your Referral Earnings</CardTitle>
                    </CardHeader>
                    <CardContent className="flex justify-around text-center">
                        <div>
                            <p className="text-sm text-muted-foreground">Referred Players</p>
                            <p className="text-lg font-bold">{appUser.referralStats?.referredCount || 0}</p>
                        </div>
                        <div className="border-l mx-4"></div>
                        <div>
                            <p className="text-sm text-muted-foreground">Referral Earning</p>
                            <p className="text-lg font-bold">₹{(appUser.referralStats?.totalEarnings || 0).toFixed(2)}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-center text-lg font-semibold text-red-600">Referral Code</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center">
                        <div className="flex justify-center my-4">
                            <Image src={referralSettings.imageUrl || defaultSettings.imageUrl} alt="Refer a friend" width={200} height={150} data-ai-hint="referral illustration" className="rounded-lg"/>
                        </div>
                        <div className="flex">
                            <Input type="text" value={referralCode} readOnly className="text-center bg-muted border-r-0 rounded-r-none" />
                            <Button className="rounded-l-none" onClick={handleCopyToClipboard}>COPY</Button>
                        </div>
                        <div className="flex items-center my-4">
                            <hr className="w-full border-gray-300" />
                            <span className="mx-4 text-muted-foreground font-semibold">OR</span>
                            <hr className="w-full border-gray-300" />
                        </div>
                        <div className="space-y-3">
                            <Button className="w-full bg-green-500 hover:bg-green-600 text-white" onClick={() => handleShare('whatsapp')}>
                                <WhatsAppIcon />
                                Share To WhatsApp
                            </Button>
                            <Button className="w-full bg-black hover:bg-gray-800 text-white" onClick={() => handleShare('telegram')}>
                                <TelegramIcon />
                                Share To Telegram
                            </Button>
                            <Button variant="secondary" className="w-full" onClick={handleCopyToClipboard}>
                                Copy To Clipboard
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-center text-lg font-semibold text-red-600"> हमारा रेफरल प्लान (Our Referral Plan)</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-start gap-4">
                            <div className="bg-primary/10 text-primary p-3 rounded-full">
                                <Share2 className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="font-bold">स्टेप 1: दोस्तों को शेयर करें</h3>
                                <p className="text-sm text-muted-foreground">अपना यूनिक रेफरल कोड या लिंक अपने दोस्तों के साथ शेयर करें।</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <div className="bg-primary/10 text-primary p-3 rounded-full">
                                <Swords className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="font-bold">स्टेप 2: दोस्त गेम खेलें और जीतें</h3>
                                <p className="text-sm text-muted-foreground">जब आपका दोस्त आपके कोड का इस्तेमाल करके साइन अप करता है और कोई बैटल जीतता है।</p>
                            </div>
                        </div>
                         <div className="flex items-start gap-4">
                            <div className="bg-primary/10 text-primary p-3 rounded-full">
                                <Wallet className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="font-bold">स्टेप 3: आप कमीशन कमाएँ</h3>
                                <p className="text-sm text-muted-foreground">आपको उनके द्वारा जीती गई राशि का 2% कमीशन तुरंत आपके वॉलेट में मिलेगा, हर बार!</p>
                            </div>
                        </div>
                        <Card className="bg-muted/50 p-4">
                            <p className="text-center text-sm font-semibold">उदाहरण के लिए:</p>
                            <p className="text-center text-xs text-muted-foreground mt-1">अगर आपका दोस्त ₹1000 के बेट वाला गेम जीतता है, तो प्राइज पूल ₹2000 होता है। आपको उस जीत का 2% यानी ₹40 आपके विनिंग वॉलेट में तुरंत मिल जाएगा।</p>
                        </Card>
                    </CardContent>
                </Card>

                 {/* Spacer to prevent content from being hidden by the fixed bottom nav */}
                <div className="h-20 md:hidden" />
            </main>
        </div>
    );
}
