
/**
 * @fileOverview TypeScript type definitions for the Technology Management feature.
 */
import type { PaymentSource } from './finance';

export const assetTypes = ['Hardware', 'Software License', 'Subscription'] as const;
export type AssetType = typeof assetTypes[number];

export const assetStatuses = ['In Use', 'In Storage', 'Awaiting Repair', 'Decommissioned'] as const;
export type AssetStatus = typeof assetStatuses[number];

export interface TechnologyAsset {
  id: string;
  tenantId: string;
  name: string;
  assetType: AssetType;
  status: AssetStatus;
  
  // Purchase & Cost
  purchaseDate: string; // ISO "yyyy-MM-dd"
  purchaseCost: number;
  paymentSource: PaymentSource;
  supplier?: string;
  
  // Assignment & Usage
  assignedTo?: string; // User or department name
  
  // Dates
  warrantyExpiry?: string; // ISO "yyyy-MM-dd"
  licenseExpiry?: string; // ISO "yyyy-MM-dd"
  
  // Details
  serialNumber?: string;
  notes?: string;
  
  // Timestamps
  createdAt: any;
  updatedAt: any;
}
