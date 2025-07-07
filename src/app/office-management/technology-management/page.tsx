
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Laptop, PlusCircle, Edit2, Trash2, ArrowLeft, Loader2, AlertTriangle } from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import type { TechnologyAsset, AssetType, AssetStatus } from '@/types/technology';
import { assetTypes, assetStatuses } from '@/types/technology';
import type { OperationalTransaction } from '@/types/finance';
import { paymentSources } from '@/types/finance';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUserProfile } from '@/contexts/user-profile-context';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

const safeParseFloat = (val: any) => (val === "" || val === null || val === undefined) ? undefined : parseFloat(String(val));

const assetFormSchema = z.object({
  name: z.string().min(2, "Asset name is required.").max(100),
  assetType: z.enum(assetTypes, { required_error: "Asset type is required." }),
  status: z.enum(assetStatuses, { required_error: "Status is required." }),
  purchaseDate: z.string().refine((val) => !!val && isValid(parseISO(val)), { message: "Valid purchase date is required." }),
  purchaseCost: z.preprocess(safeParseFloat, z.number().min(0, "Cost cannot be negative.")),
  paymentSource: z.enum(paymentSources, { required_error: "Payment source is required." }),
  supplier: z.string().max(100).optional(),
  assignedTo: z.string().max(100).optional(),
  warrantyExpiry: z.string().optional(),
  licenseExpiry: z.string().optional(),
  serialNumber: z.string().max(100).optional(),
  notes: z.string().max(500).optional(),
});
type AssetFormValues = z.infer<typeof assetFormSchema>;

const ASSETS_COLLECTION = 'technologyAssets';
const TRANSACTIONS_COLLECTION = 'transactions';
const ASSET_FORM_ID = 'asset-form';

