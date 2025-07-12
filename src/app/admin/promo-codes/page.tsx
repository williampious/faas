
'use client';

import { useState, useEffect } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { TicketPercent, PlusCircle, Edit2, Trash2, ArrowLeft, Loader2, AlertTriangle } from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import type { PromotionalCode, PromoCodeType } from '@/types/promo-code';
import { useUserProfile } from '@/contexts/user-profile-context';
import { db } from '@/lib/firebase';
import { collection, query, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, orderBy } from 'firebase/firestore';

const promoCodeFormSchema = z.object({
  code: z.string().min(3, "Code must be at least 3 characters.").max(50).transform(v => v.toUpperCase()),
  type: z.enum(['fixed', 'percentage'], { required_error: "Type is required." }),
  discountAmount: z.preprocess(
    val => parseFloat(String(val)),
    z.number().min(0.01, "Discount amount must be greater than 0.")
  ),
  usageLimit: z.preprocess(
    val => parseInt(String(val), 10),
    z.number().min(1, "Usage limit must be at least 1.")
  ),
  expiryDate: z.string().refine((val) => !!val && isValid(parseISO(val)), { message: "Valid expiry date is required." }),
  isActive: z.boolean().default(true),
});

type PromoCodeFormValues = z.infer<typeof promoCodeFormSchema>;

const PROMO_CODES_COLLECTION = 'promotionalCodes';
const PROMO_FORM_ID = 'promo-code-form';

