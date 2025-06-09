// use server'
'use server';
/**
 * @fileOverview AI-powered planting advice flow.
 *
 * - generatePlantingAdvice - A function that generates planting advice.
 * - PlantingAdviceInput - The input type for the generatePlantingAdvice function.
 * - PlantingAdviceOutput - The return type for the generatePlantingAdvice function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PlantingAdviceInputSchema = z.object({
  weatherData: z
    .string()
    .describe('Historical and forecasted weather data for the farm location.'),
  soilConditions: z.string().describe('Description of the soil conditions.'),
  cropType: z.string().describe('The type of crop to be planted.'),
});
export type PlantingAdviceInput = z.infer<typeof PlantingAdviceInputSchema>;

const PlantingAdviceOutputSchema = z.object({
  plantingSchedule: z
    .string()
    .describe('Recommended planting schedule (dates or periods).'),
  fertilizationAdvice: z
    .string()
    .describe('Recommendations for fertilization.'),
  otherActionItems: z
    .string()
    .describe('Other suggested actions to improve crop yields.'),
});
export type PlantingAdviceOutput = z.infer<typeof PlantingAdviceOutputSchema>;

export async function generatePlantingAdvice(
  input: PlantingAdviceInput
): Promise<PlantingAdviceOutput> {
  return generatePlantingAdviceFlow(input);
}

const prompt = ai.definePrompt({
  name: 'plantingAdvicePrompt',
  input: {schema: PlantingAdviceInputSchema},
  output: {schema: PlantingAdviceOutputSchema},
  prompt: `You are an expert agricultural advisor. Provide planting advice based on the following data:

Weather Data: {{{weatherData}}}
Soil Conditions: {{{soilConditions}}}
Crop Type: {{{cropType}}}

Consider all factors when providing the advice. Be concise and specific in your recommendations for the planting schedule, fertilization, and any other action items that the user should consider, to improve crop yields.`,
});

const generatePlantingAdviceFlow = ai.defineFlow(
  {
    name: 'generatePlantingAdviceFlow',
    inputSchema: PlantingAdviceInputSchema,
    outputSchema: PlantingAdviceOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
