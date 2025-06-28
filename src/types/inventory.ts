
/**
 * @fileOverview TypeScript type definitions for the Resource Inventory feature.
 */
import type { PaymentSource } from './finance';

export const resourceCategories = [
  'Seeds',
  'Fertilizers',
  'Pesticides',
  'Herbicides',
  'Animal Feed',
  'Fuel',
  'Equipment Parts',
  'Other',
] as const;
export type ResourceCategory = typeof resourceCategories[number];

export interface ResourceItem {
  id: string;
  farmId: string;
  name: string;
  category: ResourceCategory;
  quantity: number;
  unit: string; // e.g., 'kg', 'liters', 'bags', 'units'
  supplier?: string;
  purchaseDate: string; // ISO "yyyy-MM-dd"
  paymentSource?: PaymentSource;
  costPerUnit?: number;
  totalCost: number;
  notes?: string;
  createdAt: string; // ISO datetime string
  updatedAt: string; // ISO datetime string
}
