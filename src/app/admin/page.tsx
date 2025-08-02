
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { BarChart, LineChart, XAxis, YAxis, Tooltip, Legend, Bar, Line, CartesianGrid, ResponsiveContainer } from 'recharts';
import { DollarSign, Users, Wallet, TrendingUp } from 'lucide-react';
import ChallengeList from '@/components/play/challenge-list';
import BattleList from '@/components/play/battle-list';


const kpiData = [
    { title: 'Total Revenue', value: '₹4,231', change: '+20.1% from last month', icon: DollarSign },
    { title: 'Total Withdrawals', value: '₹23,500', change: '+180.1% from last month', icon: Wallet },
    { title: 'Active Users', value: '+2350', change: '+19% from last month', icon: Users },
    { title: 'Total Signups', value: '573', change: '+201 since last hour', icon: TrendingUp },
]

const chartData = [
  { name: 'Jan', deposits: 4000, withdrawals: 2400 },
  { name: 'Feb', deposits: 3000, withdrawals: 1398 },
  { name: 'Mar', deposits: 2000, withdrawals: 9800 },
  { name: 'Apr', deposits: 2780, withdrawals: 3908 },
  { name: 'May', deposits: 1890, withdrawals: 4800 },
  { name: 'Jun', deposits: 2390, withdrawals: 3800 },
];

const recentTransactions = [
    { id: 'txn1', user: 'NSXKW...', amount: '₹200', type: 'Withdrawal', status: 'Approved' },
    { id: 'txn2', user: 'cuvbd...', amount: '₹500', type: 'Deposit', status: 'Completed' },
    { id: 'txn3', user: 'Sahil...', amount: '₹150', type: 'Withdrawal', status: 'Pending' },
    { id: 'txn4', user: 'Mohit...', amount: '₹1000', type: 'Deposit', status: 'Completed' },
    { id: 'txn5', user: 'IfffN...', amount: '₹300', type: 'Withdrawal', status: 'Rejected' },
]

const getStatusBadgeVariant = (status: string) => {
    switch (status) {
        case 'Approved':
        case 'Completed':
            return 'default';
        case 'Pending':
            return 'secondary';
        case 'Rejected':
            return 'destructive';
        default:
            return 'outline';
    }
};

const getTypeBadgeVariant = (type: string) => {
    return type === 'Deposit' ? 'secondary' : 'default';
}

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {kpiData.map(kpi => (
                 <Card key={kpi.title}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
                        <kpi.icon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{kpi.value}</div>
                        <p className="text-xs text-muted-foreground">{kpi.change}</p>
                    </CardContent>
                </Card>
            ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="lg:col-span-4">
                <CardHeader>
                    <CardTitle className="text-red-600">Overview</CardTitle>
                </CardHeader>
                <CardContent className="pl-2">
                   <ResponsiveContainer width="100%" height={350}>
                     <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="deposits" fill="var(--color-deposits, hsl(var(--primary)))" name="Deposits" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="withdrawals" fill="var(--color-withdrawals, hsl(var(--destructive)))" name="Withdrawals" radius={[4, 4, 0, 0]} />
                     </BarChart>
                   </ResponsiveContainer>
                </CardContent>
            </Card>

             <Card className="lg:col-span-3">
                <CardHeader>
                    <CardTitle className="text-red-600">Recent Transactions</CardTitle>
                </CardHeader>
                <CardContent>
                     <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>User</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {recentTransactions.map(tx => (
                                <TableRow key={tx.id}>
                                    <TableCell>{tx.user}</TableCell>
                                    <TableCell>{tx.amount}</TableCell>
                                    <TableCell><Badge variant={getTypeBadgeVariant(tx.type) as any}>{tx.type}</Badge></TableCell>
                                    <TableCell><Badge variant={getStatusBadgeVariant(tx.status) as any}>{tx.status}</Badge></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle className="text-red-600">🏆 Open Challenges</CardTitle>
                </CardHeader>
                <CardContent>
                    <ChallengeList />
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle className="text-red-600">⚔️ Ongoing Battles</CardTitle>
                </CardHeader>
                <CardContent>
                    <BattleList />
                </CardContent>
            </Card>
        </div>

    </div>
  );
}
