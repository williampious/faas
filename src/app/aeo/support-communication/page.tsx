
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { MessageSquareText, PlusCircle, Edit2, Trash2, ArrowLeft, Loader2, AlertTriangle } from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import type { SupportLog, InteractionType } from '@/types/support-log';
import { interactionTypes } from '@/types/support-log';
import type { AgriFAASUserProfile } from '@/types/user';
import { useUserProfile } from '@/contexts/user-profile-context';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, orderBy } from 'firebase/firestore';

const supportLogFormSchema = z.object({
  farmerId: z.string().min(1, "You must select a farmer."),
  interactionDate: z.string().refine((val) => !!val && isValid(parseISO(val)), { message: "Valid date is required." }),
  interactionType: z.enum(interactionTypes, { required_error: "Interaction type is required." }),
  summary: z.string().min(10, { message: "Summary must be at least 10 characters." }).max(1500),
  adviceGiven: z.string().max(1500).optional(),
  farmerFeedback: z.string().max(1000).optional(),
  followUpRequired: z.boolean().default(false),
  followUpDate: z.string().optional(),
  followUpNotes: z.string().max(1000).optional(),
});

type SupportLogFormValues = z.infer<typeof supportLogFormSchema>;

const LOGS_COLLECTION = 'supportLogs';
const USERS_COLLECTION = 'users';
const LOG_FORM_ID = 'support-log-form';

