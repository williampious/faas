
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Archive, PlusCircle, Edit2, Trash2, Loader2, AlertTriangle } from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import type { ResourceItem, ResourceCategory } from '@/types/inventory';
import { resourceCategories } from '@/types/inventory';
import { useUserProfile } from '@/contexts/user-profile-context';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, writeBatch } from 'firebase/firestore';
import type { OperationalTransaction } from '@/types/finance';

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

const RESOURCES_COLLECTION = 'resources';
const TRANSACTIONS_COLLECTION = 'transactions';
const RESOURCE_FORM_ID = 'resource-item-form';

export default function ResourceInventoryPage() {
  const [items, setItems] = useState<ResourceItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ResourceItem | null>(null);
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { userProfile, isLoading: isProfileLoading } = useUserProfile();

  const form = useForm<ResourceItemFormValues>({
    resolver: zodResolver(resourceItemFormSchema),
    defaultValues: {
      name: '', category: undefined, quantity: 0, unit: '', supplier: '',
      purchaseDate: '', costPerUnit: undefined, notes: '',
    },
  });
  
  useEffect(() => {
    if (isProfileLoading) return;
    if (!userProfile?.farmId) {
      setError("Farm information is not available. Cannot load data.");
      setIsLoading(false);
      return;
    }

    const fetchItems = async () => {
      setIsLoading(true);
      setError(null);
      try {
        if (!userProfile.farmId) throw new Error("User is not associated with a farm.");
        const q = query(collection(db, RESOURCES_COLLECTION), where("farmId", "==", userProfile.farmId));
        const querySnapshot = await getDocs(q);
        const fetchedItems = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ResourceItem[];
        setItems(fetchedItems);
      } catch (err: any) {
        console.error("Error fetching resources:", err);
        setError(`Failed to fetch data: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchItems();
    
    if (window.location.hash === '#add') {
      setIsModalOpen(true);
      window.location.hash = ''; 
    }
  }, [userProfile, isProfileLoading]);

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
  
  const onSubmit: SubmitHandler<ResourceItemFormValues> = async (data) => {
    if (!userProfile?.farmId || !db) {
      toast({ title: "Error", description: "Cannot save. Farm/database information is missing.", variant: "destructive" });
      return;
    }

    const totalCost = (data.quantity || 0) * (data.costPerUnit || 0);
    const resourceData = {
      farmId: userProfile.farmId,
      ...data,
      totalCost,
      updatedAt: serverTimestamp(),
    };

    const batch = writeBatch(db);

    try {
      let resourceId: string;
      if (editingItem) {
        resourceId = editingItem.id;
        const resourceRef = doc(db, RESOURCES_COLLECTION, resourceId);
        batch.update(resourceRef, resourceData);
        
        const transQuery = query(collection(db, TRANSACTIONS_COLLECTION), where("linkedActivityId", "==", resourceId));
        const oldTransSnap = await getDocs(transQuery);
        oldTransSnap.forEach(doc => batch.delete(doc.ref));

      } else {
        const resourceRef = doc(collection(db, RESOURCES_COLLECTION));
        resourceId = resourceRef.id;
        batch.set(resourceRef, { ...resourceData, createdAt: serverTimestamp() });
      }

      if (totalCost > 0) {
        const transRef = doc(collection(db, TRANSACTIONS_COLLECTION));
        const newTransaction: Omit<OperationalTransaction, 'id'> = {
          farmId: userProfile.farmId,
          date: data.purchaseDate,
          description: `Purchase: ${data.name}`,
          amount: totalCost,
          type: 'Expense',
          category: 'Material/Input', // Defaulting for inventory items
          paymentSource: 'Cash', // Defaulting as form doesn't capture it
          linkedModule: 'Resource Inventory',
          linkedActivityId: resourceId,
          linkedItemId: resourceId,
        };
        batch.set(transRef, newTransaction);
      }

      await batch.commit();

      if (editingItem) {
        const updatedItemForState = { ...editingItem, ...resourceData, totalCost };
        setItems(items.map(item => item.id === editingItem.id ? updatedItemForState : item));
        toast({ title: "Resource Updated", description: `"${data.name}" has been updated.` });
      } else {
        const newItemForState = { ...resourceData, id: crypto.randomUUID(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), totalCost };
        setItems(prev => [...prev, newItemForState]);
        toast({ title: "Resource Added", description: `"${data.name}" has been added to inventory.` });
      }
      setIsModalOpen(false);
      form.reset();
    } catch (err: any) {
      console.error("Error saving resource:", err);
      toast({ title: "Save Failed", description: `Could not save resource. Error: ${err.message}`, variant: "destructive" });
    }
  };

  const handleDeleteItem = async (id: string) => {
    const itemToDelete = items.find(i => i.id === id);
    if (!itemToDelete || !db) return;

    const batch = writeBatch(db);
    try {
        batch.delete(doc(db, RESOURCES_COLLECTION, id));
        
        const transQuery = query(collection(db, TRANSACTIONS_COLLECTION), where("linkedActivityId", "==", id));
        const transSnap = await getDocs(transQuery);
        transSnap.forEach(doc => batch.delete(doc.ref));

        await batch.commit();
        setItems(items.filter((item) => item.id !== id));
        toast({ title: "Resource Deleted", description: `"${itemToDelete.name}" and its financial record have been removed.`, variant: "destructive" });
    } catch(err: any) {
         console.error("Error deleting resource:", err);
        toast({ title: "Deletion Failed", description: `Could not delete resource. Error: ${err.message}`, variant: "destructive" });
    }
  };
  
  if (isProfileLoading || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-12rem)]">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
        <p className="ml-3 text-lg text-muted-foreground">Loading inventory...</p>
      </div>
    );
  }

   if (error) {
     return (
        <div className="container mx-auto py-10">
         <Card className="w-full max-w-lg mx-auto text-center shadow-lg">
            <CardHeader><CardTitle className="flex items-center justify-center text-xl text-destructive"><AlertTriangle className="mr-2 h-6 w-6" /> Data Loading Error</CardTitle></CardHeader>
            <CardContent><p className="text-muted-foreground mb-2">{error}</p></CardContent>
         </Card>
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
