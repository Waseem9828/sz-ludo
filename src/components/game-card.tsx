import type { Game } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";

interface GameCardProps {
  game: Game;
}

export default function GameCard({ game }: GameCardProps) {
  return (
    <Card className="overflow-hidden shadow-lg hover:shadow-primary/20 hover:shadow-xl transition-shadow duration-300 group">
      <div className="relative w-full aspect-video">
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
        <Link href="/play" className="w-full">
          <Button className="w-full font-bold">Play Now</Button>
        </Link>
      </CardContent>
    </Card>
  );
}
