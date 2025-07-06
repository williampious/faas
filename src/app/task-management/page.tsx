
'use client';

import { useState, useEffect } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { PlusCircle, ListChecks, Edit2, Trash2, GripVertical, CalendarIcon, Briefcase, User, Tag, Loader2 } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Badge } from '@/components/ui/badge';
import { format, parseISO, isValid } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useUserProfile } from '@/contexts/user-profile-context';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, orderBy } from 'firebase/firestore';
import type { Task, TaskStatus, TaskPriority } from '@/types/task';
import { taskStatuses, taskPriorities } from '@/types/task';
import type { FarmingYear } from '@/types/season';

const farmAreas = ["Main Field", "Greenhouse", "Orchard", "Barn", "Equipment Shed", "Irrigation System", "General Farm Operations"];
const TASKS_COLLECTION = 'tasks';
const FARMING_YEARS_COLLECTION = 'farmingYears';

const taskFormSchema = z.object({
  name: z.string().min(2, { message: "Task name must be at least 2 characters." }),
  assignedArea: z.string().min(1, "Please select an assigned area."),
  status: z.enum(taskStatuses),
  priority: z.enum(taskPriorities),
  description: z.string().max(500).optional(),
  project: z.string().max(100).optional(),
  owner: z.string().max(100).optional(),
  startDate: z.string().optional(),
  dueDate: z.string().optional(),
  farmingYearId: z.string().min(1, "Farming Year selection is required."),
  farmingSeasonId: z.string().min(1, "Farming Season selection is required."),
});
type TaskFormValues = z.infer<typeof taskFormSchema>;

interface SortableTaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onChangeStatus: (id: string, newStatus: TaskStatus) => void;
}

