
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader, PlusCircle, Users } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import {
  createNotification,
  listenForNotifications,
  Notification,
} from '@/lib/firebase/notifications';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function NotificationsPage() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = listenForNotifications((data) => {
      setNotifications(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSendNotification = async () => {
    if (!title || !message) {
      toast({
        title: 'Error',
        description: 'Title and message are required.',
        variant: 'destructive',
      });
      return;
    }

    setIsSending(true);
    try {
      await createNotification({ title, message });
      toast({
        title: 'Success',
        description: 'Notification sent to all users!',
      });
      setTitle('');
      setMessage('');
    } catch (error) {
      console.error('Error sending notification: ', error);
      toast({
        title: 'Error',
        description: 'Could not send notification.',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Send Notification</CardTitle>
          <CardDescription>
            Create and send a new notification to all users.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="notification-title">Title</Label>
            <Input
              id="notification-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., App Maintenance Alert"
              disabled={isSending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notification-message">Message</Label>
            <Textarea
              id="notification-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="e.g., The app will be down for maintenance..."
              rows={5}
              disabled={isSending}
            />
          </div>
          <Button onClick={handleSendNotification} disabled={isSending}>
            {isSending ? (
              <>
                <Loader className="mr-2 h-4 w-4 animate-spin" /> Sending...
              </>
            ) : (
              'Send to All Users'
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sent Notifications</CardTitle>
          <CardDescription>
            History of all notifications sent.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <Loader className="h-16 w-16 animate-spin" />
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Read Count</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {notifications.map((notif) => (
                    <TableRow key={notif.id}>
                        <TableCell className="font-medium whitespace-nowrap">{notif.title}</TableCell>
                        <TableCell className="whitespace-nowrap">
                        {new Date(notif.createdAt?.toDate()).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right flex items-center justify-end gap-1">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        {notif.readCount || 0}
                        </TableCell>
                    </TableRow>
                    ))}
                    {notifications.length === 0 && (
                    <TableRow>
                            <TableCell colSpan={3} className="text-center text-muted-foreground">No notifications sent yet.</TableCell>
                        </TableRow>
                    )}
                </TableBody>
                </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
