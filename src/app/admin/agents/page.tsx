
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { listenForAllUsers, AppUser, updateUserWallet } from '@/lib/firebase/users';
import { Loader, Plus, TrendingDown, TrendingUp, Wallet, User, Check, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/auth-context';
import { Withdrawal, listenForWithdrawalsByAgent, assignWithdrawalToAgent, confirmWithdrawalPayment, listenForPendingWithdrawals } from '@/lib/firebase/withdrawals';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { ScrollArea } from '@/components/ui/scroll-area';

const AddFundsDialog = ({ agent, onUpdate }: { agent: AppUser; onUpdate: () => void }) => {
    const [amount, setAmount] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    const handleFundAgent = async () => {
        const numericAmount = parseFloat(amount);
        if (isNaN(numericAmount) || numericAmount <= 0) {
            toast({ title: 'Invalid Amount', description: 'Please enter a positive number.', variant: 'destructive' });
            return;
        }
        setIsSubmitting(true);
        try {
            await updateUserWallet(agent.uid, numericAmount, 'agent', 'Admin Credit', 'Superadmin fund transfer');
            toast({ title: 'Success', description: `Successfully added funds to ${agent.displayName}'s wallet.` });
            onUpdate();
            setAmount('');
        } catch (error: any) {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" /> Add Funds
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Fund Agent: {agent.displayName}</DialogTitle>
                    <DialogDescription>Add funds to this agent's wallet for processing payouts.</DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <Label htmlFor="amount">Amount to Add</Label>
                    <Input
                        id="amount"
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="e.g., 50000"
                    />
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
                    <Button onClick={handleFundAgent} disabled={isSubmitting}>
                        {isSubmitting ? 'Adding...' : 'Confirm'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};


const SuperAdminView = () => {
    const [agents, setAgents] = useState<AppUser[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    const fetchAgents = () => {
        setLoading(true);
        const unsubscribe = listenForAllUsers(
            (allUsers) => {
                const financeAgents = allUsers.filter(u => u.role === 'finance');
                setAgents(financeAgents);
                setLoading(false);
            },
            (error) => {
                console.error("Error fetching agents: ", error);
                toast({ title: "Error", description: "Could not fetch agents.", variant: "destructive" });
                setLoading(false);
            },
            'finance'
        );
        return unsubscribe;
    };

    useEffect(() => {
        const unsubscribe = fetchAgents();
        return () => unsubscribe();
    }, []);

    if (loading) {
        return <div className="flex justify-center items-center h-full"><Loader className="h-16 w-16 animate-spin" /></div>;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Agent Management</CardTitle>
                <CardDescription>Manage funds for your finance agents who handle payouts.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="w-full overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Agent Name</TableHead>
                                <TableHead>Balance</TableHead>
                                <TableHead>Total In</TableHead>
                                <TableHead>Total Out</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {agents.map((agent) => (
                                <TableRow key={agent.uid}>
                                    <TableCell className="font-medium whitespace-nowrap">{agent.displayName}</TableCell>
                                    <TableCell><div className="flex items-center gap-2 font-bold text-lg whitespace-nowrap font-sans"><Wallet className="h-5 w-5 text-muted-foreground" /><span>₹{(agent.agentWallet?.balance || 0).toFixed(2)}</span></div></TableCell>
                                    <TableCell><div className="flex items-center gap-2 text-success whitespace-nowrap font-sans"><TrendingUp className="h-5 w-5" /><span>₹{(agent.agentWallet?.totalIn || 0).toFixed(2)}</span></div></TableCell>
                                    <TableCell><div className="flex items-center gap-2 text-destructive whitespace-nowrap font-sans"><TrendingDown className="h-5 w-5" /><span>₹{(agent.agentWallet?.totalOut || 0).toFixed(2)}</span></div></TableCell>
                                    <TableCell className="text-right"><AddFundsDialog agent={agent} onUpdate={fetchAgents} /></TableCell>
                                </TableRow>
                            ))}
                            {agents.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No finance agents found.</TableCell></TableRow>}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
};

const FinanceAgentView = () => {
    const { appUser } = useAuth();
    const { toast } = useToast();
    const [assignedPayouts, setAssignedPayouts] = useState<Withdrawal[]>([]);
    const [pendingPayouts, setPendingPayouts] = useState<Withdrawal[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!appUser) return;
        setLoading(true);
        const unsubAssigned = listenForWithdrawalsByAgent(appUser.uid, setAssignedPayouts, (err) => toast({ title: 'Error', description: err.message, variant: 'destructive' }));
        const unsubPending = listenForPendingWithdrawals(setPendingPayouts, (err) => toast({ title: 'Error', description: err.message, variant: 'destructive' }));
        
        Promise.all([new Promise(res => setTimeout(res, 500))]).then(() => setLoading(false));

        return () => {
            unsubAssigned();
            unsubPending();
        }
    }, [appUser, toast]);

    const handleAssign = async (withdrawalId: string) => {
        if (!appUser) return;
        try {
            await assignWithdrawalToAgent(withdrawalId, appUser.uid, appUser.displayName || '');
            toast({ title: "Assigned", description: "Payout assigned to you. Please proceed to pay." });
        } catch (error: any) {
            toast({ title: "Assignment Failed", description: error.message, variant: 'destructive' });
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-full"><Loader className="h-16 w-16 animate-spin" /></div>;
    }

    return (
        <div className="space-y-6">
            <Card>
                 <CardHeader>
                    <CardTitle className="text-lg">Your Agent Wallet</CardTitle>
                 </CardHeader>
                 <CardContent>
                    <p className="text-3xl font-bold text-primary font-sans">
                        ₹{(appUser?.agentWallet?.balance || 0).toFixed(2)}
                    </p>
                    <p className="text-sm text-muted-foreground">Your current balance for processing payouts.</p>
                 </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Your Assigned Payouts</CardTitle>
                    <CardDescription>These are withdrawals assigned to you. Pay them and confirm.</CardDescription>
                </CardHeader>
                <CardContent>
                    <AssignedPayoutsTable payouts={assignedPayouts} />
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle>All Pending Payouts</CardTitle>
                    <CardDescription>Assign these payouts to yourself to process them.</CardDescription>
                </CardHeader>
                <CardContent>
                    <PendingPayoutsTable payouts={pendingPayouts} onAssign={handleAssign} agentBalance={appUser?.agentWallet?.balance || 0} />
                </CardContent>
            </Card>
        </div>
    );
};

const ConfirmPaymentDialog = ({ withdrawal }: { withdrawal: Withdrawal }) => {
    const [utr, setUtr] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    const handleConfirm = async () => {
        if (!utr) {
            toast({ title: "UTR Required", description: "Please enter the transaction ID.", variant: 'destructive' });
            return;
        }
        setIsSubmitting(true);
        try {
            await confirmWithdrawalPayment(withdrawal.id, utr);
            toast({ title: "Payment Confirmed", description: "The withdrawal is marked as complete." });
        } catch (error: any) {
             toast({ title: "Confirmation Failed", description: error.message, variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const upiLink = `upi://pay?pa=${withdrawal.upiId}&pn=${encodeURIComponent(withdrawal.userName)}&am=${withdrawal.amount}&cu=INR`;

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button size="sm">Pay & Confirm</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Confirm Payment</DialogTitle>
                    <DialogDescription>Pay the user via UPI and enter the Transaction ID (UTR) below to confirm.</DialogDescription>
                </DialogHeader>
                <div className="my-4 text-center">
                    <p className="text-muted-foreground">Paying <span className="font-bold">{withdrawal.userName}</span></p>
                    <p className="text-3xl font-bold font-sans">₹{withdrawal.amount}</p>
                    <p className="text-sm text-muted-foreground">to UPI ID: {withdrawal.upiId}</p>
                    <a href={upiLink} className="inline-block mt-2">
                        <Button>Pay with UPI App</Button>
                    </a>
                </div>
                <div className="py-2">
                    <Label htmlFor="utr">Transaction ID (UTR)</Label>
                    <Input id="utr" value={utr} onChange={(e) => setUtr(e.target.value)} placeholder="Enter UTR from your UPI app" />
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
                    <Button onClick={handleConfirm} disabled={isSubmitting}>
                        {isSubmitting ? 'Confirming...' : 'Confirm Payment'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

const AssignedPayoutsTable = ({ payouts }: { payouts: Withdrawal[] }) => (
    <ScrollArea className="h-72">
    <Table>
        <TableHeader><TableRow><TableHead>User</TableHead><TableHead>Amount</TableHead><TableHead>UPI ID</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
        <TableBody>
            {payouts.length === 0 ? <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">No payouts assigned to you.</TableCell></TableRow> : null}
            {payouts.map(w => (
                <TableRow key={w.id}>
                    <TableCell><Link href={`/admin/users/${w.userId}`} className="font-medium hover:underline whitespace-nowrap">{w.userName}</Link></TableCell>
                    <TableCell className="font-sans">₹{w.amount}</TableCell>
                    <TableCell>{w.upiId}</TableCell>
                    <TableCell><ConfirmPaymentDialog withdrawal={w} /></TableCell>
                </TableRow>
            ))}
        </TableBody>
    </Table>
    </ScrollArea>
);

const PendingPayoutsTable = ({ payouts, onAssign, agentBalance }: { payouts: Withdrawal[], onAssign: (id: string) => void, agentBalance: number }) => (
    <ScrollArea className="h-72">
     <Table>
        <TableHeader><TableRow><TableHead>User</TableHead><TableHead>Amount</TableHead><TableHead>Date</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
        <TableBody>
            {payouts.length === 0 ? <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">No pending payouts available.</TableCell></TableRow> : null}
            {payouts.map(w => {
                const canAfford = agentBalance >= w.amount;
                return (
                    <TableRow key={w.id}>
                        <TableCell><Link href={`/admin/users/${w.userId}`} className="font-medium hover:underline whitespace-nowrap">{w.userName}</Link></TableCell>
                        <TableCell className="font-sans">₹{w.amount}</TableCell>
                        <TableCell className="text-xs whitespace-nowrap">{new Date(w.createdAt?.toDate()).toLocaleString()}</TableCell>
                        <TableCell>
                            <Button size="sm" variant="outline" onClick={() => onAssign(w.id)} disabled={!canAfford}>
                                {!canAfford ? 'Insuff. Funds' : 'Assign to Me'}
                            </Button>
                        </TableCell>
                    </TableRow>
                )
            })}
        </TableBody>
    </Table>
    </ScrollArea>
);

export default function AgentsPage() {
    const { appUser } = useAuth();
    if (!appUser) return <div className="flex justify-center items-center h-full"><Loader className="h-16 w-16 animate-spin" /></div>;

    if (appUser.role === 'superadmin') {
        return <SuperAdminView />;
    }
    if (appUser.role === 'finance') {
        return <FinanceAgentView />;
    }

    return <Card><CardContent><p>You do not have permission to view this page.</p></CardContent></Card>;
}
