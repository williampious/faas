
/**
 * @fileOverview TypeScript type definitions for the Harvesting feature.
 */
import type { CostCategory, PaymentSource } from './finance';

export const yieldUnits = ['kg', 'bags (50kg)', 'bags (100kg)', 'crates', 'tons', 'bunches', 'pieces'] as const;
export type YieldUnit = typeof yieldUnits[number];

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

export interface SaleItem {
  id: string;
  buyer: string;
  quantitySold: number;
  unitOfSale: string;
  pricePerUnit: number;
  saleDate: string; // ISO "yyyy-MM-dd"
  paymentSource: PaymentSource; // How the money was received
  totalSaleAmount: number;
}


export interface HarvestingRecord {
  id: string;
  farmId: string;
  cropType: string;
  variety?: string;
  dateHarvested: string; // ISO "yyyy-MM-dd"
  areaHarvested: string;
  yieldQuantity: number;
  yieldUnit: YieldUnit;
  qualityGrade?: string;
  postHarvestActivities?: string;
  storageLocation?: string;
  notes?: string;
  costItems: CostItem[];
  totalHarvestCost: number;
  salesDetails: SaleItem[];
  totalSalesIncome: number;
  createdAt: any; // Firestore ServerTimestamp
  updatedAt: any; // Firestore ServerTimestamp
}
