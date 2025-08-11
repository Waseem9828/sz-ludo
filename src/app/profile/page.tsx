
'use client'

import React, { useState, useEffect } from 'react';
import Header from "@/components/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { AlertCircle, ArrowUp, BarChart2, Gift, Pencil, Trophy, ShieldCheck, Check } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { updateProfile } from 'firebase/auth';
import { SplashScreen } from '@/components/ui/splash-screen';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import Image from 'next/image';

const MetricCard = ({ icon, label, value, imageIcon }: { icon?: React.ReactNode, label: string, value: string | number, imageIcon?: string }) => (
    <Card className="bg-secondary/50">
        <CardContent className="p-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {imageIcon ? <Image src={imageIcon} alt={label} width={16} height={16} data-ai-hint="coin money" /> : icon}
                <span>{label}</span>
            </div>
            <p className="text-lg font-bold mt-1 flex items-center gap-1">
                {label.toLowerCase().includes('earning') || label.toLowerCase().includes('won') || label.toLowerCase().includes('penalty') ? 
                    <>
                         <Image src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEj01a-tA55LItcrvtalUaOwdFji0EZjLW15nqZKCiNP4b6T_v7b79g7eUrg3YAsYW5i-FfbZDEONDIv-jXI_wJcwFZCbVWRuyW1hBUdPHlJ6u8SpjD_-ZveIEuDAFSTsB_7OfvxveJyyqKoyf6AsLtPZwEF2lryvPHsqXQB5MNMBGYGfEc0F0wmq9r5CmA/s1600/84440.png" alt="coin" width={14} height={14} data-ai-hint="gold coin"/>
                         {value}
                    </> : value}
            </p>
        </CardContent>
    </Card>
);

const defaultAvatar = "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEi_h6LUuqTTKYsn5TfUZwkI6Aib6Y0tOzQzcoZKstURqxyl-PJXW1DKTkF2cPPNNUbP3iuDNsOBVOYx7p-ZwrodI5w9fyqEwoabj8rU0mLzSbT5GCFUKpfCc4s_LrtHcWFDvvRstCghAfQi5Zfv2fipdZG8h4dU4vGt-eFRn-gS3QTg6_JJKhv0Yysr_ZY/s1600/82126.png";

