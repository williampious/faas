
/**
 * @fileOverview TypeScript type definitions for Farm and Plot data structures.
 */

import type { SubscriptionDetails } from './user';

export interface GPSCoordinates {
  latitude?: number;
  longitude?: number;
}

export interface Farm {
  id: string; // Firestore document ID, serves as the tenantId
  name: string;
  description?: string;
  country?: string;
  region?: string;
  city?: string;
  farmEmail?: string;
  farmPhone?: string;
  farmWebsite?: string;
  currency?: 'GHS' | 'USD' | 'EUR' | 'NGN';
  subscription?: SubscriptionDetails;
  createdAt: any; // Firestore ServerTimestamp
  updatedAt: any; // Firestore ServerTimestamp
  ownerId: string; // The userId of the user who created the farm
}

export interface PlotField {
  id: string;
  tenantId: string; // The ID of the tenant (farm) this plot belongs to
  name: string;
  description?: string;
  sizeAcres?: number;
  locationNotes?: string;
  gpsCoordinates?: GPSCoordinates;
  soilType?: string;
  createdAt: any; 
  updatedAt: any;
}
