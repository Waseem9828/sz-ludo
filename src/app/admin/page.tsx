
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { DollarSign, Users, Wallet, TrendingUp, Loader } from 'lucide-react';
import ChallengeList from '@/components/play/challenge-list';
import BattleList from '@/components/play/battle-list';
import { listenForAllTransactions, Transaction, TransactionStatus, TransactionType } from '@/lib/firebase/transactions';
import { useToast } from '@/hooks/use-toast';
import { AppUser, listenForAllUsers } from '@/lib/firebase/users';
import Link from 'next/link';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import type { ChartConfig } from '@/components/ui/chart';
import { Game, listenForCompletedGames } from '@/lib/firebase/games';
import { subMonths, format, getYear, getMonth, isAfter } from 'date-fns';
import { useAuth } from '@/context/auth-context';

const chartConfig = {
  deposits: {
    label: 'Deposits',
    color: 'hsl(var(--chart-1))',
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
  const { appUser } = useAuth(); // Get the admin user
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [kpiData, setKpiData] = useState([
    { title: 'Total Revenue', value: '₹0', icon: DollarSign },
    { title: 'Total Withdrawals', value: '₹0', icon: Wallet },
    { title: 'Active Users', value: '0', icon: Users },
    { title: 'Total Signups', value: '0', icon: TrendingUp },
  ]);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

   useEffect(() => {
        // Update revenue KPI from appUser state
        if (appUser?.lifetimeStats?.totalRevenue) {
            setKpiData(prev => [
                { ...prev[0], value: `₹${appUser.lifetimeStats.totalRevenue.toFixed(2)}`},
                ...prev.slice(1)
            ]);
        }

        const processTransactionDataForChart = (transactions: Transaction[]) => {
            const monthlyData: { [key: string]: { month: string, deposits: number, withdrawals: number } } = {};
            const sixMonthsAgo = subMonths(new Date(), 6);

            // Initialize last 6 months
            for (let i = 5; i >= 0; i--) {
                const d = subMonths(new Date(), i);
                const monthKey = format(d, 'yyyy-MM');
                const monthName = format(d, 'MMM');
                monthlyData[monthKey] = { month: monthName, deposits: 0, withdrawals: 0 };
            }

            transactions.forEach(tx => {
                if (tx.createdAt) {
                    const date = tx.createdAt.toDate();
                    // Client-side filtering for date
                    if (isAfter(date, sixMonthsAgo)) {
                         const monthKey = format(date, 'yyyy-MM');
                        
                        if (monthlyData[monthKey]) {
                            if (tx.type === 'deposit' && (tx.status === 'approved' || tx.status === 'completed')) {
                                monthlyData[monthKey].deposits += tx.amount;
                            } else if (tx.type === 'withdrawal' && (tx.status === 'approved' || tx.status === 'completed')) {
                                monthlyData[monthKey].withdrawals += tx.amount;
                            }
                        }
                    }
                }
            });

            setChartData(Object.values(monthlyData) as any);
        };
        

        const unsubscribeTransactions = listenForAllTransactions(
            (transactions) => {
                setRecentTransactions(transactions)
                setLoading(false); // Transactions are a good indicator for loading state
            },
            (error) => toast({ title: "Error", description: `Could not fetch recent transactions: ${error.message}`, variant: "destructive" }),
            { limitCount: 10 }
        );
        
        // Fetch only completed/approved transactions for chart to reduce load
        const unsubscribeChartTransactions = listenForAllTransactions(
            processTransactionDataForChart,
            (error) => toast({ title: "Error", description: `Could not fetch chart data: ${error.message}`, variant: "destructive" }),
            { statuses: ['completed', 'approved'] }
        );

        const unsubscribeUsers = listenForAllUsers(
            (users) => {
                const totalSignups = users.length;
                const activeUsers = users.filter(u => u.status === 'active').length;
                const totalWithdrawals = users.reduce((sum, user) => sum + (user.lifetimeStats?.totalWithdrawals || 0), 0);
                
                setKpiData(prev => [
                    prev[0], // Revenue is handled separately
                    { ...prev[1], value: `₹${totalWithdrawals.toLocaleString()}`},
                    { ...prev[2], value: activeUsers.toLocaleString()},
                    { ...prev[3], value: totalSignups.toLocaleString()},
                ]);
            },
            (error) => toast({ title: "Error", description: `Could not fetch users: ${error.message}`, variant: "destructive" })
        );

      return () => {
          unsubscribeTransactions();
          unsubscribeChartTransactions();
          unsubscribeUsers();
      };
  }, [toast, appUser]);
  
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
                        <div className="text-2xl font-bold font-sans">{kpi.value}</div>
                    </CardContent>
                </Card>
            ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="lg:col-span-4">
                <CardHeader>
                    <CardTitle>Overview</CardTitle>
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
                          className="font-sans"
                        />
                        <ChartTooltip 
                           cursor={false}
                           content={<ChartTooltipContent indicator="dot" />} 
                        />
                        <Legend content={<ChartTooltipContent hideLabel />} />
                        <Bar dataKey="deposits" fill="var(--color-deposits)" radius={4} />
                        <Bar dataKey="withdrawals" fill="var(--color-withdrawals)" radius={4} />
                     </BarChart>
                   </ChartContainer>
                </CardContent>
            </Card>

             <Card className="lg:col-span-3">
                <CardHeader>
                    <CardTitle>Recent Transactions</CardTitle>
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
                                    <TableCell className="font-sans">₹{tx.amount}</TableCell>
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
                    <CardTitle>🏆 Open Challenges</CardTitle>
                </CardHeader>
                <CardContent>
                    <ChallengeList />
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>⚔️ Ongoing Battles</CardTitle>
                </CardHeader>
                <CardContent>
                    <BattleList />
                </CardContent>
            </Card>
        </div>

    </div>
  );
}
