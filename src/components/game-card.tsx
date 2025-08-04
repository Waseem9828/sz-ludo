
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { GameCardType } from '@/types';

export default function GameCard({ title, description, image, link, aiHint }: GameCardType) {
  return (
    <Card className="overflow-hidden shadow-lg hover:shadow-primary/20 hover:shadow-xl transition-shadow duration-300 group">
      <div className="relative w-full aspect-[16/9]">
        <Image
          src={image}
          alt={`${title} banner`}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          data-ai-hint={aiHint || "game"}
        />
      </div>
      <CardContent className="p-4 bg-card text-center">
        <h3 className="text-xl font-bold font-headline text-red-600">{title}</h3>
        <p className="text-sm text-muted-foreground mb-3">{description}</p>
        <Link href={link} className="w-full">
          <Button className="w-full font-bold">Play Now</Button>
        </Link>
      </CardContent>
    </Card>
  );
}
