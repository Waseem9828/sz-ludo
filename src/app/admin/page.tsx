
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { DollarSign, Users, Wallet, TrendingUp, Loader } from 'lucide-react';
import ChallengeList from '@/components/play/challenge-list';
import BattleList from '@/components/play/battle-list';
import { listenForAllTransactions, Transaction, TransactionStatus, TransactionType } from '@/lib/firebase/transactions';
import { useToast } from '@/hooks/use-toast';
import { AppUser, listenForAllUsers } from '@/lib/firebase/users';
import Link from 'next/link';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import type { ChartConfig } from '@/components/ui/chart';

const chartData = [
  { month: 'Jan', deposits: 4000, withdrawals: 2400 },
  { month: 'Feb', deposits: 3000, withdrawals: 1398 },
  { month: 'Mar', deposits: 2000, withdrawals: 9800 },
  { month: 'Apr', deposits: 2780, withdrawals: 3908 },
  { month: 'May', deposits: 1890, withdrawals: 4800 },
  { month: 'Jun', deposits: 2390, withdrawals: 3800 },
];

const chartConfig = {
  deposits: {
    label: 'Deposits',
    color: 'hsl(var(--chart-2))',
  },
  withdrawals: {
    label: 'Withdrawals',
    color: 'hsl(var(--destructive))',
  },
} satisfies ChartConfig;

const getStatusBadgeVariant = (status: TransactionStatus) => {
    switch (status) {
        case 'approved':
        case 'completed':
            return 'default';
        case 'pending':
            return 'secondary';
        case 'rejected':
        case 'failed':
            return 'destructive';
        default:
            return 'outline';
    }
};

const getTypeBadgeVariant = (type: TransactionType) => {
    return type === 'deposit' ? 'secondary' : 'default';
}

export default function AdminDashboardPage() {
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [kpiData, setKpiData] = useState([
    { title: 'Total Revenue', value: '₹0', change: '', icon: DollarSign },
    { title: 'Total Withdrawals', value: '₹0', change: '', icon: Wallet },
    { title: 'Active Users', value: '0', change: '', icon: Users },
    { title: 'Total Signups', value: '0', change: '', icon: TrendingUp },
  ]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
      const unsubscribeTransactions = listenForAllTransactions(
          10, // Fetch last 10 transactions
          (transactions) => {
              setRecentTransactions(transactions);
          },
          (error) => toast({ title: "Error", description: `Could not fetch transactions: ${error.message}`, variant: "destructive" })
      );

      const unsubscribeUsers = listenForAllUsers(
          (users) => {
            const totalSignups = users.length;
            const activeUsers = users.filter(u => u.status === 'active').length;
            const totalWithdrawals = users.reduce((sum, user) => sum + (user.lifetimeStats?.totalWithdrawals || 0), 0);
            
            setKpiData(prev => [
                prev[0], // Keep revenue for now
                { ...prev[1], value: `₹${totalWithdrawals.toLocaleString()}`},
                { ...prev[2], value: activeUsers.toLocaleString()},
                { ...prev[3], value: totalSignups.toLocaleString()},
            ]);
            setLoading(false);
          },
          (error) => toast({ title: "Error", description: `Could not fetch users: ${error.message}`, variant: "destructive" })
      );

      return () => {
          unsubscribeTransactions();
          unsubscribeUsers();
      };
  }, [toast]);
  
   if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader className="h-16 w-16 animate-spin" />
      </div>
    );
  }

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
                   <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
                     <BarChart data={chartData} accessibilityLayer>
                        <CartesianGrid vertical={false} />
                        <XAxis 
                          dataKey="month" 
                          tickLine={false} 
                          tickMargin={10} 
                          axisLine={false}
                          tickFormatter={(value) => value.slice(0,3)}
                        />
                        <YAxis 
                          tickLine={false}
                          axisLine={false}
                          tickMargin={10}
                          tickFormatter={(value) => `₹${value / 1000}k`}
                        />
                        <ChartTooltip 
                           cursor={false}
                           content={<ChartTooltipContent indicator="dot" />} 
                        />
                        <Legend />
                        <Bar dataKey="deposits" fill="var(--color-deposits)" radius={4} />
                        <Bar dataKey="withdrawals" fill="var(--color-withdrawals)" radius={4} />
                     </BarChart>
                   </ChartContainer>
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
                                    <TableCell>
                                      <Link href={`/admin/users/${tx.userId}`} className="hover:underline">
                                        {tx.userName}
                                      </Link>
                                    </TableCell>
                                    <TableCell>₹{tx.amount}</TableCell>
                                    <TableCell><Badge variant={getTypeBadgeVariant(tx.type)}>{tx.type.replace(/_/g, ' ')}</Badge></TableCell>
                                    <TableCell><Badge variant={getStatusBadgeVariant(tx.status)}>{tx.status}</Badge></TableCell>
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
