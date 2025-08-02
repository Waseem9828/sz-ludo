
"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Wallet,
  Bell,
  Menu,
  ShieldCheck,
  History,
  User,
  Gift,
  FileText,
  Shield,
  LifeBuoy,
  ChevronRight,
  Dice5,
  LogOut,
  LayoutDashboard
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";


export default function Header() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const router = useRouter();


  const handleLogout = async () => {
    try {
        await logout();
        router.push('/login');
        toast({
            title: 'Logged Out',
            description: 'You have been successfully logged out.',
        });
    } catch (error: any) {
         toast({
            title: 'Logout Failed',
            description: error.message,
            variant: 'destructive'
        });
    }
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }

  const navItems = [
    { icon: Dice5, label: "Play", href: "/play" },
    { icon: Wallet, label: "Wallet", href: "/wallet" },
    { icon: ShieldCheck, label: "KYC", href: "/kyc" },
    { icon: History, label: "History", href: "#" },
    { icon: User, label: "Profile", href: "/profile" },
    { icon: Gift, label: "Refer & Earn", href: "/refer" },
    { icon: FileText, label: "Term & Conditions", href: "/terms" },
    { icon: FileText, label: "GST Policy", href: "/gst-policy" },
    { icon: Shield, label: "Privacy Policy", href: "/privacy-policy" },
    { icon: Shield, label: "Refund Policy", href: "/refund-policy" },
    { icon: LifeBuoy, label: "Support", href: "#" },
  ];

  // A simple check for admin. In a real app, you'd use custom claims from Firebase Auth.
  const isAdmin = user && user.email === 'admin@example.com';

  return (
    <header className="bg-card shadow-md sticky top-0 z-40">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-80 bg-card flex flex-col">
              <SheetHeader className="p-4 border-b">
                 <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                 {user ? (
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage
                          src={user.photoURL || "https://placehold.co/48x48.png"}
                          alt={user.displayName || "User"}
                          data-ai-hint="avatar person"
                        />
                        <AvatarFallback>{getInitials(user.displayName || user.email || 'U')}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h2 className="text-lg font-bold font-headline">
                          {user.displayName || user.email} 👋
                        </h2>
                      </div>
                    </div>
                 ) : (
                    <div className="flex items-center gap-3">
                         <h2 className="text-lg font-bold font-headline">Welcome!</h2>
                    </div>
                 )}
              </SheetHeader>
              <nav className="p-4 flex-grow overflow-y-auto">
                <ul>
                  {isAdmin && (
                     <li>
                      <Link
                        href="/admin"
                        className="flex items-center justify-between p-3 rounded-md hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <LayoutDashboard className="h-6 w-6 text-muted-foreground" />
                          <span className="font-medium">Admin Panel</span>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </Link>
                    </li>
                  )}
                  {navItems.map((item) => (
                    <li key={item.label}>
                      <Link
                        href={item.href}
                        className="flex items-center justify-between p-3 rounded-md hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <item.icon className="h-6 w-6 text-muted-foreground" />
                          <span className="font-medium">{item.label}</span>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
              { user && (
                <div className="p-4 border-t">
                    <Button onClick={handleLogout} variant="outline" className="w-full">
                        <LogOut className="mr-2 h-4 w-4" />
                        Logout
                    </Button>
                </div>
              )}
            </SheetContent>
          </Sheet>
           <div className="flex items-center gap-1">
            <Link href="/">
              <Image src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEg2oNx0s_EsUtQCxkYGCkEqHAcVCA4PAgVdyNX-mDF_KO228qsfmqMAOefbIFmb-yD98WpX7jVLor2AJzeDhfqG6wC8n7lWtxU9euuYIYhPWStqYgbGjkGp6gu1JrfKmXMwCn7I_KjLGu_GlGy3PMNmf9ljC8Yr__ZpsiGxHJRKbtH6MfTuG4ofViNRsAY/s1600/73555.png" alt="SZ LUDO Logo" width={40} height={40} />
            </Link>
            <Link href="/">
              <h1 className="text-xl font-headline font-bold text-red-600">SZ LUDO</h1>
            </Link>
          </div>
        </div>
        {user && (
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="rounded-full">
              <Bell className="h-5 w-5" />
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
