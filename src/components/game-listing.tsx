
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";

export default function GameListing() {
  return (
    <section>
      <Card className="overflow-hidden shadow-lg hover:shadow-primary/20 hover:shadow-xl transition-shadow duration-300 group">
        <div className="relative w-full aspect-video">
            <Image
            src='https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhB0r-oO8dVhvrf38QyLfm-51CbBGQpTf1vaodlbX-FTEwAoIRD1Erekk472T8ToyMbvpcYsbPk9w5p6dz9RyoSHp5ZR91ThRUe7yCebrAH445VkNJBXJXImhpJsBNpgyOXY_HUJIFErAPUQqtDyxZwoqi8zfjWYRpgeMM4U2EBOd7crErzdxFY_-KIDmw/s1600/74360.jpg'
            alt="Ludo banner"
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            data-ai-hint="ludo game"
            />
        </div>
        <CardContent className="p-4 bg-card">
            <h3 className="text-2xl font-bold font-headline text-center text-red-600">Ludo Battles</h3>
            <p className="text-sm text-muted-foreground text-center mb-4">Play with real players and win cash prizes!</p>
            <Link href="/play" className="w-full">
            <Button className="w-full font-bold text-lg py-6">Play Now</Button>
            </Link>
        </CardContent>
      </Card>
    </section>
  );
}
