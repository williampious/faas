
/**
 * @fileOverview TypeScript type definitions for the Planting feature.
 */
import type { CostItem } from './finance';

export const plantingMethods = ['Direct Sowing', 'Transplanting', 'Broadcasting', 'Drilling'] as const;
export type PlantingMethod = typeof plantingMethods[number];

export interface PlantingRecord {
  id: string;
  tenantId: string;
  cropType: string;
  variety?: string;
  datePlanted: string; // ISO string "yyyy-MM-dd"
  areaPlanted: string;
  seedSource?: string;
  plantingMethod: PlantingMethod;
  notes?: string;
  costItems: CostItem[];
  totalPlantingCost: number;
  farmingYearId?: string;
  farmingSeasonId?: string;
  createdAt: any; // Firestore ServerTimestamp
  updatedAt: any; // Firestore ServerTimestamp
}
