
'use client';

import { useState, useEffect } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Archive, PlusCircle, Edit2, Trash2 } from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import type { ResourceItem, ResourceCategory } from '@/types/inventory';
import { resourceCategories } from '@/types/inventory';

const resourceItemFormSchema = z.object({
  name: z.string().min(2, { message: "Resource name must be at least 2 characters." }).max(100),
  category: z.enum(resourceCategories, { required_error: "Category is required." }),
  quantity: z.preprocess(
    (val) => parseFloat(String(val)),
    z.number().min(0, "Quantity cannot be negative.")
  ),
  unit: z.string().min(1, { message: "Unit is required (e.g., kg, bags, liters)." }).max(50),
  supplier: z.string().max(100).optional(),
  purchaseDate: z.string().refine((val) => !!val && isValid(parseISO(val)), { message: "Valid purchase date is required." }),
  costPerUnit: z.preprocess(
    (val) => val === "" ? undefined : parseFloat(String(val)),
    z.number().min(0, "Cost cannot be negative.").optional()
  ),
  notes: z.string().max(500).optional(),
});

type ResourceItemFormValues = z.infer<typeof resourceItemFormSchema>;

const LOCAL_STORAGE_KEY = 'resourceInventory_v1';
const RESOURCE_FORM_ID = 'resource-item-form';

