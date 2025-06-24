
/**
 * @fileOverview TypeScript type definitions for Farm and Plot data structures.
 */

export interface GPSCoordinates {
  latitude?: number;
  longitude?: number;
}

export interface Farm {
  id: string; // Firestore document ID
  name: string;
  description?: string;
  country?: string;
  region?: string;
  city?: string;
  farmEmail?: string;
  farmPhone?: string;
  createdAt: any; // Firestore ServerTimestamp
  updatedAt: any; // Firestore ServerTimestamp
  ownerId: string; // The userId of the user who created the farm
}

export interface PlotField {
  id: string;
  farmId: string; // The ID of the farm this plot belongs to (Tenant ID)
  name: string;
  description?: string;
  sizeAcres?: number;
  locationNotes?: string;
  gpsCoordinates?: GPSCoordinates;
  soilType?: string;
  // Future considerations:
  // currentCrop?: string;
  // plantingHistory?: Array<{ crop: string; season: string; yield: number; yieldUnit: string }>;
  // activityLog?: Array<{ date: string; activity: string; notes?: string }>;
  createdAt: any; // Firestore ServerTimestamp or ISO string
  updatedAt: any; // Firestore ServerTimestamp or ISO string
}