export default function SupportCommunicationPage() {
  const [logs, setLogs] = useState<SupportLog[]>([]);
  const [farmers, setFarmers] = useState<AgriFAASUserProfile[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<SupportLog | null>(null);
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { userProfile: aeoProfile, isLoading: isProfileLoading } = useUserProfile();

  const form = useForm<SupportLogFormValues>({
    resolver: zodResolver(supportLogFormSchema),
    defaultValues: {
      farmerId: '', interactionDate: '', interactionType: undefined, summary: '',
      adviceGiven: '', farmerFeedback: '', followUpRequired: false, followUpDate: '', followUpNotes: '',
    },
  });

  useEffect(() => {
    if (isProfileLoading) return;
    if (!aeoProfile?.userId) {
      if (!isProfileLoading) setError("Your AEO profile could not be loaded. Cannot fetch associated data.");
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const farmersQuery = query(collection(db, USERS_COLLECTION), where('managedByAEO', '==', aeoProfile.userId));
        const farmersSnapshot = await getDocs(farmersQuery);
        setFarmers(farmersSnapshot.docs.map(doc => ({ userId: doc.id, ...doc.data() } as AgriFAASUserProfile)));

        const logsQuery = query(collection(db, LOGS_COLLECTION), where("aeoId", "==", aeoProfile.userId), orderBy("interactionDate", "desc"));
        const logsSnapshot = await getDocs(logsQuery);
        setLogs(logsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SupportLog)));
      } catch (e: any) {
        setError("Failed to load data. This might be due to a missing Firestore index or permissions. Please check the README file.");
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [aeoProfile, isProfileLoading]);

  const handleOpenModal = (logToEdit?: SupportLog) => {
    setEditingLog(logToEdit || null);
    if (logToEdit) {
      form.reset(logToEdit);
    } else {
      form.reset({
        farmerId: '', interactionDate: '', interactionType: undefined, summary: '',
        adviceGiven: '', farmerFeedback: '', followUpRequired: false, followUpDate: '', followUpNotes: '',
      });
    }
    setIsModalOpen(true);
  };
  
  const onSubmit: SubmitHandler<SupportLogFormValues> = async (data) => {
    if (!aeoProfile?.userId) {
        toast({ title: "Error", description: "AEO profile not found.", variant: "destructive" });
        return;
    }

    const selectedFarmer = farmers.find(f => f.userId === data.farmerId);
    if (!selectedFarmer) {
        toast({ title: "Error", description: "Selected farmer not found.", variant: "destructive" });
        return;
    }
    
    const logData = {
      ...data,
      aeoId: aeoProfile.userId,
      farmId: selectedFarmer.farmId || '', // Include farmId if available
      farmerName: selectedFarmer.fullName,
      updatedAt: serverTimestamp(),
    };

    try {
      if (editingLog) {
        const logRef = doc(db, LOGS_COLLECTION, editingLog.id);
        await updateDoc(logRef, logData);
        setLogs(logs.map(l => l.id === editingLog.id ? { ...l, ...logData } : l));
        toast({ title: "Log Updated", description: "The interaction log has been successfully updated." });
      } else {
        const docRef = await addDoc(collection(db, LOGS_COLLECTION), { ...logData, createdAt: serverTimestamp() });
        setLogs(prev => [{ ...logData, id: docRef.id, createdAt: new Date().toISOString() } as SupportLog, ...prev]);
        toast({ title: "Log Created", description: "New interaction log has been saved." });
      }
      setIsModalOpen(false);
    } catch (e: any) {
      toast({ title: "Error", description: `Failed to save log: ${e.message}`, variant: "destructive" });
    }
  };

  const handleDelete = async (logId: string) => {
    await deleteDoc(doc(db, LOGS_COLLECTION, logId));
    toast({ title: "Log Deleted", variant: "destructive" });
    setLogs(logs.filter(l => l.id !== logId));
  };
  
  const formatDate = (dateStr: string) => isValid(parseISO(dateStr)) ? format(parseISO(dateStr), 'PP') : 'Invalid Date';

  return (
    <div>
      <PageHeader
        title="Support & Communication Logs"
        icon={MessageSquareText}
        description="Log interactions, advice provided, and track follow-up visits with farmers."
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push('/aeo/dashboard')}><ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard</Button>
            <Button onClick={() => handleOpenModal()}><PlusCircle className="mr-2 h-4 w-4" /> Log New Interaction</Button>
          </div>
        }
      />
      
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader><DialogTitle>{editingLog ? 'Edit' : 'Log New'} Interaction</DialogTitle></DialogHeader>
          <div className="flex-grow overflow-y-auto pr-2 py-4">
            <Form {...form}>
              <form id={LOG_FORM_ID} onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField name="farmerId" control={form.control} render={({ field }) => (<FormItem><FormLabel>Farmer*</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a farmer" /></SelectTrigger></FormControl><SelectContent>{farmers.map(f => <SelectItem key={f.userId} value={f.userId}>{f.fullName}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                <FormField name="interactionDate" control={form.control} render={({ field }) => (<FormItem><FormLabel>Interaction Date*</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField name="interactionType" control={form.control} render={({ field }) => (<FormItem><FormLabel>Interaction Type*</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger></FormControl><SelectContent>{interactionTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                <FormField name="summary" control={form.control} render={({ field }) => (<FormItem><FormLabel>Summary of Interaction*</FormLabel><FormControl><Textarea placeholder="Describe the main points of the interaction." className="min-h-[100px]" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField name="adviceGiven" control={form.control} render={({ field }) => (<FormItem><FormLabel>Advice Given (Optional)</FormLabel><FormControl><Textarea placeholder="Detail any specific advice or recommendations provided." {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField name="farmerFeedback" control={form.control} render={({ field }) => (<FormItem><FormLabel>Farmer Feedback (Optional)</FormLabel><FormControl><Textarea placeholder="Note any feedback, questions, or concerns from the farmer." {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="followUpRequired" render={({ field }) => (<FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><div className="space-y-1 leading-none"><FormLabel>Follow-up Required?</FormLabel></div></FormItem>)} />
                {form.watch('followUpRequired') && (
                  <div className="space-y-4 p-4 border rounded-lg animate-in fade-in-50">
                     <FormField name="followUpDate" control={form.control} render={({ field }) => (<FormItem><FormLabel>Follow-up Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)} />
                     <FormField name="followUpNotes" control={form.control} render={({ field }) => (<FormItem><FormLabel>Follow-up Notes</FormLabel><FormControl><Textarea placeholder="Describe the required follow-up action." {...field} /></FormControl><FormMessage /></FormItem>)} />
                  </div>
                )}
              </form>
            </Form>
          </div>
          <DialogFooter className="border-t pt-4"><DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose><Button type="submit" form={LOG_FORM_ID}>{editingLog ? 'Save Changes' : 'Save Log'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      
      {isLoading ? (<div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary"/></div>) :
       error ? (<Card className="bg-destructive/10"><CardContent className="p-4 text-destructive">{error}</CardContent></Card>) :
       (<Card className="shadow-lg">
          <CardHeader><CardTitle>Interaction History</CardTitle><CardDescription>A list of all your logged farmer interactions.</CardDescription></CardHeader>
          <CardContent>
            {logs.length > 0 ? (
              <Table>
                <TableHeader><TableRow><TableHead>Farmer</TableHead><TableHead>Interaction Date</TableHead><TableHead>Type</TableHead><TableHead>Follow-up?</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                  {logs.map(log => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium">{log.farmerName}</TableCell>
                      <TableCell>{formatDate(log.interactionDate)}</TableCell>
                      <TableCell>{log.interactionType}</TableCell>
                      <TableCell>{log.followUpRequired ? `Yes (${log.followUpDate ? formatDate(log.followUpDate) : 'TBD'})` : 'No'}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleOpenModal(log)}><Edit2 className="h-3.5 w-3.5 mr-1"/>Edit</Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(log.id)}><Trash2 className="h-3.5 w-3.5 mr-1"/>Delete</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-10"><MessageSquareText className="mx-auto h-12 w-12 text-muted-foreground" /><p className="mt-4">No interaction logs found.</p></div>
            )}
          </CardContent>
        </Card>)}
    </div>
  );
}
