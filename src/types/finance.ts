/**
 * @fileOverview Centralized TypeScript type definitions for financial data.
 */

export const paymentSources = ['Cash', 'Bank', 'Mobile Money', 'Credit (Payable)'] as const;
export type PaymentSource = typeof paymentSources[number];

export const costCategories = ['Material/Input', 'Labor', 'Equipment Rental', 'Services', 'Utilities', 'Other'] as const;
export type CostCategory = typeof costCategories[number];

export type TransactionType = 'Income' | 'Expense';

export type LinkedModule = 
  | 'Land Preparation' 
  | 'Planting' 
  | 'Crop Maintenance' 
  | 'Harvesting' 
  | 'Animal Housing'
  | 'Animal Health'
  | 'Other';

export interface OperationalTransaction {
  id: string; // a unique id for the transaction itself
  date: string; // ISO "yyyy-MM-dd"
  description: string; // From cost/sale item description
  amount: number;
  type: TransactionType;
  category: CostCategory;
  paymentSource?: PaymentSource; // Optional for income, required for expense
  linkedModule: LinkedModule;
  linkedActivityId: string; // ID of the parent activity (e.g., land prep record)
  linkedItemId: string; // ID of the specific cost/sale item
}
