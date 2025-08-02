
import type { Game } from "@/types";
import GameCard from "@/components/game-card";

const gameImages = [
    'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhB0r-oO8dVhvrf38QyLfm-51CbBGQpTf1vaodlbX-FTEwAoIRD1Erekk472T8ToyMbvpcYsbPk9w5p6dz9RyoSHp5ZR91ThRUe7yCebrAH445VkNJBXJXImhpJsBNpgyOXY_HUJIFErAPUQqtDyxZwoqi8zfjWYRpgeMM4U2EBOd7crErzdxFY_-KIDmw/s1600/74360.jpg',
    'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgU0Y0giYysg4GSqRQ71O-WZlYT2Iq29Jw13kbJqaP_n8kzwUTIOIdN-hDk0VzUSCIlxeqxQNVijTA6OiG9d01QpmnmEwBXeTb4S_CAsryoOIlaJ34tFhDbp_G2WCGA41bBgVhr4Bm5P8LlZFLoKZULZYGigirhNbVXipNRn_0D9LztGyi2dIZ3CW-Wn7I/s1600/73856.webp',
    'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjQ2ECXaLYDMSDwG8Y7vexyn1NnsDAb1Ko-D2xerDkFQUEoqVnsBKV_9EreIdnGJ6inJGIKzqim55DAo3taYXLyR56Y0jlMzWRSZD8QglvqvnzRucyw8ofiHo4ouYm6LT8jOGhNd5HIykJbOryVIOYtamqGXKfSzvT4RxI_7gk4bxeWG_TpW-D9fWqKoN0/s1600/73854.webp',
    'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEg2Jr2Qg3DEDHSnfgP_MZlZ4o02e7PNyfhcEXrlm_Z2mYWzgqJFIdSBwwoic0nacIYSKIpuuuOERPF7KBTNJm6pFG4Nv457R6ba3wZVywAsaIMtobGWjCtGXTrKXTYWJe0taW8ChvwTgQG2Ia223mLmwHQuP5jwaoOGo04pLqH8e4ZCq0MgW-lN_NStEWg/s1600/73857.webp',
    'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjk0v-8l6KszBalyFkz0kKO2aEtsKnxObpI_Rlgl2faU9sgUrXrfY81L9BAKjTia-zwXtVlOJY9l7qQXZxCHjUaeta2t3wiKQ-AkDHwWjBZNLQX2jrTk9Ka2kFp6bCZjn3N_rkXZKx6F-LQ124O7vH4Ktlrmn6Eydat9GniUhjy-C9C85kTs8jepiumuzY/s1600/73855.webp',
    'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjEsa6UQWzBpSK56pMDK8NXsNuRaamZuxTRt1W7JV1uTcB8vnk9s6JmRjUuGoOB0eggpQVUjoNkoBNkOd9wamgWB_ysKg66jm2WaPyif0AG_k5e3TUflDFDsc9RBzyBCEF7g-Pg8uxdA-zsbbMqxoBwjJ0LwzXaTXV1RVa6Wp-_aa4jW-T7_GmOuZtCmik/s1600/74338.jpg',
]

const games: Game[] = [
  { id: 1, title: "Classic Ludo", bettingRange: "₹550 - ₹100000", imageUrls: gameImages, imageHint: "ludo game" },
  { id: 2, title: "Popular Ludo", bettingRange: "₹550 - ₹100000", imageUrls: gameImages, imageHint: "ludo board" },
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
