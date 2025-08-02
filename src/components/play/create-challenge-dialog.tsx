
'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader } from 'lucide-react';

interface CreateChallengeDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  amount: number;
  onChallengeCreated: (roomCode: string) => Promise<void>;
}

export function CreateChallengeDialog({
  isOpen,
  setIsOpen,
  amount,
  onChallengeCreated,
}: CreateChallengeDialogProps) {
  const [roomCode, setRoomCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
        await onChallengeCreated(roomCode);
        setIsOpen(false);
        setRoomCode('');
    } catch(err) {
        // Error toast is handled in the parent component
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Set Your Challenge</DialogTitle>
          <DialogDescription>
            You are creating a challenge for <span className="font-bold">₹{amount}</span>. Please
            enter your Ludo King room code below.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="room-code" className="text-right">
              Room Code
            </Label>
            <Input
              id="room-code"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value)}
              className="col-span-3"
              placeholder="Enter room code"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSubmit} disabled={!roomCode || isSubmitting}>
             {isSubmitting ? <Loader className="animate-spin" /> : 'Create Challenge'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
