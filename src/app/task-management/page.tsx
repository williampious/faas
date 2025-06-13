
'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { PlusCircle, ListChecks, Edit2, Trash2, GripVertical, AlertTriangle, CalendarIcon, Briefcase, User, Tag } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Badge } from '@/components/ui/badge';
import { format, parseISO, isValid } from 'date-fns';

type TaskStatus = 'To Do' | 'In Progress' | 'Done';
type TaskPriority = 'High' | 'Medium' | 'Low';

interface TaskItem {
  id: string;
  name: string;
  assignedArea: string;
  status: TaskStatus;
  dueDate?: string;
  description?: string;
  // New fields
  priority: TaskPriority;
  project?: string;
  owner?: string; // Assignee name
  startDate?: string; // ISO date string
}

const farmAreas = ["Main Field", "Greenhouse", "Orchard", "Barn", "Equipment Shed", "Irrigation System", "General Farm Operations"];
const taskStatuses: TaskStatus[] = ['To Do', 'In Progress', 'Done'];
const taskPriorities: TaskPriority[] = ['High', 'Medium', 'Low'];

interface SortableTaskCardProps {
  task: TaskItem;
  onEdit: (task: TaskItem) => void;
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
      case 'Medium': return 'secondary'; // Consider a yellow/orange variant in theme if available
      case 'Low': return 'default'; // Consider a green/blue variant
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
            <SelectTrigger className="w-[140px] h-8 text-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {taskStatuses.map(status => <SelectItem key={status} value={status} className="text-xs">{status}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="flex gap-1">
            <Button variant="outline" size="icon" onClick={() => onEdit(task)} className="h-8 w-8">
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => onDelete(task.id)} className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function TaskManagementPage() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [assignedArea, setAssignedArea] = useState('');
  const [status, setStatus] = useState<TaskStatus>('To Do');
  const [dueDate, setDueDate] = useState('');
  const [description, setDescription] = useState('');
  // New form state
  const [priority, setPriority] = useState<TaskPriority>('Medium');
  const [project, setProject] = useState('');
  const [owner, setOwner] = useState('');
  const [startDate, setStartDate] = useState('');

  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
    const storedTasks = localStorage.getItem('farmTasks_v2'); // Updated key for new structure
    if (storedTasks) {
      setTasks(JSON.parse(storedTasks));
    }
    
    if (window.location.hash === '#add') {
      setIsModalOpen(true);
      window.location.hash = ''; 
    }
  }, []);

  useEffect(() => {
    if(isMounted) {
      localStorage.setItem('farmTasks_v2', JSON.stringify(tasks));
    }
  }, [tasks, isMounted]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const resetForm = () => {
    setName(''); 
    setAssignedArea(''); 
    setStatus('To Do'); 
    setDueDate(''); 
    setDescription('');
    setPriority('Medium');
    setProject('');
    setOwner('');
    setStartDate('');
    setEditingTask(null);
  };

  const handleSubmit = () => {
    if (!name || !assignedArea) {
      alert("Task Name and Assigned Area are required."); // Simple validation
      return;
    }
    
    const taskData = {
      name,
      assignedArea,
      status,
      dueDate: dueDate || undefined, // Ensure empty string becomes undefined
      description: description || undefined,
      priority,
      project: project || undefined,
      owner: owner || undefined,
      startDate: startDate || undefined,
    };

    if (editingTask) {
      setTasks(tasks.map(t => t.id === editingTask.id ? { ...editingTask, ...taskData } : t));
    } else {
      setTasks([...tasks, { id: crypto.randomUUID(), ...taskData }]);
    }
    resetForm();
    setIsModalOpen(false);
  };

  const handleEditTask = (task: TaskItem) => {
    setEditingTask(task);
    setName(task.name); 
    setAssignedArea(task.assignedArea); 
    setStatus(task.status);
    setDueDate(task.dueDate || ''); 
    setDescription(task.description || '');
    setPriority(task.priority || 'Medium');
    setProject(task.project || '');
    setOwner(task.owner || '');
    setStartDate(task.startDate || '');
    setIsModalOpen(true);
  };

  const handleDeleteTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
  };
  
  const handleChangeStatus = (id: string, newStatus: TaskStatus) => {
    setTasks(tasks.map(task => task.id === id ? { ...task, status: newStatus } : task));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id && over?.id) {
      const activeContainerId = tasks.find(t => t.id === active.id)?.status;
      const overContainerId = over.data.current?.sortable?.containerId as TaskStatus | undefined ?? tasks.find(t => t.id === over.id)?.status;

      if (activeContainerId === overContainerId) { // Dragging within the same column
        const oldIndex = tasks.filter(t => t.status === activeContainerId).findIndex((task) => task.id === active.id);
        const newIndex = tasks.filter(t => t.status === activeContainerId).findIndex((task) => task.id === over.id);
        
        const reorderedColumnTasks = arrayMove(tasks.filter(t => t.status === activeContainerId), oldIndex, newIndex);
        const otherTasks = tasks.filter(t => t.status !== activeContainerId);
        setTasks([...otherTasks, ...reorderedColumnTasks].sort((a, b) => taskStatuses.indexOf(a.status) - taskStatuses.indexOf(b.status))); // Re-sort by status column order for visual consistency

      } else if (overContainerId && taskStatuses.includes(overContainerId)) { // Dragging to a different column
         handleChangeStatus(active.id as string, overContainerId);
      }
    }
  };
  
  const tasksByStatus = (statusFilter: TaskStatus) => tasks.filter(task => task.status === statusFilter);

  if (!isMounted) return null;

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div>
        <PageHeader
          title="Task Management"
          icon={ListChecks}
          description="Organize, assign, and track farm tasks across different areas and projects."
          action={
            <Button onClick={() => { resetForm(); setIsModalOpen(true); }}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add New Task
            </Button>
          }
        />

        <Dialog open={isModalOpen} onOpenChange={(isOpen) => {
          setIsModalOpen(isOpen);
          if (!isOpen) resetForm();
        }}>
          <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
            <DialogHeader><DialogTitle>{editingTask ? 'Edit Task' : 'Add New Task'}</DialogTitle></DialogHeader>
            
            <div className="flex-grow overflow-y-auto pr-2 py-4 space-y-4">
              <div><Label htmlFor="task-name">Task Name*</Label><Input id="task-name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Water crops" /></div>
              <div><Label htmlFor="task-desc">Description (Optional)</Label><Textarea id="task-desc" value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g., Water the tomato plants in greenhouse section A" /></div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><Label htmlFor="assigned-area">Assigned Area*</Label>
                  <Select value={assignedArea} onValueChange={setAssignedArea}><SelectTrigger id="assigned-area"><SelectValue placeholder="Select area" /></SelectTrigger>
                    <SelectContent>{farmAreas.map(area => <SelectItem key={area} value={area}>{area}</SelectItem>)}</SelectContent></Select>
                </div>
                <div><Label htmlFor="project">Project (Optional)</Label><Input id="project" value={project} onChange={e => setProject(e.target.value)} placeholder="e.g., Q3 Tomato Planting" /></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><Label htmlFor="owner">Assigned To (Owner)</Label><Input id="owner" value={owner} onChange={e => setOwner(e.target.value)} placeholder="e.g., John Doe, Weeding Team" /></div>
                <div><Label htmlFor="priority">Priority</Label>
                  <Select value={priority} onValueChange={val => setPriority(val as TaskPriority)}><SelectTrigger id="priority"><SelectValue placeholder="Select priority" /></SelectTrigger>
                    <SelectContent>{taskPriorities.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div><Label htmlFor="start-date">Start Date (Optional)</Label><Input id="start-date" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} /></div>
                 <div><Label htmlFor="due-date">Due Date (Optional)</Label><Input id="due-date" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} /></div>
              </div>
             
              <div><Label htmlFor="status">Status</Label>
                  <Select value={status} onValueChange={val => setStatus(val as TaskStatus)}><SelectTrigger id="status"><SelectValue placeholder="Select status" /></SelectTrigger>
                    <SelectContent>{taskStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
              </div>
            </div>

            <DialogFooter className="border-t pt-4">
              <Button variant="outline" onClick={() => { setIsModalOpen(false); resetForm(); }}>Cancel</Button>
              <Button onClick={handleSubmit}>{editingTask ? 'Save Changes' : 'Add Task'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="grid md:grid-cols-3 gap-6">
          {taskStatuses.map((statusColumn) => (
            <Card key={statusColumn} className="shadow-lg bg-muted/10 dark:bg-muted/20">
              <CardHeader className="border-b border-border/70">
                <CardTitle className="font-headline text-xl">{statusColumn} ({tasksByStatus(statusColumn).length})</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 min-h-[200px] p-3">
                <SortableContext items={tasksByStatus(statusColumn).map(t => ({id: t.id}))} strategy={verticalListSortingStrategy}>
                  {tasksByStatus(statusColumn).length > 0 ? (
                    tasksByStatus(statusColumn).map(task => (
                      <SortableTaskCard key={task.id} task={task} onEdit={handleEditTask} onDelete={handleDeleteTask} onChangeStatus={handleChangeStatus} />
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground italic text-center py-4">No tasks in this stage.</p>
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
