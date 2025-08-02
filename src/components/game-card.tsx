import type { Game } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";

interface GameCardProps {
  game: Game;
}

export default function GameCard({ game }: GameCardProps) {
  return (
    <Card className="overflow-hidden shadow-lg hover:shadow-primary/20 hover:shadow-xl transition-shadow duration-300 group">
      <div className="relative w-full h-40">
        <Image
          src={game.imageUrl}
          alt={game.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          data-ai-hint={game.imageHint}
        />
      </div>
      <CardContent className="p-4 bg-card">
        <h3 className="text-lg font-bold font-headline">{game.title}</h3>
        <p className="text-sm text-muted-foreground mb-4">Entry: {game.bettingRange}</p>
        <Button className="w-full font-bold">Play Now</Button>
      </CardContent>
    </Card>
  );
}
