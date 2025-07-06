
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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { PlusCircle, CalendarClock, Trash2, Edit2, Loader2, AlertTriangle, ArrowLeft } from 'lucide-react';
import { format, parseISO, isValid, isAfter, isEqual } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import type { FarmingYear, FarmingSeason } from '@/types/season';
import { useUserProfile } from '@/contexts/user-profile-context';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';

const yearFormSchema = z.object({
  name: z.string().min(3, { message: "Year name must be at least 3 characters." }).max(50),
  startDate: z.string().refine((val) => !!val && isValid(parseISO(val)), { message: "Valid start date is required." }),
  endDate: z.string().refine((val) => !!val && isValid(parseISO(val)), { message: "Valid end date is required." }),
}).refine(data => isAfter(parseISO(data.endDate), parseISO(data.startDate)) || isEqual(parseISO(data.endDate), parseISO(data.startDate)), {
  message: "End date must be on or after start date.",
  path: ["endDate"],
});
type YearFormValues = z.infer<typeof yearFormSchema>;

const seasonFormSchema = z.object({
  name: z.string().min(3, { message: "Season name must be at least 3 characters." }).max(50),
  startDate: z.string().refine((val) => !!val && isValid(parseISO(val)), { message: "Valid start date is required." }),
  endDate: z.string().refine((val) => !!val && isValid(parseISO(val)), { message: "Valid end date is required." }),
}).refine(data => isAfter(parseISO(data.endDate), parseISO(data.startDate)) || isEqual(parseISO(data.endDate), parseISO(data.startDate)), {
  message: "End date must be on or after start date.",
  path: ["endDate"],
});
type SeasonFormValues = z.infer<typeof seasonFormSchema>;

const FARMING_YEARS_COLLECTION = 'farmingYears';

