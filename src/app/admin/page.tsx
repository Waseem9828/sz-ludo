
'use client';

import { Sidebar, SidebarProvider, SidebarTrigger, SidebarInset, SidebarHeader, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { Home, BarChart, Users, Settings } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { SheetTitle } from "@/components/ui/sheet";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
    // A simple check for admin. In a real app, you'd use custom claims.
    if (!loading && user && user.email !== 'admin@example.com') {
        router.push('/');
    }
  }, [user, loading, router]);


  if (loading || !user) {
    return <div>Loading...</div>;
  }

  return (
    <SidebarProvider>
        <Sidebar>
          <SidebarHeader>
            <SheetTitle>Admin Panel</SheetTitle>
            <div className="p-4 text-center">
              <h1 className="text-2xl font-bold">Admin Panel</h1>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              <SidebarMenuItem>
                 <Link href="/admin">
                    <SidebarMenuButton tooltip="Dashboard" isActive>
                        <Home />
                        <span>Dashboard</span>
                    </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
               <SidebarMenuItem>
                 <Link href="/admin/users">
                    <SidebarMenuButton tooltip="Users">
                        <Users />
                        <span>Users</span>
                    </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
               <SidebarMenuItem>
                 <Link href="/admin/matches">
                    <SidebarMenuButton tooltip="Matches">
                        <BarChart />
                        <span>Matches</span>
                    </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
               <SidebarMenuItem>
                 <Link href="/admin/settings">
                    <SidebarMenuButton tooltip="Settings">
                        <Settings />
                        <span>Settings</span>
                    </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>
        <SidebarInset>
             <header className="flex items-center justify-between p-4 border-b">
                <SidebarTrigger />
                <h2 className="text-xl font-semibold">Dashboard</h2>
             </header>
            <main className="p-6">
                <h1 className="text-2xl font-bold">Welcome, Admin!</h1>
                <p>This is the main content area for the admin panel.</p>
                {/* Future content will go here */}
            </main>
        </SidebarInset>
    </SidebarProvider>
  );
}