function SortableTaskCard({ task, onEdit, onDelete, onChangeStatus }: SortableTaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
    opacity: isDragging ? 0.8 : 1,
  };

  const getPriorityBadgeVariant = (priority: TaskPriority) => {
    switch (priority) {
      case 'High': return 'destructive';
      case 'Medium': return 'secondary';
      case 'Low': return 'default';
      default: return 'outline';
    }
  };

  return (
    <Card ref={setNodeRef} style={style} className="mb-3 shadow-md bg-card hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="p-4 pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-semibold flex-grow mr-2">{task.name}</CardTitle>
          <div className="flex items-center flex-shrink-0">
            <Badge variant={getPriorityBadgeVariant(task.priority)} className="mr-2 text-xs h-6">{task.priority}</Badge>
            <Button variant="ghost" size="icon" className="cursor-grab p-1" {...attributes} {...listeners}>
              <GripVertical className="h-5 w-5 text-muted-foreground" />
            </Button>
          </div>
        </div>
        {task.description && <CardDescription className="text-xs mt-1 text-muted-foreground">{task.description}</CardDescription>}
      </CardHeader>
      <CardContent className="p-4 pt-2 text-xs space-y-1.5">
        {task.project && <p className="text-muted-foreground"><Tag className="inline h-3.5 w-3.5 mr-1 text-primary/70" />Project: {task.project}</p>}
        <p className="text-muted-foreground"><Briefcase className="inline h-3.5 w-3.5 mr-1 text-primary/70" />Area: {task.assignedArea}</p>
        {task.owner && <p className="text-muted-foreground"><User className="inline h-3.5 w-3.5 mr-1 text-primary/70" />Owner: {task.owner}</p>}
        
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          {task.startDate && isValid(parseISO(task.startDate)) && (
            <p className="text-muted-foreground"><CalendarIcon className="inline h-3.5 w-3.5 mr-1 text-green-600" />Start: {format(parseISO(task.startDate), 'MMM d, yyyy')}</p>
          )}
          {task.dueDate && isValid(parseISO(task.dueDate)) && (
            <p className="text-muted-foreground"><CalendarIcon className="inline h-3.5 w-3.5 mr-1 text-red-600" />Due: {format(parseISO(task.dueDate), 'MMM d, yyyy')}</p>
          )}
        </div>

        <div className="mt-3 flex justify-between items-center">
          <Select value={task.status} onValueChange={(newStatus) => onChangeStatus(task.id, newStatus as TaskStatus)}>
            <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>{taskStatuses.map(status => <SelectItem key={status} value={status} className="text-xs">{status}</SelectItem>)}</SelectContent>
          </Select>
          <div className="flex gap-1">
            <Button variant="outline" size="icon" onClick={() => onEdit(task)} className="h-8 w-8"><Edit2 className="h-4 w-4" /></Button>
            <Button variant="outline" size="icon" onClick={() => onDelete(task.id)} className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function TaskManagementPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { userProfile, isLoading: isProfileLoading } = useUserProfile();
  const { toast } = useToast();
  const [farmingYears, setFarmingYears] = useState<FarmingYear[]>([]);

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      name: '', assignedArea: '', status: 'To Do', priority: 'Medium',
      description: '', project: '', owner: '', startDate: '', dueDate: '',
    },
  });
  
  const watchedFarmingYearId = form.watch("farmingYearId");

  useEffect(() => {
    if (isProfileLoading) return;
    if (!userProfile?.farmId) {
      setError("Farm information is not available. Cannot load tasks.");
      setIsLoading(false);
      return;
    }

    const fetchInitialData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        if (!userProfile.farmId) throw new Error("User is not associated with a farm.");
        
        const tasksQuery = query(collection(db, TASKS_COLLECTION), where("farmId", "==", userProfile.farmId), orderBy("createdAt", "desc"));
        const tasksSnapshot = await getDocs(tasksQuery);
        const fetchedTasks = tasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Task[];
        setTasks(fetchedTasks);
        
        const yearsQuery = query(collection(db, FARMING_YEARS_COLLECTION), where("farmId", "==", userProfile.farmId), orderBy("startDate", "desc"));
        const yearsSnapshot = await getDocs(yearsQuery);
        const fetchedYears = yearsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FarmingYear));
        setFarmingYears(fetchedYears);

      } catch (err: any) {
        console.error("Error fetching data:", err);
        setError(`Failed to fetch tasks: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchInitialData();
    
    if (typeof window !== 'undefined' && window.location.hash === '#add') {
      setIsModalOpen(true);
      window.location.hash = ''; 
    }
  }, [userProfile, isProfileLoading]);

  const handleOpenModal = (taskToEdit?: Task) => {
    if (taskToEdit) {
      setEditingTask(taskToEdit);
      form.reset({
        ...taskToEdit,
        description: taskToEdit.description || '',
        project: taskToEdit.project || '',
        owner: taskToEdit.owner || '',
        startDate: taskToEdit.startDate || '',
        dueDate: taskToEdit.dueDate || '',
      });
    } else {
      setEditingTask(null);
      form.reset({
        name: '', assignedArea: '', status: 'To Do', priority: 'Medium',
        description: '', project: '', owner: '', startDate: '', dueDate: '',
      });
    }
    setIsModalOpen(true);
  };

  const onSubmit: SubmitHandler<TaskFormValues> = async (data) => {
    if (!userProfile?.farmId) {
      toast({ title: "Error", description: "Farm information missing.", variant: "destructive" });
      return;
    }

    const taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'> = {
      farmId: userProfile.farmId,
      ...data,
      description: data.description || '',
      project: data.project || '',
      owner: data.owner || '',
      startDate: data.startDate || '',
      dueDate: data.dueDate || '',
    };

    try {
      if (editingTask) {
        const taskRef = doc(db, TASKS_COLLECTION, editingTask.id);
        await updateDoc(taskRef, { ...taskData, updatedAt: serverTimestamp() });
        setTasks(tasks.map(t => (t.id === editingTask.id ? { ...t, ...taskData } : t)));
        toast({ title: "Task Updated", description: `Task "${data.name}" has been updated.` });
      } else {
        const docRef = await addDoc(collection(db, TASKS_COLLECTION), {
          ...taskData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        const newTask = { ...taskData, id: docRef.id, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
        setTasks(prev => [newTask, ...prev]);
        toast({ title: "Task Added", description: `Task "${data.name}" has been created.` });
      }
      setIsModalOpen(false);
      form.reset();
    } catch (err: any) {
      console.error("Error saving task:", err);
      toast({ title: "Save Failed", description: err.message, variant: "destructive" });
    }
  };

  const handleDeleteTask = async (id: string) => {
    const taskToDelete = tasks.find(t => t.id === id);
    if (!taskToDelete) return;
    try {
      await deleteDoc(doc(db, TASKS_COLLECTION, id));
      setTasks(tasks.filter(t => t.id !== id));
      toast({ title: "Task Deleted", description: `Task "${taskToDelete.name}" removed.`, variant: "destructive" });
    } catch(err: any) {
      toast({ title: "Deletion Failed", description: err.message, variant: "destructive" });
    }
  };

  const handleChangeStatus = async (id: string, newStatus: TaskStatus) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    // Update state immediately for better UX
    setTasks((prevTasks) =>
      prevTasks.map((t) => (t.id === id ? { ...t, status: newStatus } : t))
    );
    
    try {
      const taskRef = doc(db, TASKS_COLLECTION, id);
      await updateDoc(taskRef, { status: newStatus, updatedAt: serverTimestamp() });
    } catch(err: any) {
      // Revert state if DB update fails
      setTasks((prevTasks) =>
        prevTasks.map((t) => (t.id === id ? { ...t, status: task.status } : t))
      );
      toast({ title: "Status Update Failed", description: err.message, variant: "destructive" });
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    const activeContainer = active.data.current?.sortable.containerId;
    const overContainer = over.data.current?.sortable.containerId;
    const activeId = active.id.toString();
    const overId = over.id.toString();

    if (activeId === overId) return;

    if (activeContainer === overContainer) {
      // Reordering within the same column
      setTasks((currentTasks) => {
        const oldIndex = currentTasks.findIndex((t) => t.id === activeId);
        const newIndex = currentTasks.findIndex((t) => t.id === overId);
        return arrayMove(currentTasks, oldIndex, newIndex);
      });
    } else {
      // Moving to a different column (changing status)
      handleChangeStatus(activeId, overContainer as TaskStatus);
    }
  };


  const tasksByStatus = (statusFilter: TaskStatus) => tasks.filter(task => task.status === statusFilter);

  if (isProfileLoading || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-12rem)]">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
        <p className="ml-3 text-lg text-muted-foreground">Loading tasks...</p>
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div>
        <PageHeader
          title="Task Management"
          icon={ListChecks}
          description="Organize, assign, and track farm tasks on this collaborative board."
          action={<Button onClick={() => handleOpenModal()}><PlusCircle className="mr-2 h-4 w-4" /> Add New Task</Button>}
        />

        <Dialog open={isModalOpen} onOpenChange={(isOpen) => { setIsModalOpen(isOpen); if (!isOpen) form.reset(); }}>
          <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
            <DialogHeader><DialogTitle>{editingTask ? 'Edit Task' : 'Add New Task'}</DialogTitle></DialogHeader>
            <div className="flex-grow overflow-y-auto pr-2 py-4">
              <Form {...form}>
                <form id="task-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Task Name*</FormLabel><FormControl><Input placeholder="e.g., Water crops" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel>Description (Optional)</FormLabel><FormControl><Textarea placeholder="e.g., Water the tomato plants in greenhouse section A" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <FormField control={form.control} name="farmingYearId" render={({ field }) => (<FormItem><FormLabel>Farming Year*</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select Year" /></SelectTrigger></FormControl><SelectContent>{farmingYears.map(year => <SelectItem key={year.id} value={year.id}>{year.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                     <FormField control={form.control} name="farmingSeasonId" render={({ field }) => (<FormItem><FormLabel>Farming Season*</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value} disabled={!watchedFarmingYearId}><FormControl><SelectTrigger><SelectValue placeholder="Select Season" /></SelectTrigger></FormControl><SelectContent>{farmingYears.find(y => y.id === watchedFarmingYearId)?.seasons.map(season => <SelectItem key={season.id} value={season.id}>{season.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                   </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="assignedArea" render={({ field }) => (<FormItem><FormLabel>Assigned Area*</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select area" /></SelectTrigger></FormControl><SelectContent>{farmAreas.map(area => <SelectItem key={area} value={area}>{area}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="project" render={({ field }) => (<FormItem><FormLabel>Project (Optional)</FormLabel><FormControl><Input placeholder="e.g., Q3 Tomato Planting" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="owner" render={({ field }) => (<FormItem><FormLabel>Assigned To (Owner)</FormLabel><FormControl><Input placeholder="e.g., John Doe, Weeding Team" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="priority" render={({ field }) => (<FormItem><FormLabel>Priority</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select priority" /></SelectTrigger></FormControl><SelectContent>{taskPriorities.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <FormField control={form.control} name="startDate" render={({ field }) => (<FormItem><FormLabel>Start Date (Optional)</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)} />
                     <FormField control={form.control} name="dueDate" render={({ field }) => (<FormItem><FormLabel>Due Date (Optional)</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  </div>
                  <FormField control={form.control} name="status" render={({ field }) => (<FormItem><FormLabel>Status</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger></FormControl><SelectContent>{taskStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                </form>
              </Form>
            </div>
            <DialogFooter className="border-t pt-4"><DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose><Button type="submit" form="task-form">{editingTask ? 'Save Changes' : 'Add Task'}</Button></DialogFooter>
          </DialogContent>
        </Dialog>
        
        {error && <Card className="mb-4 bg-destructive/10 border-destructive"><CardContent className="p-4 text-destructive">{error}</CardContent></Card>}

        <div className="grid md:grid-cols-3 gap-6">
          {taskStatuses.map((statusColumn) => (
            <Card key={statusColumn} className="shadow-lg bg-muted/10 dark:bg-muted/20">
              <CardHeader className="border-b border-border/70"><CardTitle className="font-headline text-xl">{statusColumn} ({tasksByStatus(statusColumn).length})</CardTitle></CardHeader>
              <CardContent className="pt-4 min-h-[200px] p-3">
                 <SortableContext items={tasksByStatus(statusColumn).map(t => t.id)} strategy={verticalListSortingStrategy}>
                    {tasksByStatus(statusColumn).length > 0 ? (
                      tasksByStatus(statusColumn).map(task => (
                        <SortableTaskCard key={task.id} task={task} onEdit={handleOpenModal} onDelete={handleDeleteTask} onChangeStatus={handleChangeStatus} />
                      ))
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-sm text-muted-foreground italic text-center py-4">Drag tasks here or add a new one.</p>
                      </div>
                    )}
                 </SortableContext>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DndContext>
  );
}
