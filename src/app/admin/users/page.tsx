
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MoreVertical, User, Wallet, Shield, TrendingUp, TrendingDown, Gamepad2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const sampleUsers = [
  { id: '1', name: 'NSXKW...', email: 'nsxkw@example.com', phone: '123-456-7890', wallet: { deposit: 100, winning: 50 }, kycStatus: 'Verified', avatar: 'https://placehold.co/40x40.png', totalDeposits: 500, totalWithdrawals: 200, gamesPlayed: 50, gamesWon: 30, gamesLost: 20 },
  { id: '2', name: 'cuvbd...', email: 'cuvbd@example.com', phone: '234-567-8901', wallet: { deposit: 250, winning: 450 }, kycStatus: 'Pending', avatar: 'https://placehold.co/40x40.png', totalDeposits: 1000, totalWithdrawals: 300, gamesPlayed: 80, gamesWon: 60, gamesLost: 20 },
  { id: '3', name: 'IfffN...', email: 'ifffn@example.com', phone: '345-678-9012', wallet: { deposit: 50, winning: 150 }, kycStatus: 'Verified', avatar: 'https://placehold.co/40x40.png', totalDeposits: 200, totalWithdrawals: 50, gamesPlayed: 25, gamesWon: 15, gamesLost: 10 },
  { id: '4', name: 'Mohit...', email: 'mohit@example.com', phone: '456-789-0123', wallet: { deposit: 1000, winning: 3500 }, kycStatus: 'Rejected', avatar: 'https://placehold.co/40x40.png', totalDeposits: 5000, totalWithdrawals: 1500, gamesPlayed: 120, gamesWon: 90, gamesLost: 30 },
  { id: '5', name: 'Sahil...', email: 'sahil@example.com', phone: '567-890-1234', wallet: { deposit: 0, winning: 650 }, kycStatus: 'Verified', avatar: 'https://placehold.co/40x40.png', totalDeposits: 800, totalWithdrawals: 150, gamesPlayed: 40, gamesWon: 25, gamesLost: 15 },
];


export default function UsersPage() {
    const [users, setUsers] = useState(sampleUsers);

    const getKycBadgeVariant = (status: string) => {
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
    <Card>
      <CardHeader>
        <CardTitle className="text-red-600">User Analytics</CardTitle>
        <CardDescription>A detailed overview of all users and their activities.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Wallet (Dep / Win)</TableHead>
              <TableHead>Lifetime (Dep / With)</TableHead>
              <TableHead>Game Stats (P / W / L)</TableHead>
              <TableHead>KYC Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                    <div className="flex items-center gap-3">
                        <Avatar>
                            <AvatarImage src={user.avatar} alt={user.name} data-ai-hint="avatar person"/>
                            <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <div className="font-medium">{user.name}</div>
                            <div className="text-muted-foreground text-xs">{user.email}</div>
                        </div>
                    </div>
                </TableCell>
                <TableCell>
                    <div className="flex items-center gap-1">
                        <Wallet className="text-muted-foreground" size={16}/>
                        <span>₹{user.wallet.deposit} / ₹{user.wallet.winning}</span>
                    </div>
                </TableCell>
                <TableCell>
                     <div className="space-y-1">
                        <div className="flex items-center gap-1 text-green-600">
                           <TrendingUp size={16}/>
                           <span>₹{user.totalDeposits}</span>
                        </div>
                        <div className="flex items-center gap-1 text-red-600">
                           <TrendingDown size={16}/>
                           <span>₹{user.totalWithdrawals}</span>
                        </div>
                     </div>
                </TableCell>
                 <TableCell>
                    <div className="flex items-center gap-1">
                        <Gamepad2 className="text-muted-foreground" size={16} />
                        <span>{user.gamesPlayed} / {user.gamesWon} / {user.gamesLost}</span>
                    </div>
                </TableCell>
                <TableCell>
                    <Badge variant={getKycBadgeVariant(user.kycStatus) as any}>{user.kycStatus}</Badge>
                </TableCell>
                <TableCell className="text-right">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem><User className="mr-2 h-4 w-4"/>View Profile</DropdownMenuItem>
                            <DropdownMenuItem><Wallet className="mr-2 h-4 w-4"/>Adjust Wallet</DropdownMenuItem>
                            <DropdownMenuItem><Shield className="mr-2 h-4 w-4"/>Update KYC</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
