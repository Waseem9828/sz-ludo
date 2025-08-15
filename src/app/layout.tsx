import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from '@/context/auth-context';
import BottomNav from '@/components/bottom-nav';
import Script from 'next/script';
import { cn } from '@/lib/utils';
import { Poppins, PT_Sans } from 'next/font/google';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const poppins = Poppins({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '700', '900'],
  variable: '--font-headline',
});

const ptSans = PT_Sans({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '700'],
  variable: '--font-body',
});

export const metadata: Metadata = {
  title: 'SZ Ludo',
  description: 'Play Ludo and win real cash!',
  manifest: "/manifest.json",
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
};

const WhatsAppIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-white">
        <path d="M16.75 13.96c.25.58.12 1.19-.29 1.59l-1.12 1.11c-.39.39-1 .4-1.4.03-.4-.36-.88-.78-1.4-1.25-.54-.48-1.07-.99-1.58-1.55-.5-.54-1-1.07-1.52-1.58-.46-.52-.87-1-1.22-1.43-.37-.41-.35-1.02.04-1.42l1.11-1.12c.39-.41.99-.54 1.57-.29.41.17.78.44 1.11.78.33.34.6.71.78 1.13Z" />
        <path d="M19.17 4.83A9.92 9.92 0 0 0 12 2C6.48 2 2 6.48 2 12c0 1.77.46 3.45 1.27 4.94L2 22l5.06-1.27c1.5.81 3.17 1.27 4.94 1.27h.01c5.52 0 10-4.48 10-10 0-2.76-1.12-5.26-2.9-7.07Zm-1.63 12.54a8.37 8.37 0 0 1-11.23-11.23 8.37 8.37 0 0 1 11.23 11.23Z" />
    </svg>
);

const FloatingWhatsAppButton = () => (
    <Link
        href="https://wa.me/919351993756"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-24 right-4 z-50 md:bottom-6"
    >
        <Button size="icon" className="w-14 h-14 bg-green-500 rounded-full shadow-lg hover:bg-green-600 animate-bounce-float">
             <WhatsAppIcon />
        </Button>
    </Link>
);


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#E63946" />
      </head>
      <body className={cn("font-body antialiased", poppins.variable, ptSans.variable)}>
        <AuthProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              {children}
              <BottomNav />
              <FloatingWhatsAppButton />
              <Toaster />
            </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
