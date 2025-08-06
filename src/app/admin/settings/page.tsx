
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { getSettings, updateSettings, UpiId, AppSettings, uploadBannerImage, deleteBannerImage, deleteOldGameRecords } from '@/lib/firebase/settings';
import { Loader, Trash2, PlusCircle, Upload, Archive } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Image from 'next/image';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const BannerManager = ({ title, bannerUrls, gameType, onUpdate }: { title: string, bannerUrls: string[], gameType: 'classic' | 'popular' | 'referral', onUpdate: (urls: string[]) => void }) => {
    const [isUploading, setIsUploading] = useState(false);
    const { toast } = useToast();
    const isSingleImage = gameType === 'referral';

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const newUrl = await uploadBannerImage(file, gameType);
            onUpdate(isSingleImage ? [newUrl] : [...bannerUrls, newUrl]);
            toast({ title: 'Success', description: 'Banner uploaded!' });
        } catch (error: any) {
            toast({ title: 'Upload Failed', description: error.message, variant: 'destructive' });
        } finally {
            setIsUploading(false);
        }
    };

    const handleImageDelete = async (urlToDelete: string) => {
        try {
            await deleteBannerImage(urlToDelete);
            onUpdate(bannerUrls.filter(url => url !== urlToDelete));
            toast({ title: 'Success', description: 'Banner deleted!' });
        } catch (error: any) {
            toast({ title: 'Delete Failed', description: error.message, variant: 'destructive' });
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className={`grid ${isSingleImage ? 'grid-cols-1' : 'grid-cols-2 md:grid-cols-3'} gap-4 mb-4`}>
                    {bannerUrls.map((url, index) => (
                        <div key={index} className="relative group">
                            <Image src={url} alt={`${title} Banner ${index + 1}`} width={200} height={112} className="rounded-md object-cover aspect-video" data-ai-hint="game banner"/>
                            <Button
                                variant="destructive"
                                size="icon"
                                className="absolute top-1 right-1 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => handleImageDelete(url)}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                </div>
                {(!isSingleImage || bannerUrls.length === 0) && (
                    <Label htmlFor={`banner-upload-${gameType}`} className="w-full">
                        <div className="flex items-center justify-center w-full px-4 py-2 border-2 border-dashed rounded-md cursor-pointer hover:bg-muted">
                            {isUploading ? <Loader className="animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                            <span>Upload Image</span>
                        </div>
                        <Input id={`banner-upload-${gameType}`} type="file" accept="image/*" className="sr-only" onChange={handleImageUpload} disabled={isUploading} />
                    </Label>
                 )}
            </CardContent>
        </Card>
    );
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>({ upiIds: [], promotionBannerText: '', festiveGreeting: { enabled: false, type: 'None', message: '' }, gameBanners: {classic: [], popular: []} });
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchSettings() {
      try {
        const fetchedSettings = await getSettings();
        setSettings(fetchedSettings);
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
    const newUpiIds = [...(settings.upiIds || [])];
    const upi = newUpiIds[index];
    if (typeof upi[field] === 'number') {
        newUpiIds[index] = { ...upi, [field]: Number(value) };
    } else {
        newUpiIds[index] = { ...upi, [field]: value };
    }
    setSettings(prev => ({ ...prev, upiIds: newUpiIds }));
  };
  
  const handleContentChange = (field: keyof AppSettings, value: string) => {
      setSettings(prev => ({ ...prev, [field]: value }));
  }

  const handleFestiveGreetingChange = (field: keyof NonNullable<AppSettings['festiveGreeting']>, value: string | boolean) => {
      setSettings(prev => ({
          ...prev,
          festiveGreeting: {
              ...prev.festiveGreeting!,
              [field]: value
          }
      }));
  };

  const handleReferralSettingChange = (field: keyof NonNullable<AppSettings['referralSettings']>, value: any) => {
      setSettings(prev => ({
          ...prev,
          referralSettings: {
              ...prev.referralSettings!,
              [field]: value
          }
      }));
  }

  const handleBannerUpdate = (gameType: 'classic' | 'popular' | 'referral', urls: string[]) => {
      setSettings(prev => ({
          ...prev,
          gameBanners: {
              ...prev.gameBanners!,
              [gameType]: urls,
          }
      }));
  }

  const addUpiId = () => {
    const newUpiIds = [...(settings.upiIds || []), { id: '', name: '', limit: 50000, currentAmount: 0 }];
    setSettings(prev => ({ ...prev, upiIds: newUpiIds }));
  };

  const removeUpiId = (index: number) => {
    const newUpiIds = (settings.upiIds || []).filter((_, i) => i !== index);
    setSettings(prev => ({ ...prev, upiIds: newUpiIds }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateSettings(settings);
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
        const resetUpiIds = (settings.upiIds || []).map(upi => ({ ...upi, currentAmount: 0 }));
        await updateSettings({ ...settings, upiIds: resetUpiIds });
        setSettings(prev => ({...prev, upiIds: resetUpiIds}));
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

   const handleCleanup = async () => {
    setIsDeleting(true);
    try {
      const deletedCount = await deleteOldGameRecords();
      toast({
        title: 'Cleanup Complete',
        description: `${deletedCount} old battle records have been deleted.`,
      });
    } catch (error: any) {
      toast({
        title: 'Cleanup Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
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
            <CardTitle>App Settings</CardTitle>
            <CardDescription>Manage your application's settings from one place.</CardDescription>
        </CardHeader>
        <CardContent>
            <Tabs defaultValue="payments">
                <TabsList className="grid grid-cols-2 md:grid-cols-4">
                    <TabsTrigger value="payments">Payment</TabsTrigger>
                    <TabsTrigger value="content">Content</TabsTrigger>
                    <TabsTrigger value="app">App</TabsTrigger>
                    <TabsTrigger value="data">Data Management</TabsTrigger>
                </TabsList>
                
                <TabsContent value="payments">
                    <Card>
                        <CardHeader>
                            <CardTitle>Payment Settings</CardTitle>
                            <CardDescription>Manage UPI IDs for payments. The system will automatically rotate to the next available UPI ID once a limit is reached.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                            {(settings.upiIds || []).map((upi, index) => {
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
                                {isSaving ? 'Saving...' : 'Save All Settings'}
                                </Button>
                                <Button onClick={resetDailyLimits} variant="destructive" disabled={isSaving}>
                                {isSaving ? 'Resetting...' : 'Reset All Daily Limits'}
                                </Button>
                            </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="content">
                     <Card>
                        <CardHeader>
                            <CardTitle>Content Management</CardTitle>
                            <CardDescription>Update the text for your legal and information pages here. Use Markdown for formatting.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="terms-content">Terms and Conditions</Label>
                                <Textarea id="terms-content" value={settings.termsContent || ''} onChange={(e) => handleContentChange('termsContent', e.target.value)} rows={15} />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="privacy-content">Privacy Policy</Label>
                                <Textarea id="privacy-content" value={settings.privacyContent || ''} onChange={(e) => handleContentChange('privacyContent', e.target.value)} rows={15} />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="refund-content">Refund Policy</Label>
                                <Textarea id="refund-content" value={settings.refundContent || ''} onChange={(e) => handleContentChange('refundContent', e.target.value)} rows={15} />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="gst-content">GST Policy</Label>
                                <Textarea id="gst-content" value={settings.gstContent || ''} onChange={(e) => handleContentChange('gstContent', e.target.value)} rows={15} />
                            </div>
                             <div className="flex flex-col sm:flex-row gap-2">
                                <Button onClick={handleSave} disabled={isSaving}>
                                {isSaving ? 'Saving...' : 'Save All Settings'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                 <TabsContent value="app">
                     <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>App Content</CardTitle>
                                <CardDescription>Manage banners and popups that appear in the app.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="promotion-banner">Promotion Banner Text</Label>
                                    <Input id="promotion-banner" value={settings.promotionBannerText || ''} onChange={(e) => handleContentChange('promotionBannerText', e.target.value)} placeholder="e.g., Get 10% off on all games today!" />
                                    <p className="text-sm text-muted-foreground">This text will appear on the user's home page. Leave empty to hide.</p>
                                </div>
                                <div className="space-y-4">
                                    <BannerManager
                                        title="Classic Ludo Banners"
                                        bannerUrls={settings.gameBanners?.classic || []}
                                        gameType="classic"
                                        onUpdate={(urls) => handleBannerUpdate('classic', urls)}
                                    />
                                    <BannerManager
                                        title="Popular Ludo Banners"
                                        bannerUrls={settings.gameBanners?.popular || []}
                                        gameType="popular"
                                        onUpdate={(urls) => handleBannerUpdate('popular', urls)}
                                    />
                                </div>
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-base">Festive Greeting Popup</CardTitle>
                                        <CardDescription className="text-sm">Show a special popup to users when they open the app.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                         <div className="flex items-center space-x-2">
                                            <Switch 
                                                id="festive-enabled" 
                                                checked={settings.festiveGreeting?.enabled}
                                                onCheckedChange={(checked) => handleFestiveGreetingChange('enabled', checked)}
                                            />
                                            <Label htmlFor="festive-enabled">Enable Festive Greeting</Label>
                                        </div>
                                        {settings.festiveGreeting?.enabled && (
                                            <div className="space-y-4 pl-8 border-l-2 ml-3">
                                                <div className="space-y-2">
                                                    <Label htmlFor="festive-type">Festival Type</Label>
                                                    <Select
                                                        value={settings.festiveGreeting?.type}
                                                        onValueChange={(value) => handleFestiveGreetingChange('type', value)}
                                                    >
                                                        <SelectTrigger id="festive-type">
                                                            <SelectValue placeholder="Select a festival" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="None">None</SelectItem>
                                                            <SelectItem value="Generic">Generic Greeting</SelectItem>
                                                            <SelectItem value="Holi">Holi</SelectItem>
                                                            <SelectItem value="Diwali">Diwali</SelectItem>
                                                            <SelectItem value="Eid">Eid</SelectItem>
                                                            <SelectItem value="Christmas">Christmas</SelectItem>
                                                            <SelectItem value="IndependenceDay">Independence Day</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                     <p className="text-xs text-muted-foreground">This determines the background animation.</p>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="festive-message">Greeting Message</Label>
                                                    <Textarea 
                                                        id="festive-message" 
                                                        value={settings.festiveGreeting?.message || ''} 
                                                        onChange={(e) => handleFestiveGreetingChange('message', e.target.value)}
                                                        placeholder="e.g., Happy Diwali to you and your family!"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-base">Referral Settings</CardTitle>
                                        <CardDescription className="text-sm">Manage the content for the 'Refer & Earn' page.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <BannerManager
                                            title="Referral Page Image"
                                            bannerUrls={settings.referralSettings?.imageUrl ? [settings.referralSettings.imageUrl] : []}
                                            gameType="referral"
                                            onUpdate={(urls) => handleReferralSettingChange('imageUrl', urls[0] || '')}
                                        />
                                        <div className="space-y-2">
                                            <Label htmlFor="referral-share-text">Referral Share Text</Label>
                                            <Textarea
                                                id="referral-share-text"
                                                value={settings.referralSettings?.shareText || ''}
                                                onChange={(e) => handleReferralSettingChange('shareText', e.target.value)}
                                                placeholder="Use {{referralCode}} and {{referralLink}} as placeholders."
                                                rows={4}
                                            />
                                            <p className="text-xs text-muted-foreground">
                                                Use placeholders: {`{{referralCode}}`} and {`{{referralLink}}`}.
                                            </p>
                                        </div>
                                         <div className="space-y-2">
                                            <Label htmlFor="referral-how-it-works">"How It Works" Text</Label>
                                            <Textarea
                                                id="referral-how-it-works"
                                                value={settings.referralSettings?.howItWorksText || ''}
                                                onChange={(e) => handleReferralSettingChange('howItWorksText', e.target.value)}
                                                placeholder="Describe the referral program benefits."
                                                rows={4}
                                            />
                                        </div>
                                    </CardContent>
                                </Card>

                            </CardContent>
                        </Card>
                        <div className="flex flex-col sm:flex-row gap-2">
                            <Button onClick={handleSave} disabled={isSaving}>
                            {isSaving ? 'Saving...' : 'Save All Settings'}
                            </Button>
                        </div>
                    </div>
                </TabsContent>

                 <TabsContent value="data">
                    <Card>
                        <CardHeader>
                            <CardTitle>Data Management</CardTitle>
                            <CardDescription>Manage and clean up old database records.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Card className="p-4 bg-muted/50">
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                    <div>
                                        <h3 className="font-semibold">Clean Up Old Battle Records</h3>
                                        <p className="text-sm text-muted-foreground">Permanently delete battle records older than 30 days. This action cannot be undone.</p>
                                    </div>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="destructive" disabled={isDeleting}>
                                                {isDeleting ? <Loader className="animate-spin" /> : <Archive className="mr-2 h-4 w-4" />}
                                                Clean Up Now
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This will permanently delete all 'completed', 'cancelled', and 'disputed' battle records older than 30 days. This action cannot be undone and the data cannot be recovered.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={handleCleanup}>Yes, delete records</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            </Card>
                        </CardContent>
                    </Card>
                 </TabsContent>
            </Tabs>
        </CardContent>
    </Card>
  );
}
