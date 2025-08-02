
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

interface CreateChallengeDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  amount: number;
  onChallengeCreated: () => void;
}

export function CreateChallengeDialog({
  isOpen,
  setIsOpen,
  amount,
  onChallengeCreated,
}: CreateChallengeDialogProps) {
  const [roomCode, setRoomCode] = useState('');

  const handleSubmit = () => {
    // Here you would typically save the challenge with the room code to your backend.
    // For now, we'll just simulate it and close the dialog.
    console.log(`Challenge created for ₹${amount} with room code: ${roomCode}`);
    onChallengeCreated();
    setIsOpen(false);
    setRoomCode('');
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
          <Button type="submit" onClick={handleSubmit} disabled={!roomCode}>
            Create Challenge
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
