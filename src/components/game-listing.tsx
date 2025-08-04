
import GameCard from './game-card';
import { GameCardType } from '@/types';

const games: GameCardType[] = [
  {
    title: 'Classic Ludo',
    description: 'Play with real players and win cash prizes!',
    image: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhB0r-oO8dVhvrf38QyLfm-51CbBGQpTf1vaodlbX-FTEwAoIRD1Erekk472T8ToyMbvpcYsbPk9w5p6dz9RyoSHp5ZR91ThRUe7yCebrAH445VkNJBXJXImhpJsBNpgyOXY_HUJIFErAPUQqtDyxZwoqi8zfjWYRpgeMM4U2EBOd7crErzdxFY_-KIDmw/s1600/74360.jpg',
    link: '/play',
    aiHint: 'ludo game'
  },
  {
    title: 'Popular Ludo',
    description: 'Join the most popular tables and win big!',
    image: 'https://placehold.co/600x400.png',
    link: '/play',
    aiHint: 'ludo board'
  },
];

export default function GameListing() {
  return (
    <section>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {games.map((game, index) => (
          <GameCard key={index} {...game} />
        ))}
      </div>
    </section>
  );
}
