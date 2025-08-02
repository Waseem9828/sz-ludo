
import type { Game } from "@/types";
import GameCard from "@/components/game-card";

const games: Game[] = [
  { id: 1, title: "Classic Ludo", bettingRange: "₹550 - ₹100000", imageUrl: "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjEsa6UQWzBpSK56pMDK8NXsNuRaamZuxTRt1W7JV1uTcB8vnk9s6JmRjUuGoOB0eggpQVUjoNkoBNkOd9wamgWB_ysKg66jm2WaPyif0AG_k5e3TUflDFDsc9RBzyBCEF7g-Pg8uxdA-zsbbMqxoBwjJ0LwzXaTXV1RVa6Wp-_aa4jW-T7_GmOuZtCmik/s1600/74338.jpg", imageHint: "ludo game" },
  { id: 2, title: "Popular Ludo", bettingRange: "₹550 - ₹100000", imageUrl: "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjEsa6UQWzBpSK56pMDK8NXsNuRaamZuxTRt1W7JV1uTcB8vnk9s6JmRjUuGoOB0eggpQVUjoNkoBNkOd9wamgWB_ysKg66jm2WaPyif0AG_k5e3TUflDFDsc9RBzyBCEF7g-Pg8uxdA-zsbbMqxoBwjJ0LwzXaTXV1RVa6Wp-_aa4jW-T7_GmOuZtCmik/s1600/74338.jpg", imageHint: "ludo board" },
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
