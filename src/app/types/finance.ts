
/**
 * @fileOverview Centralized TypeScript type definitions for financial data.
 */

export const paymentSources = ['Cash', 'Bank', 'Mobile Money', 'Credit (Payable)'] as const;
export type PaymentSource = typeof paymentSources[number];

export const costCategories = ['Material/Input', 'Labor', 'Equipment Rental', 'Services', 'Utilities', 'Vet Services', 'Medication', 'Payroll', 'Technology', 'Administrative', 'Events', 'Safety', 'Breeding', 'Other'] as const;
export type CostCategory = typeof costCategories[number];

export type TransactionType = 'Income' | 'Expense';

export type LinkedModule = 
  | 'Land Preparation' 
  | 'Planting' 
  | 'Crop Maintenance' 
  | 'Harvesting'
  | 'Animal Housing'
  | 'Animal Health'
  | 'Animal Feeding'
  | 'Breeding'
  | 'Resource Inventory'
  | 'Payroll'
  | 'Technology Management'
  | 'Facility Management'
  | 'Records Management'
  | 'Event Planning'
  | 'Safety & Security'
  | 'Soil & Water Management'
  | 'Other';

// Define which modules fall under which high-level budget type for filtering
export const FARM_OPS_MODULES: LinkedModule[] = [
  'Land Preparation', 
  'Planting', 
  'Crop Maintenance', 
  'Harvesting',
  'Animal Housing',
  'Animal Health',
  'Animal Feeding',
  'Breeding',
  'Resource Inventory',
  'Soil & Water Management'
];

export const OFFICE_OPS_MODULES: LinkedModule[] = [
  'Payroll',
  'Technology Management',
  'Facility Management',
  'Records Management',
  'Event Planning',
  'Safety & Security',
  'Other' // 'Other' can be used for general office expenses not tied to a specific module
];


export interface OperationalTransaction {
  id: string; // a unique id for the transaction itself
  tenantId: string; // Foreign key to the tenant (farm)
  date: string; // ISO "yyyy-MM-dd"
  description: string; // From cost/sale item description
  amount: number;
  type: TransactionType;
  category: CostCategory;
  paymentSource: PaymentSource;
  linkedModule: LinkedModule;
  linkedActivityId: string; // ID of the parent activity (e.g., land prep record)
  linkedItemId: string; // ID of the specific cost/sale item
}

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
