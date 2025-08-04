
'use client';

import GameCard from './game-card';
import { GameCardType, GameBanners } from '@/types';
import { useEffect, useState } from 'react';
import { getSettings } from '@/lib/firebase/settings';

const defaultGames: GameCardType[] = [
  {
    title: 'Classic Ludo',
    description: 'Entry: ₹50 - ₹50,000',
    images: ['https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhB0r-oO8dVhvrf38QyLfm-51CbBGQpTf1vaodlbX-FTEwAoIRD1Erekk472T8ToyMbvpcYsbPk9w5p6dz9RyoSHp5ZR91ThRUe7yCebrAH445VkNJBXJXImhpJsBNpgyOXY_HUJIFErAPUQqtDyxZwoqi8zfjWYRpgeMM4U2EBOd7crErzdxFY_-KIDmw/s1600/74360.jpg'],
    aiHint: 'ludo game'
  },
  {
    title: 'Popular Ludo',
    description: 'Entry: ₹50,000 - ₹1,00,000',
    images: ['https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhB0r-oO8dVhvrf38QyLfm-51CbBGQpTf1vaodlbX-FTEwAoIRD1Erekk472T8ToyMbvpcYsbPk9w5p6dz9RyoSHp5ZR91ThRUe7yCebrAH445VkNJBXJXImhpJsBNpgyOXY_HUJIFErAPUQqtDyxZwoqi8zfjWYRpgeMM4U2EBOd7crErzdxFY_-KIDmw/s1600/74360.jpg'],
    aiHint: 'ludo board'
  },
];

export default function GameListing() {
  const [gameBanners, setGameBanners] = useState<GameBanners | null>(null);

  useEffect(() => {
    getSettings().then(settings => {
      setGameBanners(settings.gameBanners || { classic: [], popular: [] });
    });
  }, []);

  const games: GameCardType[] = [
    {
      ...defaultGames[0],
      images: gameBanners?.classic?.length ? gameBanners.classic : defaultGames[0].images,
    },
    {
      ...defaultGames[1],
      images: gameBanners?.popular?.length ? gameBanners.popular : defaultGames[1].images,
    }
  ];

  return (
    <section>
      <div className="grid grid-cols-2 gap-4">
        {games.map((game, index) => (
          <GameCard key={index} {...game} />
        ))}
      </div>
    </section>
  );
}

    