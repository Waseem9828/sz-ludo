
'use client';

import GameCard from './game-card';
import { HomePageCard } from '@/lib/firebase/settings';

export default function GameListing({ cards }: { cards: HomePageCard[] }) {
  if (!cards || cards.length === 0) {
    return null; // Or a loading/placeholder component
  }
  
  const visibleCards = cards.filter(card => card.enabled);

  if (visibleCards.length === 0) {
    return (
        <div className="text-center text-muted-foreground py-10">
            <p>No games or tournaments are available at the moment.</p>
            <p className="text-sm">Please check back later!</p>
        </div>
    );
  }

  return (
    <section>
      <div className="grid grid-cols-2 gap-4">
        {visibleCards.map((card, index) => (
          <GameCard 
            key={index} 
            {...card}
            link={card.type === 'game' ? '/play' : '/tournaments'}
          />
        ))}
      </div>
    </section>
  );
}
