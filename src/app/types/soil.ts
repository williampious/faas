
/**
 * @fileOverview TypeScript type definitions for the Soil & Water Management feature.
 */
import type { CostItem } from './finance';

export interface SoilTestRecord {
  id: string;
  tenantId: string;
  testDate: string; // ISO "yyyy-MM-dd"
  plotName: string; // Simplified for now, just a text field
  phLevel?: number;
  nitrogenPPM?: number;
  phosphorusPPM?: number;
  potassiumPPM?: number;
  organicMatterPercent?: number;
  labName?: string;
  notes?: string; // For recommendations or general notes
  costItems: CostItem[];
  totalCost: number;
  createdAt: any; // Firestore ServerTimestamp
  updatedAt: any; // Firestore ServerTimestamp
}
