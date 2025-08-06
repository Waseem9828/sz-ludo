
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Swords, Gift, User, Dices } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/auth-context';

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
  
  // Hide on login page or admin panel
  if (loading || !user || pathname.startsWith('/login') || pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const isActive = (pathname === '/' && item.href === '/') || (pathname.startsWith(item.href) && item.href !== '/');
          return (
            <Link key={item.href} href={item.href} className="flex flex-col items-center justify-center text-center w-full h-full">
              <div
                className={cn(
                  'flex flex-col items-center justify-center gap-1 w-full h-full transition-colors duration-200',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                <item.icon className="w-6 h-6" />
                <span className="text-xs font-medium">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