export default function TechnologyManagementPage() {
  const [assets, setAssets] = useState<TechnologyAsset[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<TechnologyAsset | null>(null);
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { userProfile, isLoading: isProfileLoading } = useUserProfile();

  const form = useForm<AssetFormValues>({
    resolver: zodResolver(assetFormSchema),
    defaultValues: {
      name: '', assetType: undefined, status: 'In Use', purchaseDate: '', purchaseCost: 0,
      paymentSource: undefined, supplier: '', assignedTo: '', warrantyExpiry: '',
      licenseExpiry: '', serialNumber: '', notes: '',
    },
  });

  useEffect(() => {
    if (isProfileLoading) return;
    if (!userProfile?.farmId) {
      setError("Farm information is not available.");
      setIsLoading(false);
      return;
    }
    const fetchAssets = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const q = query(collection(db, ASSETS_COLLECTION), where("farmId", "==", userProfile.farmId));
        const querySnapshot = await getDocs(q);
        setAssets(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TechnologyAsset)));
      } catch (e: any) {
        setError("Failed to load assets: " + e.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAssets();
  }, [userProfile, isProfileLoading]);

  const handleOpenModal = (assetToEdit?: TechnologyAsset) => {
    setEditingAsset(assetToEdit || null);
    if (assetToEdit) {
      form.reset({
        name: assetToEdit.name,
        assetType: assetToEdit.assetType,
        status: assetToEdit.status,
        purchaseDate: assetToEdit.purchaseDate,
        purchaseCost: assetToEdit.purchaseCost,
        paymentSource: assetToEdit.paymentSource,
        supplier: assetToEdit.supplier || '',
        assignedTo: assetToEdit.assignedTo || '',
        warrantyExpiry: assetToEdit.warrantyExpiry || '',
        licenseExpiry: assetToEdit.licenseExpiry || '',
        serialNumber: assetToEdit.serialNumber || '',
        notes: assetToEdit.notes || '',
      });
    } else {
      form.reset({
        name: '', assetType: undefined, status: 'In Use', purchaseDate: '', purchaseCost: 0,
        paymentSource: undefined, supplier: '', assignedTo: '', warrantyExpiry: '',
        licenseExpiry: '', serialNumber: '', notes: '',
      });
    }
    setIsModalOpen(true);
  };
  
  const onSubmit: SubmitHandler<AssetFormValues> = async (data) => {
    if (!userProfile?.farmId) return;

    const assetData = {
      farmId: userProfile.farmId,
      ...data,
      purchaseCost: data.purchaseCost || 0,
    };
    
    const batch = writeBatch(db);

    try {
      let assetId: string;
      if (editingAsset) {
        assetId = editingAsset.id;
        batch.update(doc(db, ASSETS_COLLECTION, assetId), { ...assetData, updatedAt: serverTimestamp() });
        
        const transQuery = query(collection(db, TRANSACTIONS_COLLECTION), where("linkedActivityId", "==", assetId));
        const oldTransSnap = await getDocs(transQuery);
        oldTransSnap.forEach(d => batch.delete(d.ref));
      } else {
        const assetRef = doc(collection(db, ASSETS_COLLECTION));
        assetId = assetRef.id;
        batch.set(assetRef, { ...assetData, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
      }

      if (assetData.purchaseCost > 0) {
        const transRef = doc(collection(db, TRANSACTIONS_COLLECTION));
        const transaction: Omit<OperationalTransaction, 'id'> = {
          farmId: userProfile.farmId,
          date: assetData.purchaseDate,
          description: `Purchase of asset: ${assetData.name}`,
          amount: assetData.purchaseCost,
          type: 'Expense',
          category: 'Technology',
          paymentSource: assetData.paymentSource,
          linkedModule: 'Technology Management',
          linkedActivityId: assetId,
          linkedItemId: assetId,
        };
        batch.set(transRef, transaction);
      }

      await batch.commit();

      toast({ title: editingAsset ? "Asset Updated" : "Asset Created", description: `"${data.name}" has been saved.` });
      
      // Manually trigger a re-fetch after commit
      const q = query(collection(db, ASSETS_COLLECTION), where("farmId", "==", userProfile.farmId));
      const querySnapshot = await getDocs(q);
      setAssets(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TechnologyAsset)));
      
      setIsModalOpen(false);
    } catch (e: any) {
      toast({ title: "Error", description: `Failed to save asset: ${e.message}`, variant: "destructive" });
    }
  };
  
  const handleDelete = async (assetId: string) => {
    const batch = writeBatch(db);
    batch.delete(doc(db, ASSETS_COLLECTION, assetId));
    
    const transQuery = query(collection(db, TRANSACTIONS_COLLECTION), where("linkedActivityId", "==", assetId));
    const oldTransSnap = await getDocs(transQuery);
    oldTransSnap.forEach(d => batch.delete(d.ref));

    await batch.commit();
    toast({ title: "Asset Deleted", variant: "destructive" });
    setAssets(assets.filter(a => a.id !== assetId));
  };


  return (
    <div>
      <PageHeader
        title="Technology Management"
        icon={Laptop}
        description="Oversee IT assets, software subscriptions, and support costs."
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push('/office-management/dashboard')}><ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard</Button>
            <Button onClick={() => handleOpenModal()}><PlusCircle className="mr-2 h-4 w-4" /> Add Asset</Button>
          </div>
        }
      />
      
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader><DialogTitle>{editingAsset ? 'Edit' : 'Add'} Technology Asset</DialogTitle></DialogHeader>
          <div className="flex-grow overflow-y-auto pr-2 py-4">
            <Form {...form}>
              <form id={ASSET_FORM_ID} onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField name="name" control={form.control} render={({ field }) => (<FormItem><FormLabel>Asset Name*</FormLabel><FormControl><Input placeholder="e.g., Dell Latitude 5420, Adobe Creative Cloud" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <div className="grid grid-cols-2 gap-4">
                  <FormField name="assetType" control={form.control} render={({ field }) => (<FormItem><FormLabel>Asset Type*</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger></FormControl><SelectContent>{assetTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                  <FormField name="status" control={form.control} render={({ field }) => (<FormItem><FormLabel>Status*</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger></FormControl><SelectContent>{assetStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                </div>
                <FormField name="serialNumber" control={form.control} render={({ field }) => (<FormItem><FormLabel>Serial Number (Optional)</FormLabel><FormControl><Input placeholder="For hardware assets" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <div className="grid grid-cols-2 gap-4">
                  <FormField name="purchaseDate" control={form.control} render={({ field }) => (<FormItem><FormLabel>Purchase Date*</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField name="purchaseCost" control={form.control} render={({ field }) => (<FormItem><FormLabel>Purchase Cost (GHS)*</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <FormField name="paymentSource" control={form.control} render={({ field }) => (<FormItem><FormLabel>Payment Source*</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select source" /></SelectTrigger></FormControl><SelectContent>{paymentSources.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                   <FormField name="supplier" control={form.control} render={({ field }) => (<FormItem><FormLabel>Supplier (Optional)</FormLabel><FormControl><Input placeholder="e.g., CompuGhana" {...field} /></FormControl><FormMessage /></FormItem>)} />
                </div>
                 <div className="grid grid-cols-2 gap-4">
                    <FormField name="warrantyExpiry" control={form.control} render={({ field }) => (<FormItem><FormLabel>Warranty Expiry (Optional)</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField name="licenseExpiry" control={form.control} render={({ field }) => (<FormItem><FormLabel>License/Sub. Expiry (Optional)</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)} />
                </div>
                 <FormField name="assignedTo" control={form.control} render={({ field }) => (<FormItem><FormLabel>Assigned To (Optional)</FormLabel><FormControl><Input placeholder="e.g., John Doe, Marketing Dept." {...field} /></FormControl><FormMessage /></FormItem>)} />
                 <FormField name="notes" control={form.control} render={({ field }) => (<FormItem><FormLabel>Notes</FormLabel><FormControl><Textarea placeholder="Any other relevant details" {...field} /></FormControl><FormMessage /></FormItem>)} />
              </form>
            </Form>
          </div>
          <DialogFooter className="border-t pt-4"><DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose><Button type="submit" form={ASSET_FORM_ID}>{editingAsset ? 'Save Changes' : 'Add Asset'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Card className="shadow-lg">
        <CardHeader><CardTitle>Asset Inventory</CardTitle><CardDescription>A list of all technology assets for the office.</CardDescription></CardHeader>
        <CardContent>
          {isLoading ? (<div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary"/></div>) :
           error ? (<div className="text-destructive p-4 text-center">{error}</div>) :
           assets.length === 0 ? (<div className="text-center py-10"><Laptop className="mx-auto h-12 w-12 text-muted-foreground"/><p className="mt-4">No assets found.</p></div>) :
          (<Table>
            <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Type</TableHead><TableHead>Status</TableHead><TableHead>Purchase Date</TableHead><TableHead className="text-right">Cost</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {assets.map(asset => (
                <TableRow key={asset.id}>
                  <TableCell className="font-medium">{asset.name}</TableCell>
                  <TableCell>{asset.assetType}</TableCell>
                  <TableCell>{asset.status}</TableCell>
                  <TableCell>{format(parseISO(asset.purchaseDate), 'PP')}</TableCell>
                  <TableCell className="text-right">{new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS' }).format(asset.purchaseCost)}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleOpenModal(asset)}><Edit2 className="h-3.5 w-3.5 mr-1"/>Edit</Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(asset.id)}><Trash2 className="h-3.5 w-3.5 mr-1"/>Delete</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>)}
        </CardContent>
      </Card>
    </div>
  );
}
