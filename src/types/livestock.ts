
/**
 * @fileOverview TypeScript type definitions for the Livestock Production feature.
 */

export const animalTypes = ['Poultry', 'Cattle', 'Goats', 'Sheep', 'Pigs', 'Fish', 'Rabbits'] as const;
export type AnimalType = typeof animalTypes[number];

export const managementSystems = ['Extensive', 'Semi-Intensive', 'Intensive'] as const;
export type ManagementSystem = typeof managementSystems[number];

// Represents the current focus/settings for a livestock production operation
export interface LivestockProductionFocus {
  id: string; // Could be a default ID if only one focus is stored
  projectName?: string; // Optional user-defined name for this production cycle
  animalType: AnimalType;
  managementSystem: ManagementSystem;
  lastUpdatedAt: string; // ISO datetime string
}

// Future types for housing, feeding, health etc. will go here
// e.g.,
// export interface HousingRecord { ... }
// export interface FeedingSchedule { ... }
// export interface HealthLogEntry { ... }

