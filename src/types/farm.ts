
/**
 * @fileOverview TypeScript type definitions for Farm Management features,
 * specifically for Plots/Fields.
 */

export interface GPSCoordinates {
  latitude?: number;
  longitude?: number;
}

export interface PlotField {
  id: string;
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
  createdAt: string; // ISO datetime string
  updatedAt: string; // ISO datetime string
}
