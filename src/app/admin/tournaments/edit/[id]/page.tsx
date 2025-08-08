
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { getTournament, updateTournament, Tournament } from '@/lib/firebase/tournaments';
import { Calendar as CalendarIcon, ChevronLeft, Loader, PlusCircle, Trash2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import Link from 'next/link';

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

export default function EditTournamentPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const form = useForm<z.infer<typeof tournamentSchema>>({
    resolver: zodResolver(tournamentSchema),
    defaultValues: {
        prizeDistribution: [],
    },
  });

  useEffect(() => {
    if (typeof id !== 'string') return;
    
    getTournament(id).then(tournamentData => {
        if (tournamentData) {
            form.reset({
                ...tournamentData,
                startTime: tournamentData.startTime.toDate(),
                endTime: tournamentData.endTime.toDate(),
            });
        } else {
             toast({ title: "Error", description: "Tournament not found.", variant: "destructive" });
             router.push('/admin/tournaments');
        }
        setLoading(false);
    });

  }, [id, form, router, toast]);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "prizeDistribution",
  });

  async function onSubmit(values: z.infer<typeof tournamentSchema>) {
    if (typeof id !== 'string') return;
    setIsSubmitting(true);
    try {
      await updateTournament(id, values);
      toast({
        title: 'Tournament Updated',
        description: `${values.title} has been successfully updated.`,
      });
      router.push('/admin/tournaments');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: `Failed to update tournament: ${error.message}`,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
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
    <>
      <Link href="/admin/tournaments" className='mb-4 inline-block'>
        <Button variant="outline">
          <ChevronLeft /> Back to Tournaments
        </Button>
      </Link>
      <Card>
        <CardHeader>
          <CardTitle>Edit Tournament</CardTitle>
          <CardDescription>Update the details for this tournament.</CardDescription>
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
                 <div></div>
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
                Save Changes
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </>
  );
}
