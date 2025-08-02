
import type { Game } from "@/types";
import GameCard from "@/components/game-card";

const games: Game[] = [
  { id: 1, title: "Classic Ludo", bettingRange: "₹10 - ₹500", imageUrl: "https://placehold.co/400x300.png", imageHint: "dice game" },
  { id: 2, title: "Popular Ludo", bettingRange: "₹50 - ₹1000", imageUrl: "https://placehold.co/400x300.png", imageHint: "ludo board" },
];

export default function GameListing() {
  return (
    <section>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold font-headline">Available Games</h2>
        <a href="#" className="text-sm font-bold text-primary hover:underline">See All</a>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {games.map((game) => (
          <GameCard key={game.id} game={game} />
        ))}
      </div>
    </section>
  );
}
