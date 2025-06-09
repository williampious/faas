
'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { PlusCircle, Archive, Edit2, Trash2, Loader2, AlertTriangle } from 'lucide-react';
import { db, isFirebaseClientConfigured } from '@/lib/firebase'; // Import isFirebaseClientConfigured
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { Alert, AlertTitle, AlertDescription as ShadcnAlertDescription } from '@/components/ui/alert';

interface ResourceItem {
  id: string; // Firestore document ID
  name: string;
  category: string;
  quantity: number;
  unit: string;
  // Optional: createdAt?: any; // For Firestore serverTimestamp
  // Optional: updatedAt?: any;
}

const resourceCategories = ["Seeds", "Fertilizers", "Pesticides", "Equipment Parts", "Tools", "Fuel", "Other"];
const resourceUnits = ["kg", "liters", "units", "bags", "gallons", "pieces"];
const resourcesCollectionName = 'resources';

export default function ResourceInventoryPage() {
  const [inventory, setInventory] = useState<ResourceItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<ResourceItem | null>(null);

  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [quantity, setQuantity] = useState<number | ''>('');
  const [unit, setUnit] = useState('');

  const [isLoading, setIsLoading] = useState(true); // For initial data fetch
  const [isSubmitting, setIsSubmitting] = useState(false); // For form submissions
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInventory = async () => {
      setIsLoading(true);
      setError(null);

      if (!isFirebaseClientConfigured) {
        setError("Firebase client configuration is missing, incomplete, or uses placeholder values in your .env/.env.local file. Please ensure all NEXT_PUBLIC_FIREBASE_... variables are correctly set and you have restarted your development server.");
        setIsLoading(false);
        return;
      }

      if (!db) {
        setError("Firestore database is not available. This might be due to an intermittent connection issue, an internal Firebase initialization error, or Firestore not being enabled in your Firebase project. Please check your internet connection and the browser's developer console for more detailed Firebase error messages.");
        setIsLoading(false);
        return;
      }

      try {
        const resourcesQuery = query(collection(db, resourcesCollectionName), orderBy("name"));
        const querySnapshot = await getDocs(resourcesQuery);
        const fetchedInventory = querySnapshot.docs.map(docSnapshot => ({
          ...docSnapshot.data(),
          id: docSnapshot.id,
        })) as ResourceItem[];
        setInventory(fetchedInventory);
      } catch (err) {
        console.error("Error fetching inventory: ", err);
        setError(err instanceof Error ? `Failed to fetch inventory: ${err.message}` : "An unknown error occurred while fetching inventory.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchInventory();
  }, []);


  const resetForm = () => {
    setName('');
    setCategory('');
    setQuantity('');
    setUnit('');
    setEditingResource(null);
    setError(null); 
  };

  const handleSubmit = async () => {
    if (!isFirebaseClientConfigured) {
      setError("Firebase client configuration is missing or incomplete. Please check your .env file and restart the server, then refresh this page.");
      setIsSubmitting(false);
      return;
    }
    if (!db) {
      setError("Firestore database is not available. Cannot save resource. Please refresh the page or check console for errors.");
      setIsSubmitting(false);
      return;
    }
    if (!name || !category || quantity === '' || !unit) {
      setError("Please fill in all required fields: Name, Category, Quantity, and Unit.");
      setIsSubmitting(false); // Ensure isSubmitting is reset if validation fails
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const resourceData = {
      name,
      category,
      quantity: Number(quantity),
      unit,
    };

    try {
      if (editingResource) {
        if (!editingResource.id) {
            setError("Cannot update resource without an ID.");
            setIsSubmitting(false);
            return;
        }
        const resourceDocRef = doc(db, resourcesCollectionName, editingResource.id);
        await updateDoc(resourceDocRef, {
            ...resourceData,
            updatedAt: serverTimestamp() 
        });
        setInventory(inventory.map(item => item.id === editingResource.id ? { ...item, ...resourceData, id: item.id } : item));
      } else {
        const docRef = await addDoc(collection(db, resourcesCollectionName), {
            ...resourceData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        // Optimistically add to local state, or re-fetch. For now, add locally.
        setInventory(prevInventory => [...prevInventory, { ...resourceData, id: docRef.id }].sort((a,b) => a.name.localeCompare(b.name)));
      }
      resetForm();
      setIsModalOpen(false);
    } catch (err) {
      console.error("Error saving resource: ", err);
      setError(err instanceof Error ? `Failed to save resource: ${err.message}` : "An unknown error occurred while saving the resource.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (resource: ResourceItem) => {
    setEditingResource(resource);
    setName(resource.name);
    setCategory(resource.category);
    setQuantity(resource.quantity);
    setUnit(resource.unit);
    setIsModalOpen(true);
    setError(null);
  };

  const handleDelete = async (id: string) => {
    if (!isFirebaseClientConfigured) {
      setError("Firebase client configuration is missing or incomplete. Please check your .env file and restart the server, then refresh this page.");
      return;
    }
    if (!db) {
      setError("Firestore database is not available. Cannot delete resource. Please refresh the page or check console for errors.");
      return;
    }
    
    setError(null);
    try {
      // Optional: Add confirmation dialog here
      const resourceDocRef = doc(db, resourcesCollectionName, id);
      await deleteDoc(resourceDocRef);
      setInventory(inventory.filter(item => item.id !== id));
    } catch (err) {
      console.error("Error deleting resource: ", err);
      setError(err instanceof Error ? `Failed to delete resource: ${err.message}` : "An unknown error occurred while deleting the resource.");
    }
  };

  return (
    <div>
      <PageHeader
        title="Resource Inventory"
        icon={Archive}
        description="Manage your farm's seeds, fertilizers, equipment, and other resources."
        action={
          <Button onClick={() => { resetForm(); setIsModalOpen(true); }} disabled={!isFirebaseClientConfigured || !db}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Resource
          </Button>
        }
      />

      <Dialog open={isModalOpen} onOpenChange={(isOpen) => {
        if (isSubmitting && !isOpen) return; 
        setIsModalOpen(isOpen);
        if (!isOpen) resetForm(); 
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingResource ? 'Edit Resource' : 'Add New Resource'}</DialogTitle>
            <DialogDescription>
              {editingResource ? 'Update the details of your resource.' : 'Enter the details of the new resource.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {error && !isSubmitting && ( 
                 <Alert variant="destructive" className="mb-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <ShadcnAlertDescription>{error}</ShadcnAlertDescription>
                </Alert>
            )}
            <div className="grid gap-2">
              <Label htmlFor="name">Resource Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Tomato Seeds" disabled={isSubmitting} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={setCategory} disabled={isSubmitting}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {resourceCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input id="quantity" type="number" value={quantity} onChange={(e) => setQuantity(e.target.value === '' ? '' : Number(e.target.value))} placeholder="e.g., 100" disabled={isSubmitting} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="unit">Unit</Label>
                 <Select value={unit} onValueChange={setUnit} disabled={isSubmitting}>
                    <SelectTrigger id="unit">
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                    <SelectContent>
                      {resourceUnits.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                    </SelectContent>
                  </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" disabled={isSubmitting}>Cancel</Button>
            </DialogClose>
            <Button onClick={handleSubmit} disabled={isSubmitting || !name || !category || quantity === '' || !unit}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? 'Saving...' : 'Save Resource'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Global error display for fetch issues */}
      {!isLoading && error && inventory.length === 0 && ( 
         <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Operation Failed</AlertTitle>
            <ShadcnAlertDescription>{error}</ShadcnAlertDescription>
        </Alert>
      )}

      {isLoading && (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-2 text-muted-foreground">Loading resources...</p>
        </div>
      )}
      
      {!isLoading && !error && (
        <Card className="shadow-lg">
          <CardContent className="pt-6">
            <Table>
              {inventory.length === 0 && <TableCaption>No resources in inventory yet. Add some (if configuration is correct)!</TableCaption>}
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventory.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell>{item.unit}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(item)} className="mr-2 hover:text-blue-500" aria-label={`Edit ${item.name}`}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} className="hover:text-destructive" aria-label={`Delete ${item.name}`}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
    
