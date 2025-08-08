
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PartyPopper, Frown } from 'lucide-react';
import Confetti from './confetti';
import Link from 'next/link';

interface ResultDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  variant: 'won' | 'lost';
  title: string;
  description: string;
  points: number;
  showTournamentPrompt: boolean;
  onClose?: () => void;
}

export function ResultDialog({
  isOpen,
  setIsOpen,
  variant,
  title,
  description,
  points,
  showTournamentPrompt,
  onClose,
}: ResultDialogProps) {

  const Icon = variant === 'won' ? PartyPopper : Frown;
  const iconColor = variant === 'won' ? 'text-green-500' : 'text-yellow-500';

  const handleClose = () => {
    setIsOpen(false);
    if(onClose) {
        onClose();
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md text-center overflow-hidden">
        {variant === 'won' && <Confetti />}
        <DialogHeader className="items-center">
            <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${variant === 'won' ? 'bg-green-100' : 'bg-yellow-100'}`}>
                <Icon className={`h-10 w-10 ${iconColor}`} />
            </div>
          <DialogTitle className="text-2xl font-bold mt-4">{title}</DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-center flex-col sm:flex-row gap-2">
          {showTournamentPrompt && (
            <Link href="/tournaments" className='w-full sm:w-auto'>
              <Button onClick={handleClose} className='w-full'>
                Join a Tournament
              </Button>
            </Link>
          )}
          <Button onClick={handleClose} variant="outline" className='w-full sm:w-auto'>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
