
'use client';

import * as React from 'react';
import Autoplay from "embla-carousel-autoplay";
import Image from 'next/image';

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';

const bannerImages = [
    {
        src: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhB0r-oO8dVhvrf38QyLfm-51CbBGQpTf1vaodlbX-FTEwAoIRD1Erekk472T8ToyMbvpcYsbPk9w5p6dz9RyoSHp5ZR91ThRUe7yCebrAH445VkNJBXJXImhpJsBNpgyOXY_HUJIFErAPUQqtDyxZwoqi8zfjWYRpgeMM4U2EBOd7crErzdxFY_-KIDmw/s1600/74360.jpg',
        alt: 'Ludo banner promoting the game',
        hint: 'ludo game banner'
    },
    {
        src: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgU0Y0giYysg4GSqRQ71O-WZlYT2Iq29Jw13kbJqaP_n8kzwUTIOIdN-hDk0VzUSCIlxeqxQNVijTA6OiG9d01QpmnmEwBXeTb4S_CAsryoOIlaJ34tFhDbp_G2WCGA41bBgVhr4Bm5P8LlZFLoKZULZYGigirhNbVXipNRn_0D9LztGyi2dIZ3CW-Wn7I/s1600/73856.webp',
        alt: 'Banner with text "Play Ludo & Earn Money"',
        hint: 'play ludo banner'
    },
    {
        src: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjQ2ECXaLYDMSDwG8Y7vexyn1NnsDAb1Ko-D2xerDkFQUEoqVnsBKV_9EreIdnGJ6inJGIKzqim55DAo3taYXLyR56Y0jlMzWRSZD8QglvqvnzRucyw8ofiHo4ouYm6LT8jOGhNd5HIykJbOryVIOYtamqGXKfSzvT4RxI_7gk4bxeWG_TpW-D9fWqKoN0/s1600/73854.webp',
        alt: 'Promotional banner for a Ludo game',
        hint: 'ludo promotion'
    },
    {
        src: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEg2Jr2Qg3DEDHSnfgP_MZlZ4o02e7PNyfhcEXrlm_Z2mYWzgqJFIdSBwwoic0nacIYSKIpuuuOERPF7KBTNJm6pFG4Nv457R6ba3wZVywAsaIMtobGWjCtGXTrKXTYWJe0taW8ChvwTgQG2Ia223mLmwHQuP5jwaoOGo04pLqH8e4ZCq0MgW-lN_NStEWg/s1600/73857.webp',
        alt: 'Ludo game board close-up banner',
        hint: 'ludo board'
    },
    {
        src: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjk0v-8l6KszBalyFkz0kKO2aEtsKnxObpI_Rlgl2faU9sgUrXrfY81L9BAKjTia-zwXtVlOJY9l7qQXZxCHjUaeta2t3wiKQ-AkDHwWjBZNLQX2jrTk9Ka2kFp6bCZjn3N_rkXZKx6F-LQ124O7vH4Ktlrmn6Eydat9GniUhjy-C9C85kTs8jepiumuzY/s1600/73855.webp',
        alt: 'Banner showing Ludo dice and pieces',
        hint: 'ludo dice'
    },
    {
        src: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjEsa6UQWzBpSK56pMDK8NXsNuRaamZuxTRt1W7JV1uTcB8vnk9s6JmRjUuGoOB0eggpQVUjoNkoBNkOd9wamgWB_ysKg66jm2WaPyif0AG_k5e3TUflDFDsc9RBzyBCEF7g-Pg8uxdA-zsbbMqxoBwjJ0LwzXaTXV1RVa6Wp-_aa4jW-T7_GmOuZtCmik/s1600/74338.jpg',
        alt: 'Colorful Ludo game advertisement',
        hint: 'ludo advertisement'
    },
]

export default function BannerCarousel() {
  const plugin = React.useRef(
    Autoplay({ delay: 5000, stopOnInteraction: true })
  );

  return (
    <Carousel
      plugins={[plugin.current]}
      className="w-full"
      onMouseEnter={plugin.current.stop}
      onMouseLeave={plugin.current.reset}
    >
      <CarouselContent>
        {bannerImages.map((image, index) => (
          <CarouselItem key={index}>
            <div className="relative aspect-video w-full overflow-hidden rounded-lg">
              <Image
                src={image.src}
                alt={image.alt}
                fill
                className="object-cover"
                data-ai-hint={image.hint}
              />
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2" />
      <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2" />
    </Carousel>
  );
}
