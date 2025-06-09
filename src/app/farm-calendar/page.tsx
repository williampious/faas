'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { PlusCircle, CalendarDays, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { format, parseISO } from 'date-fns';

interface CalendarEvent {
  id: string;
  date: string; // Store date as ISO string "yyyy-MM-dd"
  title: string;
  description?: string;
}

export default function FarmCalendarPage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDescription, setNewEventDescription] = useState('');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    // Load events from local storage if any
    const storedEvents = localStorage.getItem('farmEvents');
    if (storedEvents) {
      setEvents(JSON.parse(storedEvents));
    }
  }, []);
  
  useEffect(() => {
    if (isMounted) {
      localStorage.setItem('farmEvents', JSON.stringify(events));
    }
  }, [events, isMounted]);


  const handleAddEvent = () => {
    if (!selectedDate || !newEventTitle) return;
    const newEvent: CalendarEvent = {
      id: crypto.randomUUID(),
      date: format(selectedDate, 'yyyy-MM-dd'),
      title: newEventTitle,
      description: newEventDescription,
    };
    setEvents([...events, newEvent]);
    setNewEventTitle('');
    setNewEventDescription('');
  };

  const handleDeleteEvent = (eventId: string) => {
    setEvents(events.filter(event => event.id !== eventId));
  };

  const eventsForSelectedDate = selectedDate
    ? events.filter(event => event.date === format(selectedDate, 'yyyy-MM-dd'))
    : [];

  if (!isMounted) {
    return null; // or a loading spinner
  }

  return (
    <div>
      <PageHeader
        title="Farm Calendar"
        icon={CalendarDays}
        description="Plan and track your farming tasks and events."
        action={
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Event
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add New Event for {selectedDate ? format(selectedDate, 'PPP') : 'selected date'}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="event-title" className="text-right">
                    Title
                  </Label>
                  <Input
                    id="event-title"
                    value={newEventTitle}
                    onChange={(e) => setNewEventTitle(e.target.value)}
                    className="col-span-3"
                    placeholder="e.g., Planting corn"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="event-description" className="text-right">
                    Description
                  </Label>
                  <Textarea
                    id="event-description"
                    value={newEventDescription}
                    onChange={(e) => setNewEventDescription(e.target.value)}
                    className="col-span-3"
                    placeholder="Optional details"
                  />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">Cancel</Button>
                </DialogClose>
                <DialogClose asChild>
                  <Button type="submit" onClick={handleAddEvent} disabled={!selectedDate || !newEventTitle}>
                    Save Event
                  </Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

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
                hasEvent: { fontWeight: 'bold', textDecoration: 'underline', textDecorationColor: 'hsl(var(--primary))' }
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
                  <li key={event.id} className="p-3 bg-accent/10 rounded-md border border-accent/20">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-primary">{event.title}</h4>
                        {event.description && (
                          <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
                        )}
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteEvent(event.id)} className="text-destructive hover:text-destructive/80">
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
    </div>
  );
}
