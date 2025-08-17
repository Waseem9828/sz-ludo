

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { getSettings, updateSettings, UpiId, AppSettings, uploadBannerImage, deleteBannerImage, deleteOldGameRecords, HomePageCard, ReferralSettings } from '@/lib/firebase/settings';
import { Loader, Trash2, PlusCircle, Upload, Archive, Link as LinkIcon } from 'lucide-react';
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
import { Dialog, DialogClose, DialogFooter, DialogHeader, DialogTitle, DialogDescription, DialogContent, DialogTrigger } from '@/components/ui/dialog';


const BannerManager = ({ title, bannerUrls, onUpdate, singleImage = false, folder }: { title: string, bannerUrls: string[], onUpdate: (urls: string[]) => void, singleImage?: boolean, folder: string }) => {
    const [isUploading, setIsUploading] = useState(false);
    const [newImageUrl, setNewImageUrl] = useState('');
    const { toast } = useToast();

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const newUrl = await uploadBannerImage(file, folder);
            onUpdate(singleImage ? [newUrl] : [...bannerUrls, newUrl]);
            toast({ title: 'Success', description: 'Image uploaded!' });
        } catch (error: any) {
            toast({ title: 'Upload Failed', description: error.message, variant: 'destructive' });
        } finally {
            setIsUploading(false);
        }
    };
    
    const handleAddImageUrl = () => {
        if (!newImageUrl.startsWith('http')) {
            toast({title: 'Invalid URL', description: 'Please enter a valid image URL.', variant: 'destructive' });
            return;
        }
         onUpdate(singleImage ? [newImageUrl] : [...bannerUrls, newImageUrl]);
         setNewImageUrl('');
    }

    const handleImageDelete = async (urlToDelete: string) => {
        try {
            // Check if it's a Firebase Storage URL before trying to delete from storage
            if (urlToDelete.includes('firebasestorage.googleapis.com')) {
                await deleteBannerImage(urlToDelete);
            }
            onUpdate(bannerUrls.filter(url => url !== urlToDelete));
            toast({ title: 'Success', description: 'Image removed!' });
        } catch (error: any) {
            toast({ title: 'Delete Failed', description: error.message, variant: 'destructive' });
        }
    };

    return (
        <Card className="p-4 bg-muted/20">
            <CardTitle className="text-sm font-medium mb-2">{title}</CardTitle>
            <div className={`grid ${singleImage ? 'grid-cols-1' : 'grid-cols-2 md:grid-cols-3'} gap-4 mb-4`}>
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
            {(!singleImage || bannerUrls.length === 0) && (
                 <div className="flex gap-2">
                    <Label htmlFor={`banner-upload-${folder}-${title.replace(/\s+/g, '-')}`} className="flex-grow">
                        <div className="flex items-center justify-center w-full px-4 py-2 border-2 border-dashed rounded-md cursor-pointer hover:bg-muted">
                            {isUploading ? <Loader className="animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                            <span>Upload</span>
                        </div>
                        <Input id={`banner-upload-${folder}-${title.replace(/\s+/g, '-')}`} type="file" accept="image/*" className="sr-only" onChange={handleImageUpload} disabled={isUploading} />
                    </Label>
                    <Dialog>
                        <DialogTrigger asChild>
                           <Button variant="outline" size="icon">
                                <LinkIcon />
                           </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add Image from URL</DialogTitle>
                                <DialogDescription>Paste an image link from Blogger or another website.</DialogDescription>
                            </DialogHeader>
                             <div className="py-4">
                                <Label htmlFor="image-url">Image URL</Label>
                                <Input
                                    id="image-url"
                                    type="url"
                                    value={newImageUrl}
                                    onChange={(e) => setNewImageUrl(e.target.value)}
                                    placeholder="https://..."
                                />
                            </div>
                             <DialogFooter>
                                <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
                                <DialogClose asChild>
                                    <Button onClick={handleAddImageUrl}>Add Image</Button>
                                </DialogClose>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
             )}
        </Card>
    );
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>({ upiIds: [], promotionBannerText: '', festiveGreeting: { enabled: false, type: 'None', message: '' }, homePageCards: [] });
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
  
  const handleReferralChange = (field: keyof ReferralSettings, value: any) => {
      setSettings(prev => ({ ...prev, referralSettings: { ...prev.referralSettings!, [field]: value } }));
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

  const handleHomePageCardChange = (index: number, field: keyof HomePageCard, value: any) => {
    const newCards = [...(settings.homePageCards || [])];
    newCards[index] = { ...newCards[index], [field]: value };
    setSettings(prev => ({...prev, homePageCards: newCards }));
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
                <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto">
                    <TabsTrigger value="payments">Payment</TabsTrigger>
                    <TabsTrigger value="content">Content</TabsTrigger>
                    <TabsTrigger value="app">App</TabsTrigger>
                    <TabsTrigger value="data">Data Management</TabsTrigger>
                </TabsList>
                
                <TabsContent value="payments">
                    <Card className="mt-4">
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
                                            <span className="text-sm font-mono whitespace-nowrap font-sans">₹{upi.currentAmount.toLocaleString()} / ₹{upi.limit.toLocaleString()}</span>
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
                     <Card className="mt-4">
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
                     <div className="space-y-6 mt-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Home Page Cards</CardTitle>
                                <CardDescription>Manage the game and tournament cards displayed on the home page.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {(settings.homePageCards || []).map((card, index) => (
                                    <Card key={card.id} className="p-4 border-2">
                                        <div className="flex justify-between items-center mb-4">
                                            <CardTitle className="text-lg">{card.type === 'game' ? 'Game Card' : 'Tournament Card'}</CardTitle>
                                            <div className="flex items-center space-x-2">
                                                <Label htmlFor={`card-enabled-${index}`}>Enable</Label>
                                                <Switch
                                                    id={`card-enabled-${index}`}
                                                    checked={card.enabled}
                                                    onCheckedChange={(checked) => handleHomePageCardChange(index, 'enabled', checked)}
                                                />
                                            </div>
                                        </div>
                                        <div className="grid md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor={`card-title-${index}`}>Title</Label>
                                                <Input id={`card-title-${index}`} value={card.title} onChange={(e) => handleHomePageCardChange(index, 'title', e.target.value)} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor={`card-desc-${index}`}>Description</Label>
                                                <Input id={`card-desc-${index}`} value={card.description} onChange={(e) => handleHomePageCardChange(index, 'description', e.target.value)} />
                                            </div>
                                        </div>
                                        <div className="mt-4">
                                            <BannerManager 
                                                title="Card Images" 
                                                bannerUrls={card.images}
                                                onUpdate={(urls) => handleHomePageCardChange(index, 'images', urls)}
                                                folder="homecards"
                                            />
                                        </div>
                                    </Card>
                                ))}
                            </CardContent>
                        </Card>
                        
                         <Card>
                            <CardHeader>
                                <CardTitle>Referral Page Content</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Referral Image</Label>
                                    <BannerManager 
                                        title="Referral Image" 
                                        bannerUrls={settings.referralSettings?.imageUrl ? [settings.referralSettings.imageUrl] : []}
                                        onUpdate={(urls) => handleReferralChange('imageUrl', urls[0] || '')}
                                        singleImage={true}
                                        folder="referral"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="referral-share-text">Share Text</Label>
                                    <Textarea id="referral-share-text" value={settings.referralSettings?.shareText || ''} onChange={(e) => handleReferralChange('shareText', e.target.value)} rows={4} placeholder="e.g. Hey! I'm playing on SZ LUDO... Use my code {{referralCode}}"/>
                                     <p className="text-xs text-muted-foreground">Use `{{referralCode}}` and `{{referralLink}}` as placeholders.</p>
                                </div>
                                 <div className="space-y-2">
                                    <Label htmlFor="referral-how-text">"How It Works" Text</Label>
                                    <Textarea id="referral-how-text" value={settings.referralSettings?.howItWorksText || ''} onChange={(e) => handleReferralChange('howItWorksText', e.target.value)} rows={4} placeholder="e.g. You can refer and earn 2%..."/>
                                </div>
                            </CardContent>
                        </Card>


                        <Card>
                            <CardHeader>
                                <CardTitle>Other App Content</CardTitle>
                                <CardDescription>Manage banners and popups that appear in the app.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="promotion-banner">Promotion Banner Text</Label>
                                    <Textarea 
                                      id="promotion-banner"
                                      value={settings.promotionBannerText || ''} 
                                      onChange={(e) => handleContentChange('promotionBannerText', e.target.value)} 
                                      placeholder="e.g., Get 10% off on all games today!"
                                      rows={4}
                                    />
                                    <p className="text-sm text-muted-foreground">Each line you enter here will be shown as a separate animated message.</p>
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
                    <Card className="mt-4">
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
