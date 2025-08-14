import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import type { HomePageCard } from '@/lib/firebase/settings';
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import Link from 'next/link';
import { cn } from "@/lib/utils";

export default function GameCard({ title, description, images, link, aiHint }: HomePageCard & {link: string}) {

  const hasMultipleImages = images.length > 1;

  return (
    <Card className={cn(
        "overflow-hidden shadow-lg hover:shadow-primary/20 hover:shadow-xl transition-all duration-300 group",
        "bg-gradient-to-br from-card to-background"
    )}>
      <div className="relative w-full aspect-[4/3] bg-muted/50">
        {hasMultipleImages ? (
          <Carousel
            plugins={[Autoplay({ delay: 5000, stopOnInteraction: false })]}
            opts={{ loop: true }}
            className="w-full h-full"
          >
            <CarouselContent>
              {images.map((image, index) => (
                <CarouselItem key={index}>
                  <div className="relative w-full h-full">
                    <Image
                      src={image}
                      alt={`${title} banner ${index + 1}`}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      data-ai-hint={aiHint || "game"}
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        ) : (
          <Image
            src={images[0] || 'https://placehold.co/600x400.png'}
            alt={`${title} banner`}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            data-ai-hint={aiHint || "game"}
          />
        )}
         <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
      </div>
      <CardContent className="p-3 text-center">
        <h3 className="text-lg font-bold font-headline text-primary">{title}</h3>
        <p className="text-xs text-muted-foreground mb-3">{description}</p>
        <Link href={link}>
          <Button size="sm" className="w-full font-bold">Play Now</Button>
        </Link>
      </CardContent>
    </Card>
  );
}
