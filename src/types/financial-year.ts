
/**
 * @fileOverview TypeScript type definitions for Financial Years.
 */

export interface FinancialYear {
  id: string;
  tenantId: string;
  name: string; // e.g., "FY 2024-2025"
  startDate: string; // ISO yyyy-MM-dd
  endDate: string; // ISO yyyy-MM-dd
  status: 'Active' | 'Archived';
  createdAt: any; // Firestore ServerTimestamp
  updatedAt: any; // Firestore ServerTimestamp
}
