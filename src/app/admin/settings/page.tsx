
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { getSettings, updateSettings } from '@/lib/firebase/settings';
import { Loader } from 'lucide-react';
import { Sidebar, SidebarProvider, SidebarTrigger, SidebarInset, SidebarHeader, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { Home, BarChart, Users, Settings as SettingsIcon } from "lucide-react";
import Link from "next/link";
import { SheetTitle } from '@/components/ui/sheet';

export default function SettingsPage() {
  const [upiId, setUpiId] = useState('');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchSettings() {
      try {
        const settings = await getSettings();
        if (settings && settings.upiId) {
          setUpiId(settings.upiId);
        }
      } catch (error) {
        console.error("Error fetching settings: ", error);
        toast({
          title: 'Error',
          description: 'Could not load settings.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, [toast]);

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateSettings({ upiId });
      toast({
        title: 'Success',
        description: 'Settings updated successfully!',
      });
    } catch (error) {
      console.error("Error updating settings: ", error);
      toast({
        title: 'Error',
        description: 'Could not update settings.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader className="h-16 w-16 animate-spin" />
      </div>
    );
  }

  return (
     <SidebarProvider>
        <Sidebar>
          <SidebarHeader>
            <SheetTitle className="hidden">Admin Panel</SheetTitle>
            <div className="p-4 text-center">
              <h1 className="text-2xl font-bold">Admin Panel</h1>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              <SidebarMenuItem>
                 <Link href="/admin">
                    <SidebarMenuButton tooltip="Dashboard">
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
                    <SidebarMenuButton tooltip="Settings" isActive>
                        <SettingsIcon />
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
                <h2 className="text-xl font-semibold">Settings</h2>
             </header>
            <main className="p-6">
                 <Card>
                    <CardHeader>
                        <CardTitle>Payment Settings</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="upiId">UPI ID</Label>
                                <Input
                                id="upiId"
                                value={upiId}
                                onChange={(e) => setUpiId(e.target.value)}
                                placeholder="your-upi-id@okhdfcbank"
                                />
                            </div>
                            <Button onClick={handleSave} disabled={loading}>
                                {loading ? 'Saving...' : 'Save Settings'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </main>
        </SidebarInset>
    </SidebarProvider>
  );
}
