
'use client'

import React, { useState, useEffect } from 'react';
import Header from "@/components/play/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { AlertCircle, ArrowUp, BarChart2, Gift, Pencil, Trophy, ShieldCheck } from "lucide-react";
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

const MetricCard = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: string | number }) => (
    <Card className="bg-secondary/50">
        <CardContent className="p-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {icon}
                <span>{label}</span>
            </div>
            <p className="text-lg font-bold mt-1">{value}</p>
        </CardContent>
    </Card>
);

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

    const getKycBadgeVariant = (status?: 'Pending' | 'Verified' | 'Rejected') => {
        switch (status) {
            case 'Verified':
                return 'default';
            case 'Pending':
                return 'secondary';
            case 'Rejected':
                return 'destructive';
            default:
                return 'outline';
        }
    };

    const getInitials = (name: string) => {
        return name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U';
    }
    
    return (
        <div className="flex flex-col min-h-screen bg-background font-body">
            <Header />
            <main className="flex-grow container mx-auto px-4 py-6 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-center text-xl font-semibold text-red-600 animate-shine">Profile</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex justify-center relative w-24 h-24 mx-auto">
                            <Avatar className="w-24 h-24 border-4 border-white shadow-md">
                                <AvatarImage src={user.photoURL || `https://placehold.co/96x96.png`} alt={username} data-ai-hint="avatar person" />
                                <AvatarFallback>{getInitials(username)}</AvatarFallback>
                            </Avatar>
                            <Button size="icon" className="absolute bottom-0 right-0 rounded-full bg-primary hover:bg-primary/90 h-8 w-8">
                                <Pencil className="h-4 w-4 text-primary-foreground" />
                            </Button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label htmlFor="username" className="text-sm font-medium text-muted-foreground">Username</label>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className="flex-grow relative">
                                        <Input 
                                            id="username" 
                                            type="text" 
                                            value={isEditingUsername ? tempUsername : username} 
                                            onChange={(e) => setTempUsername(e.target.value)}
                                            readOnly={!isEditingUsername}
                                            className={cn(
                                                isEditingUsername ? "bg-card" : "bg-muted",
                                                isKycVerified && !isEditingUsername ? "pr-8" : ""
                                            )}
                                        />
                                        {isKycVerified && !isEditingUsername && (
                                            <ShieldCheck className="absolute right-2 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-500 fill-current" />
                                        )}
                                    </div>
                                    <Button onClick={handleEditUsername}>{isEditingUsername ? 'Save' : 'Edit'}</Button>
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
                        <CardTitle className="text-center text-xl font-semibold text-red-600 animate-shine">Metrics</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                            <MetricCard icon={<BarChart2 className="h-4 w-4" />} label="Games Played" value={appUser.gameStats?.played || 0} />
                            <MetricCard icon={<Trophy className="h-4 w-4" />} label="Chips Won" value={`₹${(appUser.lifetimeStats?.totalWinnings || 0).toFixed(2)}`} />
                            <MetricCard icon={<Gift className="h-4 w-4" />} label="Referal Earning" value="₹0" />
                            <MetricCard icon={<ArrowUp className="h-4 w-4" />} label="Penalty" value="₹0" />
                        </div>
                    </CardContent>
                </Card>

                <Button onClick={handleLogout} variant="destructive" className="w-full font-bold text-lg py-6">
                    LOG OUT
                </Button>
            </main>
        </div>
    );
}
