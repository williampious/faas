
/**
 * @fileOverview TypeScript type definitions for the Planting feature.
 */
import type { CostCategory, PaymentSource } from './finance';

export const plantingMethods = ['Direct Sowing', 'Transplanting', 'Broadcasting', 'Drilling'] as const;
export type PlantingMethod = typeof plantingMethods[number];

export interface CostItem {
  id: string;
  description: string;
  category: CostCategory;
  paymentSource: PaymentSource;
  unit: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface PlantingRecord {
  id: string;
  farmId: string;
  cropType: string;
  variety?: string;
  datePlanted: string; // ISO string "yyyy-MM-dd"
  areaPlanted: string;
  seedSource?: string;
  plantingMethod: PlantingMethod;
  notes?: string;
  costItems: CostItem[];
  totalPlantingCost: number;
  createdAt: any; // Firestore ServerTimestamp
  updatedAt: any; // Firestore ServerTimestamp
}

    