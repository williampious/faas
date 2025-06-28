
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
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { BrainCircuit, Lightbulb, CheckCircle, AlertTriangle, Loader2, BookClock } from 'lucide-react';
import { generatePlantingAdvice, type PlantingAdviceInput, type PlantingAdviceOutput } from '@/ai/flows/generate-planting-advice';
import { Alert, AlertTitle, AlertDescription as ShadcnAlertDescription } from '@/components/ui/alert';
import { useUserProfile } from '@/contexts/user-profile-context';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs, orderBy } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import type { PlantingAdviceRecord } from '@/types/planting-advice';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { format, parseISO } from 'date-fns';


const PlantingAdviceInputClientSchema = z.object({
  weatherData: z.string().min(10, { message: "Weather data must be at least 10 characters." }).max(2000),
  soilConditions: z.string().min(10, { message: "Soil conditions must be at least 10 characters." }).max(2000),
  cropType: z.string().min(2, { message: "Crop type must be at least 2 characters." }).max(100),
});

const ADVICE_RECORDS_COLLECTION = 'plantingAdviceRecords';

export default function PlantingAdvicePage() {
  const [advice, setAdvice] = useState<PlantingAdviceOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [records, setRecords] = useState<PlantingAdviceRecord[]>([]);
  const [isRecordsLoading, setIsRecordsLoading] = useState(true);
  
  const { userProfile, isLoading: isProfileLoading } = useUserProfile();
  const { toast } = useToast();

  const form = useForm<PlantingAdviceInput>({
    resolver: zodResolver(PlantingAdviceInputClientSchema),
    defaultValues: {
      weatherData: '',
      soilConditions: '',
      cropType: '',
    },
  });
  
  useEffect(() => {
    if (isProfileLoading) return;
    if (!userProfile?.farmId) {
      if (!isProfileLoading) {
        setError("Farm information is not available. Cannot load advice history.");
        setIsRecordsLoading(false);
      }
      return;
    }

    const fetchRecords = async () => {
      setIsRecordsLoading(true);
      try {
        const q = query(
          collection(db, ADVICE_RECORDS_COLLECTION), 
          where("farmId", "==", userProfile.farmId),
          orderBy("createdAt", "desc")
        );
        const querySnapshot = await getDocs(q);
        const fetchedRecords = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as PlantingAdviceRecord[];
        setRecords(fetchedRecords);
      } catch (err) {
        console.error("Error fetching advice records:", err);
        setError("Could not load past advice records.");
      } finally {
        setIsRecordsLoading(false);
      }
    };

    fetchRecords();
  }, [userProfile, isProfileLoading]);


  const onSubmit: SubmitHandler<PlantingAdviceInput> = async (data) => {
    if (!userProfile?.farmId) {
      setError("Cannot generate advice without farm information.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setAdvice(null);
    
    try {
      const result = await generatePlantingAdvice(data);
      setAdvice(result);

      // Save the record to Firestore
      const newRecord = {
        farmId: userProfile.farmId,
        inputs: data,
        advice: result,
        createdAt: serverTimestamp(),
      };
      const docRef = await addDoc(collection(db, ADVICE_RECORDS_COLLECTION), newRecord);
      
      // Add new record to local state to update UI instantly
      setRecords(prev => [{ ...newRecord, id: docRef.id, createdAt: new Date().toISOString() }, ...prev]);
      
      toast({
        title: "Advice Record Saved",
        description: "Your new planting advice has been saved to your history.",
      });

    } catch (err) {
      console.error("Error generating planting advice:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="AI-Powered Planting Advice"
        icon={BrainCircuit}
        description="Get smart recommendations for optimal planting schedules and save them for future reference."
      />

      <div className="grid md:grid-cols-2 gap-8">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline">Input Farm Data</CardTitle>
            <CardDescription>Provide the necessary information for the AI to generate advice.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField control={form.control} name="weatherData" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Weather Data</FormLabel>
                      <FormControl><Textarea placeholder="Describe historical and forecasted weather..." className="min-h-[100px]" {...field} /></FormControl>
                      <FormDescription>Include details relevant to your farm's location.</FormDescription>
                      <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="soilConditions" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Soil Conditions</FormLabel>
                      <FormControl><Textarea placeholder="Describe soil type, pH levels, nutrients, etc." className="min-h-[100px]" {...field} /></FormControl>
                      <FormDescription>Details about your soil will help generate better advice.</FormDescription>
                      <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="cropType" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Crop Type</FormLabel>
                      <FormControl><Input placeholder="e.g., Corn, Tomatoes, Wheat" {...field} /></FormControl>
                      <FormDescription>Specify the crop you intend to plant.</FormDescription>
                      <FormMessage />
                    </FormItem>
                )} />
                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lightbulb className="mr-2 h-4 w-4" />}
                  {isLoading ? 'Generating Advice...' : 'Get & Save Advice'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {error && !isLoading && (
            <Alert variant="destructive" className="shadow-md">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <ShadcnAlertDescription>{error}</ShadcnAlertDescription>
            </Alert>
          )}

          {advice && (
            <Card className="shadow-lg animate-in fade-in-50 duration-500">
              <CardHeader className="bg-primary/10">
                <CardTitle className="font-headline text-primary flex items-center"><CheckCircle className="h-6 w-6 mr-2" /> Your New Planting Advice</CardTitle>
                <CardDescription>This advice has been saved to your history below.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div><h3 className="font-semibold text-lg mb-1">Planting Schedule:</h3><p className="text-muted-foreground whitespace-pre-line">{advice.plantingSchedule}</p></div><hr />
                <div><h3 className="font-semibold text-lg mb-1">Fertilization Advice:</h3><p className="text-muted-foreground whitespace-pre-line">{advice.fertilizationAdvice}</p></div><hr />
                <div><h3 className="font-semibold text-lg mb-1">Other Action Items:</h3><p className="text-muted-foreground whitespace-pre-line">{advice.otherActionItems}</p></div>
              </CardContent>
            </Card>
          )}
          
          {!isLoading && !advice && !error && (
            <Card className="shadow-lg text-center py-10">
              <CardContent>
                <BrainCircuit className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Enter your farm data to receive personalized planting advice.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      
       <Card className="shadow-lg mt-8">
        <CardHeader>
            <CardTitle className="font-headline flex items-center"><BookClock className="mr-2 h-6 w-6 text-primary" /> Advice History</CardTitle>
            <CardDescription>Review previously generated planting advice for your farm.</CardDescription>
        </CardHeader>
        <CardContent>
            {isRecordsLoading ? (
                <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <p className="ml-2 text-muted-foreground">Loading history...</p>
                </div>
            ) : records.length > 0 ? (
                <Accordion type="single" collapsible className="w-full">
                    {records.map((record) => (
                        <AccordionItem value={record.id} key={record.id}>
                            <AccordionTrigger>
                                <div className="flex justify-between w-full pr-4">
                                    <span>Advice for <strong>{record.inputs.cropType}</strong></span>
                                    <span className="text-sm text-muted-foreground">
                                        {format(record.createdAt?.toDate ? record.createdAt.toDate() : parseISO(record.createdAt), 'PP')}
                                    </span>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="space-y-4">
                                <div>
                                    <h4 className="font-semibold mb-2">Inputs Provided:</h4>
                                    <div className="text-sm text-muted-foreground space-y-2 pl-4 border-l-2 ml-2">
                                        <p><strong>Crop:</strong> {record.inputs.cropType}</p>
                                        <p><strong>Weather:</strong> {record.inputs.weatherData}</p>
                                        <p><strong>Soil:</strong> {record.inputs.soilConditions}</p>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="font-semibold mb-2">AI-Generated Advice:</h4>
                                    <div className="text-sm space-y-2 pl-4 border-l-2 ml-2">
                                        <p><strong>Schedule:</strong> {record.advice.plantingSchedule}</p>
                                        <p><strong>Fertilization:</strong> {record.advice.fertilizationAdvice}</p>
                                        <p><strong>Other Actions:</strong> {record.advice.otherActionItems}</p>
                                    </div>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            ) : (
                <p className="text-center text-muted-foreground py-6">No past advice records found.</p>
            )}
        </CardContent>
    </Card>
    </div>
  );
}
