

'use client';

import { Sidebar, SidebarProvider, SidebarTrigger, SidebarInset, SidebarHeader, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, useSidebar } from "@/components/ui/sidebar";
import { Home, BarChart, Users, Settings, CircleDollarSign, Banknote, Bot, Bell, Trophy } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useMemo } from "react";
import { SplashScreen } from "@/components/ui/splash-screen";

const allNavItems = [
    { href: "/admin", icon: Home, label: "Dashboard", roles: ['superadmin', 'finance', 'support'] },
    { href: "/admin/users", icon: Users, label: "Users", roles: ['superadmin', 'support'] },
    { href: "/admin/winnings", icon: Trophy, label: "Winnings", roles: ['superadmin', 'finance'] },
    { href: "/admin/matches", icon: BarChart, label: "Match History", roles: ['superadmin', 'support'] },
    { href: "/admin/deposits", icon: Banknote, label: "Deposits", roles: ['superadmin', 'finance'] },
    { href: "/admin/withdrawals", icon: CircleDollarSign, label: "Withdrawals", roles: ['superadmin', 'finance'] },
    { href: "/admin/notifications", icon: Bell, label: "Notifications", roles: ['superadmin', 'support'] },
    { href: "/admin/settings", icon: Settings, label: "Settings", roles: ['superadmin'] },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, appUser, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const navItems = useMemo(() => {
    const userRole = appUser?.role || 'support'; // Default to least privileged role
    if (userRole === 'superadmin') {
        return allNavItems;
    }
    return allNavItems.filter(item => item.roles.includes(userRole));
  }, [appUser]);

  const currentPage = navItems.find(item => pathname.startsWith(item.href));
  const pageTitle = currentPage ? currentPage.label : "Admin";

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
    // For now, allow anyone with an account that is not a standard user to access admin
    // A more robust check for a specific role should be implemented
    if (!loading && user && !appUser?.role) {
      router.push('/');
    }
  }, [user, appUser, loading, router]);

  if (loading || !user || !appUser) {
    return <SplashScreen />;
  }
  
  if (!appUser.role) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen">
            <h1 className="text-2xl font-bold">Access Denied</h1>
            <p>You do not have permission to view this page.</p>
            <Link href="/" className="mt-4 text-blue-500 hover:underline">Go to Home</Link>
        </div>
    );
  }

  return (
    <SidebarProvider>
        <Sidebar title="Admin Menu">
          <SidebarHeader>
            <div className="p-4 text-center">
              <h1 className="text-2xl font-bold text-primary">Admin Panel</h1>
              <p className="text-sm text-muted-foreground capitalize">{appUser.role}</p>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              {navItems.map(item => (
                <SidebarMenuItem key={item.label}>
                   <Link href={item.href}>
                      <SidebarMenuButton tooltip={item.label} isActive={pathname.startsWith(item.href)}>
                          <item.icon />
                          <span>{item.label}</span>
                      </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>
        <SidebarInset>
             <header className="flex items-center justify-between p-4 border-b">
                <SidebarTrigger />
                <h2 className="text-xl font-semibold text-primary">{pageTitle}</h2>
             </header>
            <main className="p-6">
                {children}
            </main>
        </SidebarInset>
    </SidebarProvider>
  );
}
