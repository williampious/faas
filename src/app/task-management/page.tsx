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
import { PlusCircle, ListChecks, Edit2, Trash2, GripVertical } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

type TaskStatus = 'To Do' | 'In Progress' | 'Done';

interface TaskItem {
  id: string;
  name: string;
  assignedArea: string;
  status: TaskStatus;
  dueDate?: string;
  description?: string;
}

const farmAreas = ["Main Field", "Greenhouse", "Orchard", "Barn", "Equipment Shed", "Irrigation System"];
const taskStatuses: TaskStatus[] = ['To Do', 'In Progress', 'Done'];

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

  return (
    <Card ref={setNodeRef} style={style} className="mb-3 shadow-md bg-card hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="p-4">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-semibold">{task.name}</CardTitle>
          <div className="flex items-center">
            <Button variant="ghost" size="icon" className="cursor-grab p-1 mr-1" {...attributes} {...listeners}>
              <GripVertical className="h-5 w-5 text-muted-foreground" />
            </Button>
          </div>
        </div>
        {task.description && <CardDescription className="text-sm mt-1">{task.description}</CardDescription>}
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <p className="text-xs text-muted-foreground">Area: {task.assignedArea}</p>
        {task.dueDate && <p className="text-xs text-muted-foreground">Due: {task.dueDate}</p>}
        <div className="mt-3 flex justify-between items-center">
          <Select value={task.status} onValueChange={(newStatus) => onChangeStatus(task.id, newStatus as TaskStatus)}>
            <SelectTrigger className="w-[150px] h-8 text-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {taskStatuses.map(status => <SelectItem key={status} value={status} className="text-xs">{status}</SelectItem>)}
            </SelectContent>
          </Select>
          <div>
            <Button variant="outline" size="icon" onClick={() => onEdit(task)} className="h-8 w-8 mr-1">
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

  const [name, setName] = useState('');
  const [assignedArea, setAssignedArea] = useState('');
  const [status, setStatus] = useState<TaskStatus>('To Do');
  const [dueDate, setDueDate] = useState('');
  const [description, setDescription] = useState('');

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
    const storedTasks = localStorage.getItem('farmTasks');
    if (storedTasks) {
      setTasks(JSON.parse(storedTasks));
    }
    
    // Check for #add in URL to open modal
    if (window.location.hash === '#add') {
      setIsModalOpen(true);
      window.location.hash = ''; // Clear hash
    }

  }, []);

  useEffect(() => {
    if(isMounted) {
      localStorage.setItem('farmTasks', JSON.stringify(tasks));
    }
  }, [tasks, isMounted]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const resetForm = () => {
    setName(''); setAssignedArea(''); setStatus('To Do'); setDueDate(''); setDescription('');
    setEditingTask(null);
  };

  const handleSubmit = () => {
    if (!name || !assignedArea) return;
    if (editingTask) {
      setTasks(tasks.map(t => t.id === editingTask.id ? { ...editingTask, name, assignedArea, status, dueDate, description } : t));
    } else {
      setTasks([...tasks, { id: crypto.randomUUID(), name, assignedArea, status, dueDate, description }]);
    }
    resetForm();
    setIsModalOpen(false);
  };

  const handleEditTask = (task: TaskItem) => {
    setEditingTask(task);
    setName(task.name); setAssignedArea(task.assignedArea); setStatus(task.status);
    setDueDate(task.dueDate || ''); setDescription(task.description || '');
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
      const oldIndex = tasks.findIndex((task) => task.id === active.id);
      const newIndex = tasks.findIndex((task) => task.id === over.id);
      setTasks((items) => arrayMove(items, oldIndex, newIndex));
      
      // If dragging between columns (different over.data.current.sortable.containerId)
      const overContainerId = over.data.current?.sortable?.containerId;
      if (overContainerId && taskStatuses.includes(overContainerId as TaskStatus)) {
         handleChangeStatus(active.id as string, overContainerId as TaskStatus);
      }
    }
  };
  
  const tasksByStatus = (status: TaskStatus) => tasks.filter(task => task.status === status);

  if (!isMounted) return null; // or loading skeleton

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div>
        <PageHeader
          title="Task Management"
          icon={ListChecks}
          description="Create and track tasks for different areas of your farm."
          action={
            <Button onClick={() => { resetForm(); setIsModalOpen(true); }}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add New Task
            </Button>
          }
        />

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader><DialogTitle>{editingTask ? 'Edit Task' : 'Add New Task'}</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2"><Label htmlFor="task-name">Task Name</Label><Input id="task-name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Water crops" /></div>
              <div className="grid gap-2"><Label htmlFor="task-desc">Description (Optional)</Label><Textarea id="task-desc" value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g., Water the tomato plants in greenhouse section A" /></div>
              <div className="grid gap-2"><Label htmlFor="assigned-area">Assigned Area</Label>
                <Select value={assignedArea} onValueChange={setAssignedArea}><SelectTrigger id="assigned-area"><SelectValue placeholder="Select area" /></SelectTrigger>
                  <SelectContent>{farmAreas.map(area => <SelectItem key={area} value={area}>{area}</SelectItem>)}</SelectContent></Select></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2"><Label htmlFor="status">Status</Label>
                  <Select value={status} onValueChange={val => setStatus(val as TaskStatus)}><SelectTrigger id="status"><SelectValue placeholder="Select status" /></SelectTrigger>
                    <SelectContent>{taskStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
                <div className="grid gap-2"><Label htmlFor="due-date">Due Date (Optional)</Label><Input id="due-date" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} /></div>
              </div>
            </div>
            <DialogFooter><Button variant="outline" onClick={() => { resetForm(); setIsModalOpen(false); }}>Cancel</Button><Button onClick={handleSubmit}>Save Task</Button></DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="grid md:grid-cols-3 gap-6">
          {taskStatuses.map((statusColumn) => (
            <Card key={statusColumn} className="shadow-lg bg-muted/20">
              <CardHeader className="border-b">
                <CardTitle className="font-headline text-xl">{statusColumn} ({tasksByStatus(statusColumn).length})</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 min-h-[200px]">
                <SortableContext items={tasksByStatus(statusColumn).map(t => t.id)} strategy={verticalListSortingStrategy}>
                  {tasksByStatus(statusColumn).length > 0 ? (
                    tasksByStatus(statusColumn).map(task => (
                      <SortableTaskCard key={task.id} task={task} onEdit={handleEditTask} onDelete={handleDeleteTask} onChangeStatus={handleChangeStatus} />
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No tasks in this stage.</p>
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
