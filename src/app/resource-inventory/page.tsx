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
import { PlusCircle, Archive, Edit2, Trash2 } from 'lucide-react';

interface ResourceItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
}

const resourceCategories = ["Seeds", "Fertilizers", "Pesticides", "Equipment Parts", "Tools", "Fuel", "Other"];
const resourceUnits = ["kg", "liters", "units", "bags", "gallons", "pieces"];

export default function ResourceInventoryPage() {
  const [inventory, setInventory] = useState<ResourceItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<ResourceItem | null>(null);

  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [quantity, setQuantity] = useState<number | ''>('');
  const [unit, setUnit] = useState('');
  
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const storedInventory = localStorage.getItem('resourceInventory');
    if (storedInventory) {
      setInventory(JSON.parse(storedInventory));
    }
  }, []);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem('resourceInventory', JSON.stringify(inventory));
    }
  }, [inventory, isMounted]);

  const resetForm = () => {
    setName('');
    setCategory('');
    setQuantity('');
    setUnit('');
    setEditingResource(null);
  };

  const handleSubmit = () => {
    if (!name || !category || quantity === '' || !unit) return;

    if (editingResource) {
      setInventory(inventory.map(item => item.id === editingResource.id ? { ...editingResource, name, category, quantity: Number(quantity), unit } : item));
    } else {
      const newResource: ResourceItem = {
        id: crypto.randomUUID(),
        name,
        category,
        quantity: Number(quantity),
        unit,
      };
      setInventory([...inventory, newResource]);
    }
    resetForm();
    setIsModalOpen(false);
  };

  const handleEdit = (resource: ResourceItem) => {
    setEditingResource(resource);
    setName(resource.name);
    setCategory(resource.category);
    setQuantity(resource.quantity);
    setUnit(resource.unit);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    setInventory(inventory.filter(item => item.id !== id));
  };
  
  if (!isMounted) {
    return null; // Or a loading component
  }

  return (
    <div>
      <PageHeader
        title="Resource Inventory"
        icon={Archive}
        description="Manage your farm's seeds, fertilizers, equipment, and other resources."
        action={
          <Button onClick={() => { resetForm(); setIsModalOpen(true); }}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Resource
          </Button>
        }
      />

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingResource ? 'Edit Resource' : 'Add New Resource'}</DialogTitle>
            <DialogDescription>
              {editingResource ? 'Update the details of your resource.' : 'Enter the details of the new resource.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Resource Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Tomato Seeds" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={setCategory}>
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
                <Input id="quantity" type="number" value={quantity} onChange={(e) => setQuantity(e.target.value === '' ? '' : Number(e.target.value))} placeholder="e.g., 100" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="unit">Unit</Label>
                 <Select value={unit} onValueChange={setUnit}>
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
            <Button variant="outline" onClick={() => { resetForm(); setIsModalOpen(false); }}>Cancel</Button>
            <Button onClick={handleSubmit}>Save Resource</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card className="shadow-lg">
        <CardContent className="pt-6">
          <Table>
            {inventory.length === 0 && <TableCaption>No resources in inventory yet. Add some!</TableCaption>}
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
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(item)} className="mr-2 hover:text-blue-500">
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} className="hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
