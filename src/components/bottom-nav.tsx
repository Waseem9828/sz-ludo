
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Swords, Gift, User, Dices } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/auth-context';
import { motion, AnimatePresence } from 'framer-motion';

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/play', label: 'Play', icon: Dices },
  { href: '/tournaments', label: 'Tournaments', icon: Swords },
  { href: '/refer', label: 'Refer', icon: Gift },
  { href: '/profile', label: 'Profile', icon: User },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  
  if (loading || !user || pathname.startsWith('/login') || pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-20 px-4 z-50">
      <div className="relative flex justify-around items-center h-full bg-card/70 backdrop-blur-lg border-t border-border shadow-[0_-2px_10px_rgba(0,0,0,0.1)] rounded-t-2xl">
        <AnimatePresence>
          {navItems.map((item, index) => {
            const isActive = (pathname === '/' && item.href === '/') || (pathname.startsWith(item.href) && item.href !== '/');
            if (isActive) {
              return (
                <motion.div
                  key="active-pill"
                  className="absolute h-12 w-16 bg-primary rounded-full"
                  initial={{ x: index * 68 - (navItems.length * 68 / 2) + 34, scale: 0.5 }}
                  animate={{ x: index * 68 - (navItems.length * 68 / 2) + 34, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  style={{
                    left: '50%',
                    transform: 'translateX(-50%)',
                  }}
                />
              )
            }
            return null;
          })}
        </AnimatePresence>

        {navItems.map((item) => {
          const isActive = (pathname === '/' && item.href === '/') || (pathname.startsWith(item.href) && item.href !== '/');
          return (
            <Link key={item.href} href={item.href} className="relative z-10 flex flex-col items-center justify-center text-center w-16 h-12">
                <item.icon className={cn("w-6 h-6 transition-colors", isActive ? "text-primary-foreground" : "text-muted-foreground")} />
                <span className={cn("text-xs font-medium transition-colors", isActive ? "text-primary-foreground" : "text-muted-foreground")}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
