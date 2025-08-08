
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { listenForAllUsers, AppUser, updateUserWallet } from '@/lib/firebase/users';
import { Loader, Plus, TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
            toast({ title: 'Success', description: `Successfully added ₹${numericAmount} to ${agent.displayName}'s wallet.` });
            onUpdate(); // Trigger a re-fetch or state update in the parent
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
                    <Label htmlFor="amount">Amount to Add (₹)</Label>
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
                    <DialogClose asChild>
                        <Button onClick={handleFundAgent} disabled={isSubmitting}>
                            {isSubmitting ? 'Adding...' : 'Confirm'}
                        </Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default function AgentsPage() {
    const [agents, setAgents] = useState<AppUser[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    const fetchAgents = () => {
        listenForAllUsers(
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
            'finance' // Filter by role in the listener
        );
    };

    useEffect(() => {
        const unsubscribe = fetchAgents();
        // The listener itself is the subscription, so we can return its unsubscribe function
        // However, since listenForAllUsers is not returning unsubscribe directly, we'll just call it.
        // This is a simplified approach. For production, the listener should return its own unsubscribe.
    }, [toast]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full">
                <Loader className="h-16 w-16 animate-spin" />
            </div>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Agent Management</CardTitle>
                <CardDescription>
                    Manage funds for your finance agents who handle payouts.
                </CardDescription>
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
                                    <TableCell>
                                        <div className="flex items-center gap-2 font-bold text-lg whitespace-nowrap">
                                            <Wallet className="h-5 w-5 text-muted-foreground" />
                                            <span>₹{(agent.agentWallet?.balance || 0).toFixed(2)}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2 text-green-600 whitespace-nowrap">
                                            <TrendingUp className="h-5 w-5" />
                                            <span>₹{(agent.agentWallet?.totalIn || 0).toFixed(2)}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2 text-red-600 whitespace-nowrap">
                                            <TrendingDown className="h-5 w-5" />
                                            <span>₹{(agent.agentWallet?.totalOut || 0).toFixed(2)}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <AddFundsDialog agent={agent} onUpdate={fetchAgents} />
                                    </TableCell>
                                </TableRow>
                            ))}
                            {agents.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                                        No finance agents found. You can assign the 'finance' role to users in Firestore.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}
