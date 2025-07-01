/**
 * @fileOverview TypeScript type definitions for the Payroll Management feature.
 */
import type { PaymentSource } from './finance';

export const paymentMethods = ['Bank Transfer', 'Mobile Money', 'Cash', 'Cheque'] as const;
export type PaymentMethod = typeof paymentMethods[number];

export interface PayrollRecord {
  id: string; // Firestore document ID
  farmId: string;
  userId: string; // The user (employee) this payroll is for
  userName: string; // For easier display
  payPeriod: string; // e.g., "October 2024"
  paymentDate: string; // ISO yyyy-MM-dd
  grossAmount: number;
  deductions: number;
  netAmount: number;
  paymentMethod: PaymentMethod;
  notes?: string;
  createdAt: any; // Firestore ServerTimestamp
  updatedAt: any; // Firestore ServerTimestamp
}
