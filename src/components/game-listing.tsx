
import type { Game } from "@/types";
import GameCard from "@/components/game-card";

const games: Game[] = [
  { id: 1, title: "Classic Ludo", bettingRange: "₹550 - ₹100000", imageUrl: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhB0r-oO8dVhvrf38QyLfm-51CbBGQpTf1vaodlbX-FTEwAoIRD1Erekk472T8ToyMbvpcYsbPk9w5p6dz9RyoSHp5ZR91ThRUe7yCebrAH445VkNJBXJXImhpJsBNpgyOXY_HUJIFErAPUQqtDyxZwoqi8zfjWYRpgeMM4U2EBOd7crErzdxFY_-KIDmw/s1600/74360.jpg', imageHint: "ludo game" },
  { id: 2, title: "Popular Ludo", bettingRange: "₹550 - ₹100000", imageUrl: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhB0r-oO8dVhvrf38QyLfm-51CbBGQpTf1vaodlbX-FTEwAoIRD1Erekk472T8ToyMbvpcYsbPk9w5p6dz9RyoSHp5ZR91ThRUe7yCebrAH445VkNJBXJXImhpJsBNpgyOXY_HUJIFErAPUQqtDyxZwoqi8zfjWYRpgeMM4U2EBOd7crErzdxFY_-KIDmw/s1600/74360.jpg', imageHint: "ludo board" },
];

export default function GameListing() {
  return (
    <section>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold font-headline text-red-600">Available Games</h2>
        <a href="#" className="text-sm font-bold text-primary hover:underline">See All</a>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {games.map((game) => (
          <GameCard key={game.id} game={game} />
        ))}
      </div>
    </section>
  );
}
