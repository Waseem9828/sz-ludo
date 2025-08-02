
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// In a real app, this data would be fetched from Firestore
const sampleUsers = [
  { id: '1', name: 'NSXKW...', email: 'nsxkw@example.com', phone: '123-456-7890', wallet: { deposit: 100, winning: 50 }, kycStatus: 'Verified', avatar: 'https://placehold.co/40x40.png' },
  { id: '2', name: 'cuvbd...', email: 'cuvbd@example.com', phone: '234-567-8901', wallet: { deposit: 250, winning: 450 }, kycStatus: 'Pending', avatar: 'https://placehold.co/40x40.png' },
  { id: '3', name: 'IfffN...', email: 'ifffn@example.com', phone: '345-678-9012', wallet: { deposit: 50, winning: 150 }, kycStatus: 'Verified', avatar: 'https://placehold.co/40x40.png' },
  { id: '4', name: 'Mohit...', email: 'mohit@example.com', phone: '456-789-0123', wallet: { deposit: 1000, winning: 3500 }, kycStatus: 'Rejected', avatar: 'https://placehold.co/40x40.png' },
  { id: '5', name: 'Sahil...', email: 'sahil@example.com', phone: '567-890-1234', wallet: { deposit: 0, winning: 650 }, kycStatus: 'Verified', avatar: 'https://placehold.co/40x40.png' },
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
        <CardTitle className="text-red-600">User Management</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Wallet (Deposit / Winning)</TableHead>
              <TableHead>KYC Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                    <div className="flex items-center gap-3">
                        <Avatar>
                            <AvatarImage src={user.avatar} alt={user.name} data-ai-hint="avatar person" />
                            <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                        </Avatar>
                        <div className="font-medium">{user.name}</div>
                    </div>
                </TableCell>
                <TableCell>
                    <div>{user.email}</div>
                    <div className="text-muted-foreground text-sm">{user.phone}</div>
                </TableCell>
                <TableCell>₹{user.wallet.deposit} / ₹{user.wallet.winning}</TableCell>
                <TableCell>
                    <Badge variant={getKycBadgeVariant(user.kycStatus) as any}>{user.kycStatus}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
