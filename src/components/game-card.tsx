import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import type { HomePageCard } from '@/lib/firebase/settings';
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import Link from 'next/link';

export default function GameCard({ title, description, images, link, aiHint }: HomePageCard & {link: string}) {

  const hasMultipleImages = images.length > 1;

  return (
    <Card className="overflow-hidden shadow-lg hover:shadow-primary/20 hover:shadow-xl transition-shadow duration-300 group">
      <div className="relative w-full aspect-[16/9]">
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
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            data-ai-hint={aiHint || "game"}
          />
        )}
      </div>
      <CardContent className="p-4 bg-card text-center">
        <h3 className="text-xl font-bold font-headline text-red-600">{title}</h3>
        <p className="text-sm text-muted-foreground mb-3">{description}</p>
        <Link href={link}>
          <Button className="w-full font-bold">Play Now</Button>
        </Link>
      </CardContent>
    </Card>
  );
}
