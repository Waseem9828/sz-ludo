
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { getSettings, updateSettings, UpiId } from '@/lib/firebase/settings';
import { Loader, Trash2, PlusCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export default function SettingsPage() {
  const [upiIds, setUpiIds] = useState<UpiId[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchSettings() {
      try {
        const settings = await getSettings();
        if (settings && settings.upiIds) {
          setUpiIds(settings.upiIds);
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

  const handleUpiIdChange = (index: number, field: keyof UpiId, value: string | number) => {
    const newUpiIds = [...upiIds];
    if (typeof newUpiIds[index][field] === 'number') {
        newUpiIds[index] = { ...newUpiIds[index], [field]: Number(value) };
    } else {
        newUpiIds[index] = { ...newUpiIds[index], [field]: value };
    }
    setUpiIds(newUpiIds);
  };

  const addUpiId = () => {
    setUpiIds([...upiIds, { id: '', name: '', limit: 50000, currentAmount: 0 }]);
  };

  const removeUpiId = (index: number) => {
    const newUpiIds = upiIds.filter((_, i) => i !== index);
    setUpiIds(newUpiIds);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateSettings({ upiIds });
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
  
  const resetDailyLimits = async () => {
      setIsSaving(true);
      try {
        const resetUpiIds = upiIds.map(upi => ({ ...upi, currentAmount: 0 }));
        await updateSettings({ upiIds: resetUpiIds });
        setUpiIds(resetUpiIds);
        toast({
            title: 'Success',
            description: 'Daily limits have been reset.',
        });
      } catch (error) {
        toast({
            title: 'Error',
            description: 'Could not reset daily limits.',
            variant: 'destructive'
        });
      } finally {
        setIsSaving(false);
      }
  }

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
        <CardDescription>Manage UPI IDs for payments. The system will automatically rotate to the next available UPI ID once a limit is reached.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {upiIds.map((upi, index) => {
            const progress = upi.limit > 0 ? (upi.currentAmount / upi.limit) * 100 : 0;
            return (
              <Card key={index} className="p-4 relative bg-muted/50">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`upiId-${index}`}>UPI ID</Label>
                    <Input
                      id={`upiId-${index}`}
                      value={upi.id}
                      onChange={(e) => handleUpiIdChange(index, 'id', e.target.value)}
                      placeholder="your-upi-id@okhdfcbank"
                    />
                  </div>
                   <div className="space-y-2">
                    <Label htmlFor={`upiName-${index}`}>Account Holder Name</Label>
                    <Input
                      id={`upiName-${index}`}
                      value={upi.name}
                      onChange={(e) => handleUpiIdChange(index, 'name', e.target.value)}
                      placeholder="John Doe"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`upiLimit-${index}`}>Daily Limit (₹)</Label>
                    <Input
                      id={`upiLimit-${index}`}
                      type="number"
                      value={upi.limit}
                      onChange={(e) => handleUpiIdChange(index, 'limit', e.target.value)}
                      placeholder="50000"
                    />
                  </div>
                </div>
                <div className="mt-4">
                    <Label>Daily Progress</Label>
                    <div className="flex items-center gap-4 mt-1">
                        <Progress value={progress} className="w-full" />
                        <span className="text-sm font-mono whitespace-nowrap">₹{upi.currentAmount.toLocaleString()} / ₹{upi.limit.toLocaleString()}</span>
                    </div>
                </div>
                <Button variant="ghost" size="icon" className="absolute top-2 right-2 text-destructive" onClick={() => removeUpiId(index)}>
                    <Trash2 className="h-4 w-4" />
                </Button>
              </Card>
            )
          })}

          <Button variant="outline" onClick={addUpiId}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add UPI ID
          </Button>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Settings'}
            </Button>
             <Button onClick={resetDailyLimits} variant="destructive" disabled={isSaving}>
              {isSaving ? 'Resetting...' : 'Reset All Daily Limits'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
