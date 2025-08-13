
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MoreVertical, User, Wallet, Shield, TrendingUp, TrendingDown, Gamepad2, Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AppUser, listenForAllUsers } from '@/lib/firebase/users';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

const defaultAvatar = "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEi_h6LUuqTTKYsn5TfUZwkI6Aib6Y0tOzQzcoZKstURqxyl-PJXW1DKTkF2cPPNNUbP3iuDNsOBVOYx7p-ZwrodI5w9fyqEwoabj8rU0mLzSbT5GCFUKpfCc4s_LrtHcWFDvvRstCghAfQi5Zfv2fipdZG8h4dU4vGt-eFRn-gS3QTg6_JJKhv0Yysr_ZY/s1600/82126.png";

export default function UsersPage() {
    const [users, setUsers] = useState<AppUser[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = listenForAllUsers(
            (allUsers) => {
                setUsers(allUsers);
                setLoading(false);
            },
            (error) => {
                console.error("Error fetching users: ", error);
                toast({ title: "Error", description: "Could not fetch users.", variant: "destructive" });
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [toast]);


    const getKycBadgeVariant = (status?: string): "default" | "secondary" | "destructive" | "outline" => {
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

    const getStatusBadgeVariant = (status?: string): "default" | "secondary" | "destructive" | "outline" => {
        switch (status) {
            case 'active':
                return 'default';
            case 'suspended':
                return 'destructive';
            default:
                return 'secondary';
        }
    };
    
    const getInitials = (name?: string | null) => {
        return name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U';
    }

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
        <CardTitle>User Analytics</CardTitle>
        <CardDescription>A detailed overview of all users and their activities.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="w-full overflow-x-auto">
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Wallet (Dep / Win)</TableHead>
                <TableHead>Lifetime (Dep / With)</TableHead>
                <TableHead>Game Stats (P / W / L)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>KYC Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {users.map((user) => (
                <TableRow key={user.uid} className="cursor-pointer" onClick={() => router.push(`/admin/users/${user.uid}`)}>
                    <TableCell>
                        <div className="flex items-center gap-3 whitespace-nowrap">
                            <Avatar>
                                <AvatarImage src={user.photoURL || defaultAvatar} alt={user.displayName || 'user'} data-ai-hint="avatar person"/>
                                <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <div className="font-medium">{user.displayName}</div>
                                <div className="text-muted-foreground text-xs">{user.email}</div>
                            </div>
                        </div>
                    </TableCell>
                    <TableCell>
                        <div className="flex items-center gap-1 whitespace-nowrap font-sans">
                            <span>₹{user.wallet?.balance || 0} / ₹{user.wallet?.winnings || 0}</span>
                        </div>
                    </TableCell>
                    <TableCell>
                        <div className="space-y-1">
                            <div className="flex items-center gap-1 text-success whitespace-nowrap font-sans">
                            <TrendingUp size={16}/>
                            <span>
                                ₹{user.lifetimeStats?.totalDeposits || 0}
                            </span>
                            </div>
                            <div className="flex items-center gap-1 text-destructive whitespace-nowrap font-sans">
                            <TrendingDown size={16}/>
                            <span>
                                ₹{user.lifetimeStats?.totalWithdrawals || 0}
                            </span>
                            </div>
                        </div>
                    </TableCell>
                    <TableCell>
                        <div className="flex items-center gap-1 whitespace-nowrap">
                            <Gamepad2 className="text-muted-foreground" size={16} />
                            <span>{user.gameStats?.played || 0} / {user.gameStats?.won || 0} / {user.gameStats?.lost || 0}</span>
                        </div>
                    </TableCell>
                    <TableCell>
                        <Badge variant={getStatusBadgeVariant(user.status || 'active')}>{user.status || 'active'}</Badge>
                    </TableCell>
                    <TableCell>
                        <Badge variant={getKycBadgeVariant(user.kycStatus || 'Pending')}>{user.kycStatus || 'Pending'}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="icon">
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                                <DropdownMenuItem onClick={() => router.push(`/admin/users/${user.uid}`)}><User className="mr-2 h-4 w-4"/>View Profile</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </TableCell>
                </TableRow>
                ))}
            </TableBody>
            </Table>
        </div>
      </CardContent>
    </Card>
  );
}