export default function ResourceInventoryPage() {
  const [items, setItems] = useState<ResourceItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ResourceItem | null>(null);
  const { toast } = useToast();
  const [isMounted, setIsMounted] = useState(false);

  const form = useForm<ResourceItemFormValues>({
    resolver: zodResolver(resourceItemFormSchema),
    defaultValues: {
      name: '',
      category: undefined,
      quantity: 0,
      unit: '',
      supplier: '',
      purchaseDate: '',
      costPerUnit: undefined,
      notes: '',
    },
  });
  
  useEffect(() => {
    setIsMounted(true);
    const storedItems = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (storedItems) {
      setItems(JSON.parse(storedItems));
    }
     if (window.location.hash === '#add') {
      setIsModalOpen(true);
      window.location.hash = ''; 
    }
  }, []);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
    }
  }, [items, isMounted]);

  const handleOpenModal = (itemToEdit?: ResourceItem) => {
    if (itemToEdit) {
      setEditingItem(itemToEdit);
      form.reset({
        ...itemToEdit,
        supplier: itemToEdit.supplier || '',
        costPerUnit: itemToEdit.costPerUnit,
        notes: itemToEdit.notes || '',
      });
    } else {
      setEditingItem(null);
      form.reset({
        name: '', category: undefined, quantity: 0, unit: '', supplier: '',
        purchaseDate: format(new Date(), 'yyyy-MM-dd'), costPerUnit: undefined, notes: '',
      });
    }
    setIsModalOpen(true);
  };
  
  const onSubmit: SubmitHandler<ResourceItemFormValues> = (data) => {
    const now = new Date().toISOString();
    const totalCost = (data.quantity || 0) * (data.costPerUnit || 0);

    if (editingItem) {
      const updatedItem: ResourceItem = {
        ...editingItem,
        ...data,
        totalCost,
        updatedAt: now,
      };
      setItems(items.map((item) => (item.id === editingItem.id ? updatedItem : item)));
      toast({ title: "Resource Updated", description: `"${data.name}" has been updated.` });
    } else {
      const newItem: ResourceItem = {
        id: crypto.randomUUID(),
        ...data,
        totalCost,
        createdAt: now,
        updatedAt: now,
      };
      setItems((prev) => [...prev, newItem]);
      toast({ title: "Resource Added", description: `"${data.name}" has been added to your inventory.` });
    }
    setIsModalOpen(false);
    setEditingItem(null);
    form.reset();
  };

  const handleDeleteItem = (id: string) => {
    const itemToDelete = items.find(i => i.id === id);
    setItems(items.filter((item) => item.id !== id));
    toast({ title: "Resource Deleted", description: `"${itemToDelete?.name}" has been removed.`, variant: "destructive" });
  };

  if (!isMounted) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-12rem)]">
        <Archive className="h-12 w-12 text-primary animate-pulse" />
        <p className="ml-3 text-lg text-muted-foreground">Loading inventory...</p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Resource Inventory"
        icon={Archive}
        description="View and manage your stock of farm resources like seeds, fertilizers, and equipment parts."
        action={
          <Button onClick={() => handleOpenModal()}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Resource
          </Button>
        }
      />

      <Dialog open={isModalOpen} onOpenChange={(isOpen) => {
        setIsModalOpen(isOpen);
        if (!isOpen) { form.reset(); setEditingItem(null); }
      }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Resource' : 'Add New Resource'}</DialogTitle>
          </DialogHeader>
          <div className="flex-grow overflow-y-auto pr-2 py-4">
            <Form {...form}>
              <form id={RESOURCE_FORM_ID} onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem><FormLabel>Resource Name*</FormLabel><FormControl><Input placeholder="e.g., NPK 15-15-15 Fertilizer" {...field} /></FormControl><FormMessage /></FormItem>)}
                />
                <FormField control={form.control} name="category" render={({ field }) => (
                  <FormItem><FormLabel>Category*</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger></FormControl>
                      <SelectContent>{resourceCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}</SelectContent>
                    </Select><FormMessage />
                  </FormItem>)}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="quantity" render={({ field }) => (
                    <FormItem><FormLabel>Quantity*</FormLabel><FormControl><Input type="number" step="0.01" placeholder="0.00" {...field} /></FormControl><FormMessage /></FormItem>)}
                  />
                  <FormField control={form.control} name="unit" render={({ field }) => (
                    <FormItem><FormLabel>Unit*</FormLabel><FormControl><Input placeholder="e.g., kg, bag, liter" {...field} /></FormControl><FormMessage /></FormItem>)}
                  />
                </div>
                <FormField control={form.control} name="supplier" render={({ field }) => (
                  <FormItem><FormLabel>Supplier (Optional)</FormLabel><FormControl><Input placeholder="e.g., Agri-Mart" {...field} /></FormControl><FormMessage /></FormItem>)}
                />
                 <div className="grid grid-cols-2 gap-4">
                   <FormField control={form.control} name="purchaseDate" render={({ field }) => (
                    <FormItem><FormLabel>Purchase Date*</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)}
                  />
                  <FormField control={form.control} name="costPerUnit" render={({ field }) => (
                    <FormItem><FormLabel>Cost Per Unit (Optional)</FormLabel><FormControl><Input type="number" step="0.01" placeholder="0.00" {...field} /></FormControl><FormMessage /></FormItem>)}
                  />
                 </div>
                <FormField control={form.control} name="notes" render={({ field }) => (
                  <FormItem><FormLabel>Notes (Optional)</FormLabel><FormControl><Textarea placeholder="e.g., For use in North Field, expiry date..." {...field} /></FormControl><FormMessage /></FormItem>)}
                />
              </form>
            </Form>
          </div>
          <DialogFooter className="border-t pt-4">
            <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
            <Button type="submit" form={RESOURCE_FORM_ID}>
              {editingItem ? 'Save Changes' : 'Add Resource'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Current Inventory</CardTitle>
          <CardDescription>
            {items.length > 0 ? "A list of all your current farm resources." : "Your inventory is empty."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {items.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Purchase Date</TableHead>
                  <TableHead className="text-right">Total Cost</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.sort((a,b) => a.name.localeCompare(b.name)).map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{item.unit}</TableCell>
                    <TableCell>{isValid(parseISO(item.purchaseDate)) ? format(parseISO(item.purchaseDate), 'PP') : 'Invalid Date'}</TableCell>
                    <TableCell className="text-right">{item.totalCost.toFixed(2)}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleOpenModal(item)}>
                        <Edit2 className="h-3.5 w-3.5 mr-1" /> Edit
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDeleteItem(item.id)}>
                        <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-10">
              <Archive className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">No resources have been added yet.</p>
              <p className="text-sm text-muted-foreground">Click "Add New Resource" to populate your inventory.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
