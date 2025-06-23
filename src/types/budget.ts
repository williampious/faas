
/**
 * @fileOverview TypeScript type definitions for the Budgeting feature.
 */

export interface BudgetLineItem {
  id: string;
  description: string;
  budgetedAmount: number;
  actualAmount?: number; // For future use
  notes?: string;
}

export interface BudgetCategory {
  id: string;
  name: string; // e.g., "Land Preparation", "Planting", "Labor", "Materials"
  budgetedAmount: number; // Sum of line items in this category, or direct entry for now
  actualAmount?: number; // Sum of actuals for line items in this category
  lineItems: BudgetLineItem[]; // Will be used in a future step
}

export interface Budget {
  id: string;
  name: string; // e.g., "2024 Maize Season Budget", "Annual Farm Budget 2025"
  startDate: string; // ISO date string "yyyy-MM-dd"
  endDate: string; // ISO date string "yyyy-MM-dd"
  categories: BudgetCategory[];
  totalBudgetedAmount: number; // Sum of all category budgeted amounts
  totalActualSpending?: number; // Sum of all category actual amounts
  notes?: string;
  createdAt: string; // ISO datetime string
  updatedAt: string; // ISO datetime string
}
