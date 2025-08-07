
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { getUser, AppUser, updateUserKycStatus, updateUserStatus, updateUserWallet } from '@/lib/firebase/users';
import { listenForUserTransactions, Transaction, TransactionType } from '@/lib/firebase/transactions';
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
import { ChevronLeft, Edit, Wallet, ShieldCheck, User, Gamepad2, TrendingUp, TrendingDown, Check, X, Ban, VenetianMask, Plus, Minus, AlertTriangle, FileText } from 'lucide-react';
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

const WalletAdjustmentDialog = ({ user, onUpdate }: { user: AppUser, onUpdate: (user: AppUser) => void }) => {
    const [amount, setAmount] = useState('');
    const [type, setType] = useState<'credit' | 'debit'>('credit');
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    const handleWalletUpdate = async () => {
        const numericAmount = parseFloat(amount);
        if (isNaN(numericAmount) || numericAmount <= 0) {
            toast({ title: 'Invalid Amount', description: 'Please enter a valid positive amount.', variant: 'destructive' });
            return;
        }
        if (!notes) {
            toast({ title: 'Notes Required', description: 'Please provide a reason for this adjustment.', variant: 'destructive' });
            return;
        }

        setIsSubmitting(true);
        try {
            const finalAmount = type === 'credit' ? numericAmount : -numericAmount;
            const transactionType = type === 'credit' ? 'Admin Credit' : 'Admin Debit';
            
            await updateUserWallet(user.uid, finalAmount, 'balance', transactionType, `Admin: ${notes}`);
            
            const updatedUser = await getUser(user.uid);
            if (updatedUser) {
              onUpdate(updatedUser);
            }
            
            toast({ title: 'Wallet Updated', description: `Successfully adjusted ${user.displayName}'s wallet.` });
            setAmount('');
            setNotes('');
        } catch (error: any) {
            toast({ title: 'Update Failed', description: error.message, variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline"><Wallet className="mr-2 h-4 w-4" />Adjust Wallet</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Adjust Wallet for {user.displayName}</DialogTitle>
                    <DialogDescription>Manually credit or debit funds from the user's deposit balance.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <Select onValueChange={(value: 'credit' | 'debit') => setType(value)} defaultValue={type}>
                        <SelectTrigger><SelectValue placeholder="Select action type" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="credit">Credit (Add Funds)</SelectItem>
                            <SelectItem value="debit">Debit (Remove Funds)</SelectItem>
                        </SelectContent>
                    </Select>
                     <div className="space-y-2">
                        <Label htmlFor="amount">Amount (₹)</Label>
                        <Input id="amount" type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="e.g., 100" />
                     </div>
                      <div className="space-y-2">
                        <Label htmlFor="notes">Notes/Reason</Label>
                        <Input id="notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g., Bonus for contest" />
                     </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
                    <DialogClose asChild><Button onClick={handleWalletUpdate} disabled={isSubmitting}>Confirm Adjustment</Button></DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

const PenaltyDialog = ({ user, onUpdate }: { user: AppUser, onUpdate: (user: AppUser) => void }) => {
    const [amount, setAmount] = useState('');
    const [reason, setReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();
    
    const handlePenalty = async () => {
        const numericAmount = parseFloat(amount);
        if (isNaN(numericAmount) || numericAmount <= 0) {
            toast({ title: 'Invalid Amount', description: 'Please enter a valid penalty amount.', variant: 'destructive' });
            return;
        }
         if (!reason) {
            toast({ title: 'Reason Required', description: 'Please provide a reason for this penalty.', variant: 'destructive' });
            return;
        }
        
        setIsSubmitting(true);
        try {
            await updateUserWallet(user.uid, -numericAmount, 'balance', 'penalty', `Penalty: ${reason}`);
             const updatedUser = await getUser(user.uid);
            if (updatedUser) {
              onUpdate(updatedUser);
            }
            toast({ title: 'Penalty Applied', description: `₹${numericAmount} has been deducted from ${user.displayName}'s wallet.` });
            setAmount('');
            setReason('');
        } catch (error: any) {
             toast({ title: 'Penalty Failed', description: error.message, variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="destructive"><AlertTriangle className="mr-2 h-4 w-4" />Apply Penalty</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Apply Penalty to {user.displayName}</DialogTitle>
                    <DialogDescription>Deduct funds from the user's wallet for rule violations. This action is logged.</DialogDescription>
                </DialogHeader>
                 <div className="space-y-4 py-4">
                     <div className="space-y-2">
                        <Label htmlFor="penalty-amount">Penalty Amount (₹)</Label>
                        <Input id="penalty-amount" type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="e.g., 50" />
                     </div>
                      <div className="space-y-2">
                        <Label htmlFor="penalty-reason">Reason</Label>
                        <Input id="penalty-reason" value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g., Wrong screenshot submitted" />
                     </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
                    <DialogClose asChild><Button variant="destructive" onClick={handlePenalty} disabled={isSubmitting}>Confirm Penalty</Button></DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}


export default function UserProfilePage() {
    const params = useParams();
    const router = useRouter();
    const { uid } = params;
    const { toast } = useToast();

    const [user, setUser] = useState<AppUser | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

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

    const handleGenerateReport = () => {
        // This is a placeholder for the future PDF generation logic
        toast({
            title: "Feature Coming Soon",
            description: "PDF report generation is not yet implemented.",
        });
    };


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
                            <WalletAdjustmentDialog user={user} onUpdate={setUser} />
                            <PenaltyDialog user={user} onUpdate={setUser} />
                             <Button variant="secondary" onClick={handleGenerateReport}>
                                <FileText className="mr-2 h-4 w-4" /> Generate Report
                            </Button>
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