export default function YearsAndSeasonsPage() {
  const [years, setYears] = useState<FarmingYear[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { userProfile, isLoading: isProfileLoading } = useUserProfile();
  const { toast } = useToast();

  const [isYearModalOpen, setIsYearModalOpen] = useState(false);
  const [isSeasonModalOpen, setIsSeasonModalOpen] = useState(false);
  const [editingYear, setEditingYear] = useState<FarmingYear | null>(null);
  const [editingSeason, setEditingSeason] = useState<FarmingSeason | null>(null);
  const [currentYearForSeason, setCurrentYearForSeason] = useState<FarmingYear | null>(null);

  const yearForm = useForm<YearFormValues>({ resolver: zodResolver(yearFormSchema) });
  const seasonForm = useForm<SeasonFormValues>({ resolver: zodResolver(seasonFormSchema) });

  useEffect(() => {
    if (isProfileLoading) return;
    if (!userProfile?.farmId) {
      setError("Farm information not available.");
      setIsLoading(false);
      return;
    }
    const fetchYears = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const q = query(collection(db, FARMING_YEARS_COLLECTION), where("farmId", "==", userProfile.farmId), orderBy("startDate", "desc"));
        const querySnapshot = await getDocs(q);
        setYears(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FarmingYear)));
      } catch (e: any) {
        setError("Failed to load farming years. Please check permissions and network.");
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchYears();
  }, [userProfile, isProfileLoading]);

  const handleOpenYearModal = (year?: FarmingYear) => {
    setEditingYear(year || null);
    yearForm.reset(year ? { name: year.name, startDate: year.startDate, endDate: year.endDate } : { name: '', startDate: '', endDate: '' });
    setIsYearModalOpen(true);
  };

  const handleOpenSeasonModal = (year: FarmingYear, season?: FarmingSeason) => {
    setCurrentYearForSeason(year);
    setEditingSeason(season || null);
    seasonForm.reset(season ? { name: season.name, startDate: season.startDate, endDate: season.endDate } : { name: '', startDate: '', endDate: '' });
    setIsSeasonModalOpen(true);
  };

  const handleYearSubmit: SubmitHandler<YearFormValues> = async (data) => {
    if (!userProfile?.farmId) return;
    try {
      if (editingYear) {
        const yearRef = doc(db, FARMING_YEARS_COLLECTION, editingYear.id);
        await updateDoc(yearRef, { ...data, updatedAt: serverTimestamp() });
        setYears(years.map(y => y.id === editingYear.id ? { ...y, ...data } : y));
        toast({ title: "Farming Year Updated" });
      } else {
        const newYear = { farmId: userProfile.farmId, ...data, seasons: [], createdAt: serverTimestamp(), updatedAt: serverTimestamp() };
        const docRef = await addDoc(collection(db, FARMING_YEARS_COLLECTION), newYear);
        setYears([{ ...newYear, id: docRef.id } as FarmingYear, ...years]);
        toast({ title: "Farming Year Created" });
      }
      setIsYearModalOpen(false);
    } catch (e: any) {
      toast({ title: "Error", description: `Failed to save year: ${e.message}`, variant: "destructive" });
    }
  };

  const handleSeasonSubmit: SubmitHandler<SeasonFormValues> = async (data) => {
    if (!currentYearForSeason) return;
    let updatedSeasons: FarmingSeason[];
    if (editingSeason) {
      updatedSeasons = currentYearForSeason.seasons.map(s => s.id === editingSeason.id ? { ...editingSeason, ...data } : s);
      toast({ title: "Season Updated" });
    } else {
      updatedSeasons = [...currentYearForSeason.seasons, { id: uuidv4(), ...data }];
      toast({ title: "Season Added" });
    }
    const yearRef = doc(db, FARMING_YEARS_COLLECTION, currentYearForSeason.id);
    await updateDoc(yearRef, { seasons: updatedSeasons, updatedAt: serverTimestamp() });
    setYears(years.map(y => y.id === currentYearForSeason.id ? { ...y, seasons: updatedSeasons } : y));
    setIsSeasonModalOpen(false);
  };

  const handleDeleteYear = async (yearId: string) => {
    await deleteDoc(doc(db, FARMING_YEARS_COLLECTION, yearId));
    setYears(years.filter(y => y.id !== yearId));
    toast({ title: "Farming Year Deleted", variant: "destructive" });
  };

  const handleDeleteSeason = async (yearId: string, seasonId: string) => {
    const year = years.find(y => y.id === yearId);
    if (!year) return;
    const updatedSeasons = year.seasons.filter(s => s.id !== seasonId);
    const yearRef = doc(db, FARMING_YEARS_COLLECTION, yearId);
    await updateDoc(yearRef, { seasons: updatedSeasons, updatedAt: serverTimestamp() });
    setYears(years.map(y => y.id === yearId ? { ...y, seasons: updatedSeasons } : y));
    toast({ title: "Season Deleted", variant: "destructive" });
  };
  
  const formatDate = (dateStr: string) => isValid(parseISO(dateStr)) ? format(parseISO(dateStr), 'PP') : 'Invalid Date';

  return (
    <div>
      <PageHeader
        title="Farming Years & Seasons"
        icon={CalendarClock}
        description="Define chronological years and seasons to structure your farm's operational data."
        action={
          <div className="flex gap-2">
             <Button variant="outline" onClick={() => router.push('/farm-management')}><ArrowLeft className="mr-2 h-4 w-4" /> Back to Farm Management</Button>
            <Button onClick={() => handleOpenYearModal()}><PlusCircle className="mr-2 h-4 w-4" /> Create Farming Year</Button>
          </div>
        }
      />
      
      {/* Year Creation/Editing Modal */}
      <Dialog open={isYearModalOpen} onOpenChange={setIsYearModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingYear ? 'Edit' : 'Create'} Farming Year</DialogTitle>
          </DialogHeader>
          <Form {...yearForm}>
            <form onSubmit={yearForm.handleSubmit(handleYearSubmit)} className="space-y-4 py-4">
              <FormField name="name" control={yearForm.control} render={({ field }) => (<FormItem><FormLabel>Year Name*</FormLabel><FormControl><Input placeholder="e.g., 2024 Farming Year" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField name="startDate" control={yearForm.control} render={({ field }) => (<FormItem><FormLabel>Start Date*</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField name="endDate" control={yearForm.control} render={({ field }) => (<FormItem><FormLabel>End Date*</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <DialogFooter>
                <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                <Button type="submit">{editingYear ? 'Save Changes' : 'Create Year'}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Season Creation/Editing Modal */}
      <Dialog open={isSeasonModalOpen} onOpenChange={setIsSeasonModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSeason ? 'Edit' : 'Add'} Season to {currentYearForSeason?.name}</DialogTitle>
          </DialogHeader>
          <Form {...seasonForm}>
            <form onSubmit={seasonForm.handleSubmit(handleSeasonSubmit)} className="space-y-4 py-4">
              <FormField name="name" control={seasonForm.control} render={({ field }) => (<FormItem><FormLabel>Season Name*</FormLabel><FormControl><Input placeholder="e.g., Main Season" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField name="startDate" control={seasonForm.control} render={({ field }) => (<FormItem><FormLabel>Start Date*</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField name="endDate" control={seasonForm.control} render={({ field }) => (<FormItem><FormLabel>End Date*</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <DialogFooter>
                <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                <Button type="submit">{editingSeason ? 'Save Changes' : 'Add Season'}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {isLoading ? (
        <div className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /><p className="ml-2">Loading data...</p></div>
      ) : error ? (
        <Card className="bg-destructive/10"><CardContent className="p-4 text-destructive">{error}</CardContent></Card>
      ) : years.length === 0 ? (
        <div className="text-center py-10"><CalendarClock className="mx-auto h-12 w-12 text-muted-foreground" /><p className="mt-4 text-muted-foreground">No farming years created yet.</p></div>
      ) : (
        <div className="space-y-4">
          {years.map(year => (
            <Card key={year.id} className="shadow-md">
              <CardHeader className="flex flex-row justify-between items-start">
                <div>
                  <CardTitle>{year.name}</CardTitle>
                  <CardDescription>{formatDate(year.startDate)} - {formatDate(year.endDate)}</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleOpenYearModal(year)}>Edit Year</Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDeleteYear(year.id)}>Delete Year</Button>
                </div>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="seasons">
                    <AccordionTrigger>View Seasons ({year.seasons.length})</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3">
                        {year.seasons.length > 0 ? (
                          year.seasons.map(season => (
                            <div key={season.id} className="flex justify-between items-center p-3 border rounded-md bg-muted/30">
                              <div>
                                <p className="font-semibold">{season.name}</p>
                                <p className="text-sm text-muted-foreground">{formatDate(season.startDate)} - {formatDate(season.endDate)}</p>
                              </div>
                              <div className="flex gap-2">
                                <Button variant="ghost" size="icon" onClick={() => handleOpenSeasonModal(year, season)}><Edit2 className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteSeason(year.id, season.id)}><Trash2 className="h-4 w-4" /></Button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground text-center py-2">No seasons defined for this year.</p>
                        )}
                        <Button variant="secondary" className="w-full" onClick={() => handleOpenSeasonModal(year)}>
                          <PlusCircle className="mr-2 h-4 w-4" /> Add Season
                        </Button>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