export default function ProfilePage() {
    const { toast } = useToast();
    const router = useRouter();
    const { user, appUser, loading, logout } = useAuth();
    
    const [username, setUsername] = useState("");
    const [isEditingUsername, setIsEditingUsername] = useState(false);
    const [tempUsername, setTempUsername] = useState("");

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
        if (user && appUser) {
            const name = appUser.displayName || user.displayName || user.email?.split('@')[0] || 'User';
            setUsername(name);
            setTempUsername(name);
        }
    }, [user, appUser, loading, router]);


    const handleEditUsername = async () => {
        if (isEditingUsername) {
            if (user && tempUsername) {
                try {
                    // Update profile in Firebase Auth
                    await updateProfile(user, { displayName: tempUsername });
                    // Update display name in Firestore
                    const userRef = doc(db, 'users', user.uid);
                    await updateDoc(userRef, { displayName: tempUsername });
                    
                    setUsername(tempUsername);
                    toast({
                        title: 'Username Updated',
                        description: `Your username has been changed to ${tempUsername}`,
                    });
                } catch(error: any) {
                     toast({
                        title: 'Error updating username',
                        description: error.message,
                        variant: 'destructive'
                    });
                }
            }
        }
        setIsEditingUsername(!isEditingUsername);
    };

    const handleLogout = async () => {
        try {
            await logout();
            router.push('/login');
            toast({
                title: 'Logged Out',
                description: 'You have been successfully logged out.',
            });
        } catch (error: any) {
             toast({
                title: 'Logout Failed',
                description: error.message,
                variant: 'destructive'
            });
        }
    };
    
    if (loading || !user || !appUser) {
        return <SplashScreen />;
    }
    
    const isKycVerified = appUser.kycStatus === 'Verified';

    const getInitials = (name: string) => {
        return name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U';
    }
    
    return (
        <div className="flex flex-col min-h-screen bg-background font-body">
            <Header />
            <main className="flex-grow container mx-auto px-4 py-6 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-center text-xl font-semibold text-red-600">Profile</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex justify-center relative w-24 h-24 mx-auto">
                            <Avatar className="w-24 h-24 border-4 border-white shadow-md">
                                <AvatarImage src={user.photoURL || defaultAvatar} alt={username} data-ai-hint="avatar person" />
                                <AvatarFallback>{getInitials(username)}</AvatarFallback>
                            </Avatar>
                             <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1">
                                {isKycVerified ? (
                                    <ShieldCheck className="h-7 w-7 text-blue-500 fill-blue-100" />
                                ) : (
                                    <Link href="/kyc">
                                        <Button size="icon" className="rounded-full bg-primary hover:bg-primary/90 h-8 w-8">
                                            <Pencil className="h-4 w-4 text-primary-foreground" />
                                        </Button>
                                    </Link>
                                )}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <div className="flex items-center gap-2">
                                     <label htmlFor="username" className="text-sm font-medium text-muted-foreground">Username</label>
                                     {isKycVerified && <ShieldCheck className="h-4 w-4 text-blue-500" />}
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className="flex-grow relative">
                                        <Input 
                                            id="username" 
                                            type="text" 
                                            value={isEditingUsername ? tempUsername : username} 
                                            onChange={(e) => setTempUsername(e.target.value)}
                                            readOnly={!isEditingUsername}
                                            className={cn("bg-muted")}
                                        />
                                    </div>
                                    <Button onClick={handleEditUsername}>{isEditingUsername ? <Check /> : <Pencil />}</Button>
                                </div>
                            </div>
                            <div>
                                <label htmlFor="email" className="text-sm font-medium text-muted-foreground">Email</label>
                                <Input id="email" type="text" value={user.email || ''} className="mt-1 bg-muted" readOnly />
                            </div>
                             <div>
                                <label htmlFor="phone" className="text-sm font-medium text-muted-foreground">Phone</label>
                                <Input id="phone" type="text" value={appUser.phone || ''} className="mt-1 bg-muted" readOnly />
                            </div>
                        </div>
                        
                        {!isKycVerified ? (
                            <Card className="bg-destructive/10 border-destructive/50">
                                <CardContent className="p-3 flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <AlertCircle className="h-5 w-5 text-destructive" />
                                        <span className="font-semibold text-destructive">KYC Not Verified</span>
                                    </div>
                                    <Link href="/kyc">
                                        <Button variant="destructive" size="sm">Complete Now</Button>
                                    </Link>
                                </CardContent>
                            </Card>
                        ) : (
                             <Card className="bg-green-600/10 border-green-600/50">
                                <CardContent className="p-3">
                                     <div className="flex items-center gap-2">
                                        <ShieldCheck className="h-5 w-5 text-green-600"/>
                                        <span className="font-semibold text-green-700 dark:text-green-500">KYC Verified</span>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-center text-xl font-semibold text-red-600">Metrics</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                            <MetricCard icon={<BarChart2 className="h-4 w-4" />} label="Games Played" value={appUser.gameStats?.played || 0} />
                            <MetricCard 
                                label="Chips Won" 
                                value={`${(appUser.lifetimeStats?.totalWinnings || 0).toFixed(2)}`} 
                            />
                            <MetricCard label="Referral Earning" value={`${(appUser.referralStats?.totalEarnings || 0).toFixed(2)}`} />
                            <MetricCard label="Penalty" value={`0`} />
                        </div>
                    </CardContent>
                </Card>

                <Button onClick={handleLogout} variant="destructive" className="w-full font-bold text-lg py-6">
                    LOG OUT
                </Button>

                {/* Spacer to prevent content from being hidden by the fixed bottom nav */}
                <div className="h-20 md:hidden" />
            </main>
        </div>
    );
}
