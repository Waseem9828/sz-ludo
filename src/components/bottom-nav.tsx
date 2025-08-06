
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Swords, Gift, User, Dices } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/auth-context';
import { motion } from 'framer-motion';

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
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 shadow-[0_-2px_10px_rgba(0,0,0,0.1)]">
      <div className="flex justify-around items-end h-20 pt-2">
        {navItems.map((item) => {
          const isActive = (pathname === '/' && item.href === '/') || (pathname.startsWith(item.href) && item.href !== '/');
          return (
            <Link key={item.href} href={item.href} className="flex flex-col items-center justify-start text-center w-full h-full">
              <motion.div
                className={cn(
                  'flex flex-col items-center justify-center gap-1 w-full transition-colors duration-200 relative',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )}
                animate={{ y: isActive ? -12 : 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <div className={cn("p-3 rounded-full transition-colors", isActive && "bg-primary/10")}>
                    <item.icon className="w-6 h-6" />
                </div>
                <span className="text-xs font-medium">{item.label}</span>
              </motion.div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
