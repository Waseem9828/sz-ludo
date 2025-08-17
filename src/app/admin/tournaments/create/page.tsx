

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { createTournament, uploadTournamentImage } from '@/lib/firebase/tournaments';
import { Calendar as CalendarIcon, ChevronLeft, Loader, PlusCircle, Trash2, Upload } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { deleteBannerImage } from '@/lib/firebase/settings';
import Image from 'next/image';

const prizeDistributionSchema = z.object({
  rankStart: z.coerce.number().min(1, 'Rank must be at least 1'),
  rankEnd: z.coerce.number().min(1, 'Rank must be at least 1'),
  percentage: z.coerce.number().min(0, 'Percentage cannot be negative').max(100, 'Percentage cannot exceed 100'),
}).refine(data => data.rankEnd >= data.rankStart, {
  message: "End rank must be greater than or equal to start rank",
  path: ["rankEnd"],
});

const tournamentSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters long'),
  imageUrl: z.string().url('Please upload an image.').min(1, 'Image is required.'),
  entryFee: z.coerce.number().min(0, 'Entry fee cannot be negative'),
  playerCap: z.coerce.number().min(2, 'Player capacity must be at least 2'),
  adminCommission: z.coerce.number().min(0).max(100),
  startTime: z.date({ required_error: "Start date is required." }),
  endTime: z.date({ required_error: "End date is required." }),
  prizeDistribution: z.array(prizeDistributionSchema).min(1, 'At least one prize rank is required'),
}).refine(data => data.endTime > data.startTime, {
    message: "End time must be after the start time.",
    path: ["endTime"],
});

const BannerManager = ({ title, bannerUrl, onUpdate, singleImage = true }: { title: string, bannerUrl: string, onUpdate: (url: string) => void, singleImage?: boolean }) => {
    const [isUploading, setIsUploading] = useState(false);
    const { toast } = useToast();

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const newUrl = await uploadTournamentImage(file);
            onUpdate(newUrl);
            toast({ title: 'Success', description: 'Image uploaded!' });
        } catch (error: any) {
            toast({ title: 'Upload Failed', description: error.message, variant: 'destructive' });
        } finally {
            setIsUploading(false);
        }
    };

    const handleImageDelete = async (urlToDelete: string) => {
        try {
            await deleteBannerImage(urlToDelete);
            onUpdate('');
            toast({ title: 'Success', description: 'Image deleted!' });
        } catch (error: any) {
            toast({ title: 'Delete Failed', description: error.message, variant: 'destructive' });
        }
    };

    return (
        <Card className="p-4 bg-muted/20">
            <CardTitle className="text-sm font-medium mb-2">{title}</CardTitle>
            <div className="grid grid-cols-1 gap-4 mb-4">
                {bannerUrl && (
                    <div className="relative group">
                        <Image src={bannerUrl} alt={`${title} Banner`} width={200} height={112} className="rounded-md object-cover aspect-video" data-ai-hint="game tournament"/>
                        <Button
                            variant="destructive"
                            size="icon"
                            className="absolute top-1 right-1 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleImageDelete(bannerUrl)}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                )}
            </div>
            {(!bannerUrl) && (
                <Label htmlFor={`banner-upload-${title.replace(/\s+/g, '-')}`} className="w-full">
                    <div className="flex items-center justify-center w-full px-4 py-2 border-2 border-dashed rounded-md cursor-pointer hover:bg-muted">
                        {isUploading ? <Loader className="animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                        <span>Upload Image</span>
                    </div>
                    <Input id={`banner-upload-${title.replace(/\s+/g, '-')}`} type="file" accept="image/*" className="sr-only" onChange={handleImageUpload} disabled={isUploading} />
                </Label>
             )}
        </Card>
    );
};


export default function CreateTournamentPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof tournamentSchema>>({
    resolver: zodResolver(tournamentSchema),
    defaultValues: {
      title: '',
      imageUrl: '',
      entryFee: 50,
      playerCap: 1000,
      adminCommission: 10,
      startTime: undefined,
      endTime: undefined,
      prizeDistribution: [{ rankStart: 1, rankEnd: 1, percentage: 20 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "prizeDistribution",
  });

  async function onSubmit(values: z.infer<typeof tournamentSchema>) {
    setIsSubmitting(true);
    try {
      await createTournament(values);
      toast({
        title: 'Tournament Created',
        description: `${values.title} has been successfully created.`,
      });
      router.push('/admin/tournaments');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: `Failed to create tournament: ${error.message}`,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <Link href="/admin/tournaments" className='mb-4 inline-block'>
        <Button variant="outline">
          <ChevronLeft /> Back to Tournaments
        </Button>
      </Link>
      <Card>
        <CardHeader>
          <CardTitle>Create New Tournament</CardTitle>
          <CardDescription>Fill out the details to create a new tournament.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tournament Title</FormLabel>
                      <FormControl><Input placeholder="e.g., Mega Ludo Tournament" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tournament Image</FormLabel>
                      <FormControl>
                        <BannerManager
                            title="Tournament Image"
                            bannerUrl={field.value}
                            onUpdate={field.onChange}
                         />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Start Time</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                            >
                              {field.value ? format(field.value, "PPP p") : <span>Pick a start date</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date()}
                            initialFocus
                          />
                           <div className="p-3 border-t border-border">
                               <Input type="time" onChange={(e) => {
                                   const [hours, minutes] = e.target.value.split(':').map(Number);
                                   const newDate = new Date(field.value || new Date());
                                   newDate.setHours(hours, minutes);
                                   field.onChange(newDate);
                               }}/>
                           </div>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="endTime"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>End Time</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                            >
                              {field.value ? format(field.value, "PPP p") : <span>Pick an end date</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < (form.getValues('startTime') || new Date())}
                            initialFocus
                          />
                           <div className="p-3 border-t border-border">
                               <Input type="time" onChange={(e) => {
                                   const [hours, minutes] = e.target.value.split(':').map(Number);
                                   const newDate = new Date(field.value || new Date());
                                   newDate.setHours(hours, minutes);
                                   field.onChange(newDate);
                               }}/>
                           </div>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="entryFee"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Entry Fee (₹)</FormLabel>
                      <FormControl><Input type="number" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="playerCap"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Player Capacity</FormLabel>
                      <FormControl><Input type="number" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="adminCommission"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Admin Commission (%)</FormLabel>
                      <FormControl><Input type="number" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div>
                <Label className='text-lg font-semibold'>Prize Distribution</Label>
                <p className="text-sm text-muted-foreground">The total percentage of all ranks should ideally be 100%.</p>
                <div className="space-y-4 mt-2">
                  {fields.map((item, index) => (
                    <Card key={item.id} className="p-4 bg-muted/50">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <FormField
                          control={form.control}
                          name={`prizeDistribution.${index}.rankStart`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Rank Start</FormLabel>
                              <FormControl><Input type="number" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                         <FormField
                          control={form.control}
                          name={`prizeDistribution.${index}.rankEnd`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Rank End</FormLabel>
                              <FormControl><Input type="number" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                         <FormField
                          control={form.control}
                          name={`prizeDistribution.${index}.percentage`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Percentage (%)</FormLabel>
                              <FormControl><Input type="number" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          onClick={() => remove(index)}
                        >
                          <Trash2 className="mr-2" /> Remove
                        </Button>
                      </div>
                    </Card>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => append({ rankStart: 0, rankEnd: 0, percentage: 0 })}
                  >
                    <PlusCircle className="mr-2" /> Add Prize Rank
                  </Button>
                </div>
              </div>

              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader className="mr-2 animate-spin" />}
                Create Tournament
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </>
  );
}
