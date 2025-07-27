
/**
 * @fileOverview TypeScript type definitions for Farming Years and Seasons.
 */

export interface FarmingSeason {
  id: string; // uuid
  name: string; // e.g., "Main Season", "Minor Season"
  startDate: string; // ISO yyyy-MM-dd
  endDate: string; // ISO yyyy-MM-dd
}

export interface FarmingYear {
  id: string; // Firestore document ID
  tenantId: string;
  name: string; // e.g., "2024 Farming Year"
  startDate: string; // ISO yyyy-MM-dd
  endDate: string; // ISO yyyy-MM-dd
  seasons: FarmingSeason[];
  createdAt: any; // Firestore ServerTimestamp
  updatedAt: any; // Firestore ServerTimestamp
}
