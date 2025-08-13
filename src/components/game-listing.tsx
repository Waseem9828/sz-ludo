
'use client';

import GameCard from './game-card';
import { HomePageCard } from '@/lib/firebase/settings';
import { Separator } from '@/components/ui/separator';
import { Gem } from 'lucide-react';

export default function GameListing({ cards }: { cards: HomePageCard[] }) {
  if (!cards || cards.length === 0) {
    return null; // Or a loading/placeholder component
  }
  
  const gameCards = cards.filter(card => card.enabled && card.type === 'game');
  const tournamentCards = cards.filter(card => card.enabled && card.type === 'tournament');

  const allVisibleCards = [...gameCards, ...tournamentCards];

  if (allVisibleCards.length === 0) {
    return (
        <div className="text-center text-muted-foreground py-10">
            <p>No games or tournaments are available at the moment.</p>
            <p className="text-sm">Please check back later!</p>
        </div>
    );
  }

  const Divider = () => (
    <div className="relative my-6">
      <div className="absolute inset-0 flex items-center" aria-hidden="true">
        <div className="w-full border-t border-border" />
      </div>
      <div className="relative flex justify-center">
        <span className="bg-background px-2 text-muted-foreground">
          <Gem className="h-5 w-5 text-primary" />
        </span>
      </div>
    </div>
  );

  return (
    <section className="space-y-4">
      {gameCards.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          {gameCards.map((card, index) => (
            <GameCard 
              key={`game-${index}`} 
              {...card}
              link={'/play'}
            />
          ))}
        </div>
      )}

      {gameCards.length > 0 && tournamentCards.length > 0 && <Divider />}

      {tournamentCards.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          {tournamentCards.map((card, index) => (
            <GameCard 
              key={`tournament-${index}`} 
              {...card}
              link={'/tournaments'}
            />
          ))}
        </div>
      )}
    </section>
  );
}
