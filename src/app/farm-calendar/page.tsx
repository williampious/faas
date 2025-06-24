
'use client';

import { useState, useEffect } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@/components/layout/page-header';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { PlusCircle, CalendarDays, Trash2, Loader2, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { format, parseISO } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useUserProfile } from '@/contexts/user-profile-context';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, serverTimestamp, orderBy } from 'firebase/firestore';
import type { CalendarEvent } from '@/types/calendar';

const eventFormSchema = z.object({
  title: z.string().min(2, { message: "Event title must be at least 2 characters." }).max(100),
  description: z.string().max(500).optional(),
});
type EventFormValues = z.infer<typeof eventFormSchema>;

const EVENTS_COLLECTION = 'farmEvents';
const EVENT_FORM_ID = 'event-form';

export default function FarmCalendarPage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { userProfile, isLoading: isProfileLoading } = useUserProfile();
  const { toast } = useToast();

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: { title: '', description: '' },
  });

  useEffect(() => {
    if (isProfileLoading) return;
    if (!userProfile?.farmId) {
      setError("Farm information is not available. Cannot load calendar events.");
      setIsLoading(false);
      return;
    }

    const fetchEvents = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const q = query(collection(db, EVENTS_COLLECTION), where("farmId", "==", userProfile.farmId), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        const fetchedEvents = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as CalendarEvent[];
        setEvents(fetchedEvents);
      } catch (err: any) {
        console.error("Error fetching events:", err);
        setError(`Failed to fetch events: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, [userProfile, isProfileLoading]);

  const onSubmit: SubmitHandler<EventFormValues> = async (data) => {
    if (!selectedDate) {
        toast({ title: "No Date Selected", description: "Please select a date on the calendar first.", variant: "destructive" });
        return;
    }
    if (!userProfile?.farmId) {
      toast({ title: "Error", description: "Farm information missing.", variant: "destructive" });
      return;
    }

    const eventData = {
      farmId: userProfile.farmId,
      date: format(selectedDate, 'yyyy-MM-dd'),
      title: data.title,
      description: data.description || '',
    };
    
    try {
        const docRef = await addDoc(collection(db, EVENTS_COLLECTION), {
            ...eventData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
        const newEvent = { ...eventData, id: docRef.id, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
        setEvents(prev => [newEvent, ...prev]);
        toast({ title: "Event Added", description: `"${data.title}" added to the calendar.` });
        setIsModalOpen(false);
        form.reset();
    } catch (err: any) {
        console.error("Error adding event:", err);
        toast({ title: "Save Failed", description: err.message, variant: "destructive" });
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    const eventToDelete = events.find(event => event.id === eventId);
    if (!eventToDelete) return;
    try {
        await deleteDoc(doc(db, EVENTS_COLLECTION, eventId));
        setEvents(events.filter(event => event.id !== eventId));
        toast({ title: "Event Deleted", description: `"${eventToDelete.title}" removed from calendar.`, variant: "destructive" });
    } catch(err: any) {
        toast({ title: "Deletion Failed", description: err.message, variant: "destructive" });
    }
  };

  const eventsForSelectedDate = selectedDate
    ? events.filter(event => event.date === format(selectedDate, 'yyyy-MM-dd'))
    : [];
    
  if (isProfileLoading || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-12rem)]">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
        <p className="ml-3 text-lg text-muted-foreground">Loading calendar...</p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Farm Calendar"
        icon={CalendarDays}
        description="Plan and track your farming tasks and events collaboratively."
        action={
          <Button onClick={() => { form.reset(); setIsModalOpen(true); }}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Event
          </Button>
        }
      />
      
      {error && <Card className="mb-4 bg-destructive/10 border-destructive"><CardContent className="p-4 text-destructive">{error}</CardContent></Card>}

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Event for {selectedDate ? format(selectedDate, 'PPP') : 'selected date'}</DialogTitle>
            <DialogDescription>
              {!selectedDate && "Please select a date on the calendar first."}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form id={EVENT_FORM_ID} onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
              <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                  <FormItem>
                      <FormLabel>Title*</FormLabel>
                      <FormControl><Input placeholder="e.g., Planting corn" {...field} /></FormControl>
                      <FormMessage />
                  </FormItem>
                  )}
              />
               <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                  <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl><Textarea placeholder="Add any details or notes here." {...field} /></FormControl>
                      <FormMessage />
                  </FormItem>
                  )}
              />
            </form>
          </Form>
          <DialogFooter>
            <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
            <Button type="submit" form={EVENT_FORM_ID} disabled={!selectedDate || form.formState.isSubmitting}>
              Save Event
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 shadow-lg">
          <CardContent className="p-0 md:p-2 flex justify-center">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md"
              modifiers={{
                hasEvent: events.map(event => parseISO(event.date))
              }}
              modifiersStyles={{
                hasEvent: { textDecoration: 'underline', textDecorationColor: 'hsl(var(--primary))', fontWeight: 'bold' }
              }}
            />
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline">
              Events for {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'selected date'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {eventsForSelectedDate.length > 0 ? (
              <ul className="space-y-3">
                {eventsForSelectedDate.map((event) => (
                  <li key={event.id} className="p-3 bg-muted/30 rounded-md border border-border/50">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-primary">{event.title}</h4>
                        {event.description && (
                          <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
                        )}
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteEvent(event.id)} className="text-destructive hover:text-destructive/80 h-7 w-7">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">No events for this date. Select a date and click "Add Event".</p>
            )}
          </CardContent>
        </Card>
      </div>
       <Card className="mt-6 bg-muted/30 p-4">
        <CardHeader className="p-0 pb-2">
            <CardTitle className="text-base font-semibold text-muted-foreground">About the Farm Calendar</CardTitle>
        </CardHeader>
        <CardContent className="p-0 text-xs text-muted-foreground space-y-1">
            <p>&bull; The Farm Calendar now saves events to your central Firestore database, making them visible to your entire team.</p>
            <p>&bull; This feature is designed for high-level event planning and scheduling. For detailed, actionable work items, use the Task Management board.</p>
        </CardContent>
      </Card>
    </div>
  );
}
