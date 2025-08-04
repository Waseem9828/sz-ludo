
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { getUser, AppUser, updateUserWallet, updateUserKycStatus, updateUserStatus } from '@/lib/firebase/users';
import { listenForUserTransactions, Transaction } from '@/lib/firebase/transactions';
import { SplashScreen } from '@/components/ui/splash-screen';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ChevronLeft, Edit, Wallet, ShieldCheck, User, Gamepad2, TrendingUp, TrendingDown, Check, X, Ban, VenetianMask } from 'lucide-react';
import Link from 'next/link';

const StatCard = ({ title, value, icon: Icon }: { title: string, value: string | number, icon: React.ElementType }) => (
    <div className="flex items-center p-4 bg-muted rounded-lg">
        <Icon className="h-8 w-8 text-muted-foreground mr-4" />
        <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
        </div>
    </div>
);

export default function UserProfilePage() {
    const params = useParams();
    const router = useRouter();
    const { uid } = params;
    const { toast } = useToast();

    const [user, setUser] = useState<AppUser | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    const [isWalletDialogOpen, setIsWalletDialogOpen] = useState(false);
    const [walletAmount, setWalletAmount] = useState('');
    const [walletType, setWalletType] = useState<'balance' | 'winnings'>('balance');
    const [walletNotes, setWalletNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (typeof uid !== 'string') return;

        const fetchUserData = async () => {
            try {
                const userData = await getUser(uid);
                if (userData) {
                    setUser(userData);
                } else {
                    toast({ title: "Error", description: "User not found.", variant: 'destructive' });
                    router.push('/admin/users');
                }
            } catch (error) {
                console.error("Error fetching user data:", error);
                toast({ title: "Error", description: "Failed to fetch user data.", variant: 'destructive' });
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();

        const unsubscribe = listenForUserTransactions(uid, (userTransactions) => {
            setTransactions(userTransactions);
        });

        return () => unsubscribe();

    }, [uid, router, toast]);

    const handleWalletUpdate = async () => {
        if (!user) return;
        const amount = parseFloat(walletAmount);
        if (isNaN(amount)) {
            toast({ title: "Invalid amount", variant: 'destructive' });
            return;
        }

        setIsSubmitting(true);
        try {
            await updateUserWallet(user.uid, amount, walletType, amount > 0 ? 'Admin Credit' : 'Admin Debit', walletNotes);
            toast({ title: "Success", description: "Wallet updated successfully." });
            // Manually update user state to reflect change immediately
            setUser(prevUser => {
                if (!prevUser) return null;
                const newWallet = { ...prevUser.wallet! };
                if (walletType === 'balance') newWallet.balance += amount;
                else newWallet.winnings += amount;
                return { ...prevUser, wallet: newWallet };
            });
            setIsWalletDialogOpen(false);
            setWalletAmount('');
            setWalletNotes('');
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleKycUpdate = async (status: AppUser['kycStatus']) => {
        if (!user) return;
        setIsSubmitting(true);
        try {
            await updateUserKycStatus(user.uid, status);
            toast({ title: "Success", description: `KYC status updated to ${status}.` });
            setUser(prevUser => prevUser ? { ...prevUser, kycStatus: status } : null);
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleUserStatusUpdate = async (status: AppUser['status']) => {
        if (!user) return;
        setIsSubmitting(true);
        try {
            await updateUserStatus(user.uid, status);
            toast({ title: "Success", description: `User status updated to ${status}.` });
            setUser(prevUser => prevUser ? { ...prevUser, status: status } : null);
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    }


    const getInitials = (name?: string | null) => {
        return name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U';
    }

    const getKycBadgeVariant = (status?: string) => {
        switch (status) {
            case 'Verified': return 'default';
            case 'Pending': return 'secondary';
            case 'Rejected': return 'destructive';
            default: return 'outline';
        }
    };
    
    const getStatusBadgeVariant = (status?: string) => {
        switch (status) {
            case 'active': return 'default';
            case 'suspended': return 'destructive';
            default: return 'secondary';
        }
    }

    if (loading) {
        return <SplashScreen />;
    }

    if (!user) {
        return <div className="text-center p-10">User not found.</div>;
    }

    const totalBalance = (user.wallet?.balance || 0) + (user.wallet?.winnings || 0);

    return (
        <div className="space-y-6">
            <Button variant="outline" onClick={() => router.back()}>
                <ChevronLeft className="mr-2 h-4 w-4" /> Back to Users
            </Button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                     <Card>
                        <CardHeader className="flex flex-row items-center space-x-6">
                            <Avatar className="h-24 w-24 border">
                                <AvatarImage src={user.photoURL || undefined} alt={user.displayName || ''} />
                                <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
                            </Avatar>
                            <div className="space-y-1">
                                <CardTitle className="text-3xl">{user.displayName}</CardTitle>
                                <CardDescription>{user.email}</CardDescription>
                                <p className="text-sm text-muted-foreground">{user.phone}</p>
                                <div className="flex items-center gap-2 pt-2">
                                    <Badge variant={getKycBadgeVariant(user.kycStatus)}>{user.kycStatus || 'Pending'}</Badge>
                                    <Badge variant={getStatusBadgeVariant(user.status)}>{user.status || 'active'}</Badge>
                                    <span className="text-xs text-muted-foreground">User ID: {user.uid}</span>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Separator className="my-4" />
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <StatCard title="Total Balance" value={`₹${totalBalance.toFixed(2)}`} icon={Wallet} />
                                <StatCard title="Games Played" value={user.gameStats?.played || 0} icon={Gamepad2} />
                                <StatCard title="Total Deposits" value={`₹${user.lifetimeStats?.totalDeposits || 0}`} icon={TrendingUp} />
                                <StatCard title="Total Withdrawals" value={`₹${user.lifetimeStats?.totalWithdrawals || 0}`} icon={TrendingDown} />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Admin Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-wrap gap-2">
                            <Dialog open={isWalletDialogOpen} onOpenChange={setIsWalletDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button><Wallet className="mr-2 h-4 w-4" /> Adjust Wallet</Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Adjust User Wallet</DialogTitle>
                                        <DialogDescription>
                                            Manually add or remove funds. Use a negative number to subtract.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                        <div>
                                            <Label htmlFor="wallet-amount">Amount</Label>
                                            <Input id="wallet-amount" type="number" value={walletAmount} onChange={e => setWalletAmount(e.target.value)} placeholder="e.g., 100 or -50" />
                                        </div>
                                        <div>
                                            <Label htmlFor="wallet-type">Wallet Type</Label>
                                            <Select onValueChange={(value: 'balance' | 'winnings') => setWalletType(value)} defaultValue={walletType}>
                                                <SelectTrigger id="wallet-type">
                                                    <SelectValue placeholder="Select wallet type" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="balance">Deposit Balance</SelectItem>
                                                    <SelectItem value="winnings">Winnings Balance</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div>
                                            <Label htmlFor="wallet-notes">Notes (Reason)</Label>
                                            <Input id="wallet-notes" value={walletNotes} onChange={e => setWalletNotes(e.target.value)} placeholder="e.g., Bonus credit" />
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                                        <Button onClick={handleWalletUpdate} disabled={isSubmitting}>{isSubmitting ? 'Updating...' : 'Update Wallet'}</Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                            
                            <Button variant="default" onClick={() => handleKycUpdate('Verified')} disabled={user.kycStatus === 'Verified' || isSubmitting}><Check className="mr-2 h-4 w-4" /> Approve KYC</Button>
                            <Button variant="destructive" onClick={() => handleKycUpdate('Rejected')} disabled={user.kycStatus === 'Rejected' || isSubmitting}><X className="mr-2 h-4 w-4" /> Reject KYC</Button>
                            {user.status !== 'suspended' ? (
                                <Button variant="destructive" onClick={() => handleUserStatusUpdate('suspended')} disabled={isSubmitting}>
                                    <Ban className="mr-2 h-4 w-4" /> Suspend User
                                </Button>
                            ) : (
                                <Button variant="default" onClick={() => handleUserStatusUpdate('active')} disabled={isSubmitting}>
                                    <Check className="mr-2 h-4 w-4" /> Un-suspend User
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                </div>
                
                <div className="lg:col-span-1">
                     <Card>
                        <CardHeader>
                            <CardTitle>KYC Details</CardTitle>
                            <CardDescription>Submitted by user for verification.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm">
                            {user.kycStatus === 'Pending' || user.kycStatus === 'Verified' || user.kycStatus === 'Rejected' ? (
                                <>
                                    <div>
                                        <Label className="text-muted-foreground">Aadhaar Number</Label>
                                        <p className="font-semibold">{user.aadhaar || 'Not Provided'}</p>
                                    </div>
                                    <Separator />
                                    <div>
                                        <Label className="text-muted-foreground">PAN Number</Label>
                                        <p className="font-semibold">{user.pan || 'Not Provided'}</p>
                                    </div>
                                    <Separator />
                                    <div>
                                        <Label className="text-muted-foreground">Bank Account Number</Label>
                                        <p className="font-semibold">{user.bankAccount || 'Not Provided'}</p>
                                    </div>
                                    <Separator />
                                    <div>
                                        <Label className="text-muted-foreground">IFSC Code</Label>
                                        <p className="font-semibold">{user.ifsc || 'Not Provided'}</p>
                                    </div>
                                    <Separator />
                                    <div>
                                        <Label className="text-muted-foreground">Bank Name</Label>
                                        <p className="font-semibold">{user.bankName || 'Not Provided'}</p>
                                    </div>
                                     <Separator />
                                    <div>
                                        <Label className="text-muted-foreground">UPI ID</Label>
                                        <p className="font-semibold">{user.upiId || 'Not Provided'}</p>
                                    </div>
                                </>
                            ) : (
                                <p className="text-muted-foreground text-center">User has not submitted KYC details yet.</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Transaction History</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Notes</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {transactions.map(tx => (
                                <TableRow key={tx.id}>
                                    <TableCell>{new Date(tx.createdAt?.toDate()).toLocaleString()}</TableCell>
                                    <TableCell><Badge variant="secondary">{tx.type.replace(/_/g, ' ')}</Badge></TableCell>
                                    <TableCell>₹{tx.amount.toFixed(2)}</TableCell>
                                    <TableCell><Badge>{tx.status}</Badge></TableCell>
                                    <TableCell>{tx.notes || tx.relatedId || 'N/A'}</TableCell>
                                </TableRow>
                            ))}
                             {transactions.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center">No transactions found.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
