
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { getSettings, updateSettings } from '@/lib/firebase/settings';
import { Loader } from 'lucide-react';

export default function SettingsPage() {
  const [upiId, setUpiId] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
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
    setIsSaving(true);
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
      setIsSaving(false);
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
                  <Button onClick={handleSave} disabled={isSaving}>
                      {isSaving ? 'Saving...' : 'Save Settings'}
                  </Button>
              </div>
          </CardContent>
      </Card>
  );
}
