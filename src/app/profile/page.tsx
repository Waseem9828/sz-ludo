
'use client'

import React, { useState } from 'react';
import Header from "@/components/play/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { AlertCircle, ArrowUp, BarChart2, Gift, Pencil, Trophy } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const MetricCard = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) => (
    <Card className="bg-gray-50">
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
    const [username, setUsername] = useState("Waseem_Akram21");
    const [isEditingUsername, setIsEditingUsername] = useState(false);
    const [tempUsername, setTempUsername] = useState(username);

    const handleEditUsername = () => {
        if (isEditingUsername) {
            setUsername(tempUsername);
            toast({
                title: 'Username Updated',
                description: `Your username has been changed to ${tempUsername}`,
            });
        }
        setIsEditingUsername(!isEditingUsername);
    };

    const handleLogout = () => {
        toast({
            title: 'Logged Out',
            description: 'You have been successfully logged out.',
        });
        router.push('/'); 
    };
    
    return (
        <div className="flex flex-col min-h-screen bg-gray-100 font-body">
            <Header />
            <main className="flex-grow container mx-auto px-4 py-6 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-center text-xl font-semibold">Profile</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex justify-center relative w-24 h-24 mx-auto">
                            <Avatar className="w-24 h-24 border-4 border-white shadow-md">
                                <AvatarImage src="https://placehold.co/96x96.png" alt="Waseem Akram" data-ai-hint="avatar person" />
                                <AvatarFallback>WA</AvatarFallback>
                            </Avatar>
                            <Button size="icon" className="absolute bottom-0 right-0 rounded-full bg-gray-800 hover:bg-gray-900 h-8 w-8">
                                <Pencil className="h-4 w-4 text-white" />
                            </Button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label htmlFor="username" className="text-sm font-medium text-muted-foreground">Username</label>
                                <div className="flex items-center gap-2 mt-1">
                                    <Input 
                                        id="username" 
                                        type="text" 
                                        value={isEditingUsername ? tempUsername : username} 
                                        onChange={(e) => setTempUsername(e.target.value)}
                                        readOnly={!isEditingUsername}
                                        className={isEditingUsername ? "bg-white" : "bg-gray-200"}
                                    />
                                    <Button onClick={handleEditUsername} className="bg-gray-800 text-white">{isEditingUsername ? 'Save' : 'Edit'}</Button>
                                </div>
                            </div>
                            <div>
                                <label htmlFor="phone" className="text-sm font-medium text-muted-foreground">Phone</label>
                                <Input id="phone" type="text" defaultValue="9828786246" className="mt-1 bg-gray-200" readOnly />
                            </div>
                        </div>

                        <Card className="bg-red-100 border-red-300">
                            <CardContent className="p-3 flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <AlertCircle className="h-5 w-5 text-red-600" />
                                    <span className="font-semibold text-red-800">KYC Pending</span>
                                </div>
                                <Link href="/kyc">
                                    <Button variant="destructive" size="sm">Complete Here</Button>
                                </Link>
                            </CardContent>
                        </Card>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-center text-xl font-semibold">Metrics</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                            <MetricCard icon={<BarChart2 className="h-4 w-4" />} label="Games Played" value="0" />
                            <MetricCard icon={<Trophy className="h-4 w-4" />} label="Chips Won" value="₹0" />
                            <MetricCard icon={<Gift className="h-4 w-4" />} label="Referal Earning" value="₹0" />
                            <MetricCard icon={<ArrowUp className="h-4 w-4" />} label="Penalty" value="₹0" />
                        </div>
                    </CardContent>
                </Card>

                <Button onClick={handleLogout} variant="outline" className="w-full border-red-500 text-red-500 hover:bg-red-500 hover:text-white font-bold text-lg py-6">
                    LOG OUT
                </Button>
            </main>
        </div>
    );
}
