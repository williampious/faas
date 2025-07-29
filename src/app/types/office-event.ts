
/**
 * @fileOverview TypeScript type definitions for the Office Event Planning feature.
 */
import type { CostItem } from './finance';

export const officeEventCategories = ['Meeting', 'Workshop', 'Training', 'Conference', 'Team Building', 'Holiday Party', 'Other'] as const;
export type OfficeEventCategory = typeof officeEventCategories[number];

export interface OfficeEvent {
  id: string; // Firestore document ID
  tenantId: string;
  name: string; // e.g., "Q3 Financial Review", "Annual Staff Retreat"
  category: OfficeEventCategory;
  eventDate: string; // ISO yyyy-MM-dd
  budgetedAmount: number;
  notes?: string;
  costItems: CostItem[];
  totalActualCost: number;
  createdAt: any;
  updatedAt: any;
}
