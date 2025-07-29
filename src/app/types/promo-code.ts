/**
 * @fileOverview TypeScript type definitions for Promotional Codes.
 */

export type PromoCodeType = 'fixed' | 'percentage';

export interface PromotionalCode {
  id?: string; // Firestore document ID
  code: string; // The code the user enters, e.g., "SAVE50"
  type: PromoCodeType;
  discountAmount: number; // For 'fixed', this is the cash value. For 'percentage', it's the percent (e.g., 20 for 20%).
  usageLimit: number; // Total number of times this code can be used.
  timesUsed: number;
  expiryDate: string; // ISO yyyy-MM-dd
  isActive: boolean;
  
  // Optional constraints
  appliesToPlans?: string[]; // e.g., ['grower', 'business']
  appliesToCycles?: ('monthly' | 'annually')[];
  
  // Timestamps
  createdAt?: any;
  updatedAt?: any;
}
