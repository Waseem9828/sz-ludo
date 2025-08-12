

declare global {
  interface Window {
    html2canvas: any;
  }
}

export interface GameCardType {
  title: string;
  description: string;
  images: string[];
  aiHint?: string;
}

export interface GameBanners {
    classic: string[];
    popular: string[];
}
