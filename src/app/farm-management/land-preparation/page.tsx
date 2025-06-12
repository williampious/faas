
'use client';

import { useState, useEffect } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@/components/layout/page-header';
import { Shovel, PlusCircle, Trash2, Edit2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from '@/components/ui/table';
import { format, parseISO, isValid } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

const activityTypes = ['Field Clearing', 'Weeding', 'Ploughing', 'Harrowing', 'Levelling'] as const;
type LandPreparationActivityType = typeof activityTypes[number];

interface LandPreparationActivity {
  id: string;
  activityType: LandPreparationActivityType;
  date: string; // ISO string "yyyy-MM-dd"
  areaAffected: string;
  notes?: string;
}

const activityFormSchema = z.object({
  activityType: z.enum(activityTypes, { required_error: "Activity type is required." }),
  date: z.string().refine((val) => !!val && isValid(parseISO(val)), { message: "Valid date is required." }),
  areaAffected: z.string().min(1, { message: "Area affected is required." }).max(100, { message: "Area affected must be 100 characters or less."}),
  notes: z.string().max(500, {message: "Notes must be 500 characters or less."}).optional(),
});

type ActivityFormValues = z.infer<typeof activityFormSchema>;

const LOCAL_STORAGE_KEY = 'landPreparationActivities';

export default function LandPreparationPage() {
  const [activities, setActivities] = useState<LandPreparationActivity[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<LandPreparationActivity | null>(null);
  const { toast } = useToast();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const storedActivities = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (storedActivities) {
      setActivities(JSON.parse(storedActivities));
    }
  }, []);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(activities));
    }
  }, [activities, isMounted]);

  const form = useForm<ActivityFormValues>({
    resolver: zodResolver(activityFormSchema),
    defaultValues: {
      activityType: undefined,
      date: '',
      areaAffected: '',
      notes: '',
    },
  });

  const handleOpenModal = (activityToEdit?: LandPreparationActivity) => {
    if (activityToEdit) {
      setEditingActivity(activityToEdit);
      form.reset({
        activityType: activityToEdit.activityType,
        date: activityToEdit.date,
        areaAffected: activityToEdit.areaAffected,
        notes: activityToEdit.notes || '',
      });
    } else {
      setEditingActivity(null);
      form.reset({ activityType: undefined, date: '', areaAffected: '', notes: '' });
    }
    setIsModalOpen(true);
  };

  const onSubmit: SubmitHandler<ActivityFormValues> = (data) => {
    if (editingActivity) {
      setActivities(
        activities.map((act) =>
          act.id === editingActivity.id ? { ...act, ...data } : act
        )
      );
      toast({ title: "Activity Updated", description: `${data.activityType} activity has been updated.` });
    } else {
      const newActivity: LandPreparationActivity = {
        id: crypto.randomUUID(),
        ...data,
      };
      setActivities([...activities, newActivity]);
      toast({ title: "Activity Logged", description: `${data.activityType} activity has been successfully logged.` });
    }
    setIsModalOpen(false);
    setEditingActivity(null);
    form.reset();
  };

  const handleDeleteActivity = (id: string) => {
    setActivities(activities.filter((act) => act.id !== id));
    toast({ title: "Activity Deleted", description: "The activity has been removed.", variant: "destructive" });
  };
  
  if (!isMounted) {
    return null; // Or a loading skeleton
  }

  return (
    <div>
      <PageHeader
        title="Land Preparation Management"
        icon={Shovel}
        description="Log, track, and manage all activities related to preparing your land for planting."
        action={
          <Button onClick={() => handleOpenModal()}>
            <PlusCircle className="mr-2 h-4 w-4" /> Log New Activity
          </Button>
        }
      />

      <Dialog open={isModalOpen} onOpenChange={(isOpen) => {
        setIsModalOpen(isOpen);
        if (!isOpen) {
          form.reset();
          setEditingActivity(null);
        }
      }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingActivity ? 'Edit Activity' : 'Log New Land Preparation Activity'}</DialogTitle>
            <DialogDescription>
              {editingActivity ? 'Update the details of this activity.' : 'Enter details for the new land preparation activity.'}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
              <FormField
                control={form.control}
                name="activityType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Activity Type*</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select activity type" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {activityTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date*</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="areaAffected"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Area Affected*</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., North Field - 5 acres, Plot B2" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Any additional details or observations" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="mt-2">
                <DialogClose asChild>
                  <Button type="button" variant="outline">Cancel</Button>
                </DialogClose>
                <Button type="submit">
                  {editingActivity ? 'Save Changes' : 'Log Activity'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Logged Land Preparation Activities</CardTitle>
          <CardDescription>
            View all recorded activities. Edit or delete as needed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activities.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Activity Type</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Area Affected</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activities.sort((a,b) => parseISO(b.date).getTime() - parseISO(a.date).getTime()).map((activity) => (
                  <TableRow key={activity.id}>
                    <TableCell className="font-medium">{activity.activityType}</TableCell>
                    <TableCell>{isValid(parseISO(activity.date)) ? format(parseISO(activity.date), 'MMMM d, yyyy') : 'Invalid Date'}</TableCell>
                    <TableCell>{activity.areaAffected}</TableCell>
                    <TableCell className="max-w-xs truncate">{activity.notes || 'N/A'}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="icon" onClick={() => handleOpenModal(activity)} className="h-8 w-8">
                        <Edit2 className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button variant="destructive" size="icon" onClick={() => handleDeleteActivity(activity.id)} className="h-8 w-8">
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
             <div className="text-center py-10">
                <Shovel className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-4 text-muted-foreground">No land preparation activities logged yet.</p>
                <p className="text-sm text-muted-foreground">Click "Log New Activity" to get started.</p>
            </div>
          )}
        </CardContent>
      </Card>
       <Card className="mt-6 bg-muted/30 p-4">
        <CardHeader className="p-0 pb-2">
            <CardTitle className="text-base font-semibold text-muted-foreground">About Land Preparation Management</CardTitle>
        </CardHeader>
        <CardContent className="p-0 text-xs text-muted-foreground space-y-1">
            <p>&bull; This section helps you track crucial groundwork before planting.</p>
            <p>&bull; Log activities like Field Clearing, Weeding, Ploughing, Harrowing, and Levelling.</p>
            <p>&bull; Record the date, specific area affected, and any relevant notes for each activity.</p>
            <p>&bull; Future enhancements will include resource allocation (labor, equipment, materials) and cost tracking for these activities.</p>
        </CardContent>
      </Card>
    </div>
  );
}