export default function PromoCodesPage() {
  const [codes, setCodes] = useState<PromotionalCode[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCode, setEditingCode] = useState<PromotionalCode | null>(null);
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { userProfile, isLoading: isProfileLoading } = useUserProfile();

  const form = useForm<PromoCodeFormValues>({
    resolver: zodResolver(promoCodeFormSchema),
    defaultValues: { code: '', type: 'fixed', discountAmount: 0, usageLimit: 100, expiryDate: '', isActive: true },
  });
  
  useEffect(() => {
    if (isProfileLoading) return;

    const fetchCodes = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const q = query(collection(db, PROMO_CODES_COLLECTION), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        setCodes(querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as PromotionalCode)));
      } catch (e: any) {
        setError("Failed to load promo codes. This may be due to missing permissions or a required Firestore index.");
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCodes();
  }, [userProfile, isProfileLoading]);

  const handleOpenModal = (codeToEdit?: PromotionalCode) => {
    setEditingCode(codeToEdit || null);
    form.reset(codeToEdit || { code: '', type: 'fixed', discountAmount: 0, usageLimit: 100, expiryDate: '', isActive: true });
    setIsModalOpen(true);
  };
  
  const onSubmit: SubmitHandler<PromoCodeFormValues> = async (data) => {
    if (!userProfile) return;
    
    const codeData = { ...data, timesUsed: editingCode?.timesUsed || 0 };

    try {
      if (editingCode) {
        const codeRef = doc(db, PROMO_CODES_COLLECTION, editingCode.id!);
        await updateDoc(codeRef, { ...codeData, updatedAt: serverTimestamp() });
        setCodes(codes.map(c => c.id === editingCode.id ? { ...c, ...codeData } : c));
        toast({ title: "Promo Code Updated" });
      } else {
        const newCode = { ...codeData, createdAt: serverTimestamp(), updatedAt: serverTimestamp() };
        const docRef = await addDoc(collection(db, PROMO_CODES_COLLECTION), newCode);
        setCodes([{ ...newCode, id: docRef.id } as PromotionalCode, ...codes]);
        toast({ title: "Promo Code Created" });
      }
      setIsModalOpen(false);
    } catch (e: any) {
      toast({ title: "Error", description: `Failed to save code: ${e.message}`, variant: "destructive" });
    }
  };

  const handleDelete = async (codeId: string) => {
    await deleteDoc(doc(db, PROMO_CODES_COLLECTION, codeId));
    toast({ title: "Promo Code Deleted", variant: "destructive" });
    setCodes(codes.filter(c => c.id !== codeId));
  };
  
  const formatDate = (dateStr?: string) => dateStr && isValid(parseISO(dateStr)) ? format(parseISO(dateStr), 'PP') : 'N/A';

  return (
    <div>
      <PageHeader
        title="Promotional Code Management"
        icon={TicketPercent}
        description="Create, manage, and track promotional codes for user subscriptions."
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push('/admin/dashboard')}><ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard</Button>
            <Button onClick={() => handleOpenModal()}><PlusCircle className="mr-2 h-4 w-4" /> Create New Code</Button>
          </div>
        }
      />
      
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader><DialogTitle>{editingCode ? 'Edit' : 'Create New'} Promo Code</DialogTitle></DialogHeader>
          <Form {...form}>
            <form id={PROMO_FORM_ID} onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
              <FormField name="code" control={form.control} render={({ field }) => (<FormItem><FormLabel>Promo Code*</FormLabel><FormControl><Input placeholder="e.g., SAVE50" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <div className="grid grid-cols-2 gap-4">
                  <FormField name="type" control={form.control} render={({ field }) => (<FormItem><FormLabel>Type*</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger></FormControl><SelectContent><SelectItem value="fixed">Fixed Amount</SelectItem><SelectItem value="percentage">Percentage</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                  <FormField name="discountAmount" control={form.control} render={({ field }) => (<FormItem><FormLabel>Discount Amount*</FormLabel><FormControl><Input type="number" step="0.01" placeholder="e.g., 50 or 10" {...field} /></FormControl><FormMessage /></FormItem>)} />
              </div>
               <div className="grid grid-cols-2 gap-4">
                  <FormField name="usageLimit" control={form.control} render={({ field }) => (<FormItem><FormLabel>Usage Limit*</FormLabel><FormControl><Input type="number" step="1" placeholder="e.g., 100" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField name="expiryDate" control={form.control} render={({ field }) => (<FormItem><FormLabel>Expiry Date*</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)} />
              </div>
              <FormField name="isActive" control={form.control} render={({ field }) => (<FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm"><div className="space-y-0.5"><FormLabel>Active</FormLabel></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>)} />
            </form>
          </Form>
          <DialogFooter><DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose><Button type="submit" form={PROMO_FORM_ID}>{editingCode ? 'Save Changes' : 'Create Code'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      
      {isLoading ? (<div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary"/></div>) :
       error ? (<Card className="bg-destructive/10"><CardContent className="p-4 text-destructive">{error}</CardContent></Card>) :
       (<Card className="shadow-lg">
          <CardHeader><CardTitle>Existing Promotional Codes</CardTitle><CardDescription>A list of all promo codes in the system.</CardDescription></CardHeader>
          <CardContent>
            {codes.length > 0 ? (
              <Table>
                <TableHeader><TableRow><TableHead>Code</TableHead><TableHead>Discount</TableHead><TableHead>Usage</TableHead><TableHead>Expires</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                  {codes.map(code => (
                    <TableRow key={code.id}>
                      <TableCell className="font-mono font-medium">{code.code}</TableCell>
                      <TableCell>{code.type === 'fixed' ? `GHS ${code.discountAmount.toFixed(2)}` : `${code.discountAmount}%`}</TableCell>
                      <TableCell>{code.timesUsed} / {code.usageLimit}</TableCell>
                      <TableCell>{formatDate(code.expiryDate)}</TableCell>
                      <TableCell><Badge variant={code.isActive ? 'default' : 'destructive'}>{code.isActive ? 'Active' : 'Inactive'}</Badge></TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleOpenModal(code)}><Edit2 className="h-3.5 w-3.5 mr-1"/>Edit</Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(code.id!)}><Trash2 className="h-3.5 w-3.5 mr-1"/>Delete</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-10">
                <TicketPercent className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-4 text-muted-foreground">No promo codes found.</p>
                <p className="text-sm text-muted-foreground">Click "Create New Code" to get started.</p>
              </div>
            )}
          </CardContent>
        </Card>)}
    </div>
  );
}
