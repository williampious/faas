'use client';

import { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { BrainCircuit, Lightbulb, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { generatePlantingAdvice, type PlantingAdviceInput, type PlantingAdviceOutput } from '@/ai/flows/generate-planting-advice'; // Adjusted path
import { Alert, AlertTitle, AlertDescription as ShadcnAlertDescription } from '@/components/ui/alert';


const PlantingAdviceInputClientSchema = z.object({
  weatherData: z.string().min(10, { message: "Weather data must be at least 10 characters." }).max(2000),
  soilConditions: z.string().min(10, { message: "Soil conditions must be at least 10 characters." }).max(2000),
  cropType: z.string().min(2, { message: "Crop type must be at least 2 characters." }).max(100),
});


export default function PlantingAdvicePage() {
  const [advice, setAdvice] = useState<PlantingAdviceOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<PlantingAdviceInput>({
    resolver: zodResolver(PlantingAdviceInputClientSchema),
    defaultValues: {
      weatherData: '',
      soilConditions: '',
      cropType: '',
    },
  });

  const onSubmit: SubmitHandler<PlantingAdviceInput> = async (data) => {
    setIsLoading(true);
    setError(null);
    setAdvice(null);
    try {
      const result = await generatePlantingAdvice(data);
      setAdvice(result);
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
        description="Get smart recommendations for optimal planting schedules based on your farm's data."
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
                <FormField
                  control={form.control}
                  name="weatherData"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Weather Data</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe historical and forecasted weather data (e.g., average rainfall, temperature ranges, frost dates)."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Include details relevant to your farm's location.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="soilConditions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Soil Conditions</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe soil type, pH levels, nutrient content, drainage, etc."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                       <FormDescription>
                        Details about your soil will help generate better advice.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="cropType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Crop Type</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Corn, Tomatoes, Wheat" {...field} />
                      </FormControl>
                      <FormDescription>
                        Specify the crop you intend to plant.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Lightbulb className="mr-2 h-4 w-4" />
                  )}
                  {isLoading ? 'Generating Advice...' : 'Get Planting Advice'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {error && (
            <Alert variant="destructive" className="shadow-md">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <ShadcnAlertDescription>{error}</ShadcnAlertDescription>
            </Alert>
          )}

          {advice && (
            <Card className="shadow-lg animate-in fade-in-50 duration-500">
              <CardHeader className="bg-primary/10">
                <CardTitle className="font-headline text-primary flex items-center">
                  <CheckCircle className="h-6 w-6 mr-2" />
                  Your Planting Advice
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div>
                  <h3 className="font-semibold text-lg mb-1">Planting Schedule:</h3>
                  <p className="text-muted-foreground whitespace-pre-line">{advice.plantingSchedule}</p>
                </div>
                <hr />
                <div>
                  <h3 className="font-semibold text-lg mb-1">Fertilization Advice:</h3>
                  <p className="text-muted-foreground whitespace-pre-line">{advice.fertilizationAdvice}</p>
                </div>
                <hr />
                <div>
                  <h3 className="font-semibold text-lg mb-1">Other Action Items:</h3>
                  <p className="text-muted-foreground whitespace-pre-line">{advice.otherActionItems}</p>
                </div>
              </CardContent>
            </Card>
          )}
          
          {!isLoading && !advice && !error && (
            <Card className="shadow-lg text-center py-10">
              <CardContent>
                <BrainCircuit className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Enter your farm data to receive personalized planting advice.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
