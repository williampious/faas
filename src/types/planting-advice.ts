
/**
 * @fileOverview TypeScript type definitions for the AI Planting Advice feature.
 */

import type { PlantingAdviceInput, PlantingAdviceOutput } from '@/ai/flows/generate-planting-advice';

export interface PlantingAdviceRecord {
  id: string;
  tenantId: string;
  inputs: PlantingAdviceInput;
  advice: PlantingAdviceOutput;
  createdAt: any; // Firestore ServerTimestamp or ISO string for client state
}
