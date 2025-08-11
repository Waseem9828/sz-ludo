
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { listenForTournaments, Tournament, deleteTournament } from '@/lib/firebase/tournaments';
import { Loader, PlusCircle, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import Image from 'next/image';

export default function TournamentsPage() {
    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = listenForTournaments(
            (data) => {
                setTournaments(data);
                setLoading(false);
            },
            (error) => {
                toast({ title: "Error", description: `Could not fetch tournaments: ${error.message}`, variant: "destructive" });
                setLoading(false);
            }
        );
        return () => unsubscribe();
    }, [toast]);

    const getStatusVariant = (status: Tournament['status']) => {
        switch (status) {
            case 'live': return 'destructive';
            case 'upcoming': return 'secondary';
            case 'completed': return 'default';
            case 'cancelled': return 'outline';
            default: return 'default';
        }
    };
    
    const handleDelete = async (tournamentId: string, tournamentTitle: string) => {
        try {
            await deleteTournament(tournamentId);
            toast({
                title: "Tournament Deleted",
                description: `"${tournamentTitle}" has been successfully deleted and entry fees have been refunded.`,
            });
        } catch (error: any) {
             toast({
                title: "Deletion Failed",
                description: error.message,
                variant: "destructive",
            });
        }
    };


    if (loading) {
        return (
            <div className="flex justify-center items-center h-full">
                <Loader className="h-16 w-16 animate-spin" />
            </div>
        );
    }

    return (
        <Card>
            <CardHeader className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                <div>
                    <CardTitle>Tournaments</CardTitle>
                    <CardDescription>Manage all tournaments.</CardDescription>
                </div>
                <Link href="/admin/tournaments/create">
                    <Button>
                        <PlusCircle className="mr-2" /> Create Tournament
                    </Button>
                </Link>
            </CardHeader>
            <CardContent>
                <div className="w-full overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Title</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Entry Fee</TableHead>
                                <TableHead>Players</TableHead>
                                <TableHead>Prize Pool</TableHead>
                                <TableHead>Starts At</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {tournaments.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                                        No tournaments found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                tournaments.map((t) => (
                                    <TableRow key={t.id} >
                                        <TableCell className="font-medium hover:underline cursor-pointer whitespace-nowrap" onClick={() => router.push(`/admin/tournaments/${t.id}`)}>{t.title}</TableCell>
                                        <TableCell><Badge variant={getStatusVariant(t.status)}>{t.status}</Badge></TableCell>
                                        <TableCell className='flex items-center gap-1'>
                                            <Image src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEj01a-tA55LItcrvtalUaOwdFji0EZjLW15nqZKCiNP4b6T_v7b79g7eUrg3YAsYW5i-FfbZDEONDIv-jXI_wJcwFZCbVWRuyW1hBUdPHlJ6u8SpjD_-ZveIEuDAFSTsB_7OfvxveJyyqKoyf6AsLtPZwEF2lryvPHsqXQB5MNMBGYGfEc0F0wmq9r5CmA/s1600/84440.png" alt="coin" width={14} height={14} data-ai-hint="gold coin"/>
                                            {t.entryFee}
                                        </TableCell>
                                        <TableCell>{t.players.length} / {t.playerCap}</TableCell>
                                        <TableCell className='flex items-center gap-1'>
                                            <Image src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEj01a-tA55LItcrvtalUaOwdFji0EZjLW15nqZKCiNP4b6T_v7b79g7eUrg3YAsYW5i-FfbZDEONDIv-jXI_wJcwFZCbVWRuyW1hBUdPHlJ6u8SpjD_-ZveIEuDAFSTsB_7OfvxveJyyqKoyf6AsLtPZwEF2lryvPHsqXQB5MNMBGYGfEc0F0wmq9r5CmA/s1600/84440.png" alt="coin" width={14} height={14} data-ai-hint="gold coin"/>
                                            {t.prizePool.toFixed(2)}
                                        </TableCell>
                                        <TableCell className="whitespace-nowrap">{format(t.startTime.toDate(), 'PPpp')}</TableCell>
                                        <TableCell className="text-right space-x-2">
                                            <Button variant="outline" size="icon" asChild>
                                                <Link href={`/admin/tournaments/edit/${t.id}`} onClick={(e) => e.stopPropagation()}>
                                                    <Edit className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="destructive" size="icon" onClick={(e) => e.stopPropagation()}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            This action cannot be undone. This will permanently delete the "{t.title}" tournament and refund all entry fees to participants.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDelete(t.id, t.title)}>
                                                            Yes, delete tournament
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}
