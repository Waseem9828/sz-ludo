
'use client';

import { Sidebar, SidebarProvider, SidebarTrigger, SidebarInset, SidebarHeader, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { Home, BarChart, Users, Settings } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { Loader } from "lucide-react";
import { SheetTitle } from "@/components/ui/sheet";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const navItems = [
    { href: "/admin", icon: Home, label: "Dashboard" },
    { href: "/admin/users", icon: Users, label: "Users" },
    { href: "/admin/matches", icon: BarChart, label: "Matches" },
    { href: "/admin/settings", icon: Settings, label: "Settings" },
  ];

  const currentPage = navItems.find(item => item.href === pathname);
  const pageTitle = currentPage ? currentPage.label : "Admin";

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
    if (!loading && user && user.email !== 'admin@example.com') {
      router.push('/');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader className="h-16 w-16 animate-spin" />
      </div>
    );
  }

  return (
    <SidebarProvider>
        <Sidebar>
          <SidebarHeader>
             <SheetTitle className="sr-only">Admin Menu</SheetTitle>
            <div className="p-4 text-center">
              <h1 className="text-2xl font-bold text-primary">Admin Panel</h1>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              {navItems.map(item => (
                <SidebarMenuItem key={item.label}>
                   <Link href={item.href}>
                      <SidebarMenuButton tooltip={item.label} isActive={pathname === item.href}>
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
