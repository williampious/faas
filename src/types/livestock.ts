
/**
 * @fileOverview TypeScript type definitions for the Livestock Production feature.
 */

import type { CostItem, CostCategory, PaymentSource } from './finance';

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

// --- Housing & Infrastructure Types ---
export const housingTypes = ['Barn', 'Free-Range Pen', 'Cages', 'Pond', 'Hutch', 'Coop', 'Stable', 'Other'] as const;
export type HousingType = typeof housingTypes[number];

export interface HousingRecord {
  id: string;
  farmId: string;
  name: string; 
  housingType: HousingType;
  capacity: number; 
  capacityUnit: string; 
  dateEstablished: string; // ISO "yyyy-MM-dd"
  ventilationDetails?: string;
  lightingDetails?: string;
  shelterDetails?: string; 
  biosecurityMeasures?: string; 
  predatorProtection?: string; 
  notes?: string;
  costItems: CostItem[]; 
  totalHousingCost: number;
  farmingYearId?: string;
  farmingSeasonId?: string;
  createdAt: any; // Firestore ServerTimestamp
  updatedAt: any; // Firestore ServerTimestamp
}

// --- Health Care & Biosecurity Types ---
export const healthActivityTypes = ['Vaccination', 'Deworming', 'Treatment', 'Health Check', 'Biosecurity Measure', 'Other'] as const;
export type HealthActivityType = typeof healthActivityTypes[number];

export interface HealthRecord {
  id: string;
  activityType: HealthActivityType;
  date: string; // ISO string "yyyy-MM-dd"
  animalsAffected: string; // e.g., "Broiler Batch 1", "All Goats"
  medicationOrTreatment?: string;
  dosage?: string;
  administeredBy?: string; // e.g., "Self", "Vet"
  notes?: string;
  costItems: CostItem[];
  totalActivityCost: number;
  farmingYearId?: string;
  farmingSeasonId?: string;
  createdAt: string; // ISO datetime string
  updatedAt: string; // ISO datetime string
}

// --- Breeding & Incubation Types ---
export const breedingActivityTypes = ['Natural Mating', 'Artificial Insemination', 'Embryo Transfer', 'Hatching', 'Other'] as const;
export type BreedingActivityType = typeof breedingActivityTypes[number];

export interface BreedingRecord {
  id: string;
  farmId: string;
  activityType: BreedingActivityType;
  maleIdentifier: string;
  femaleIdentifier: string;
  matingDate: string; // ISO "yyyy-MM-dd"
  expectedDueDate?: string; // ISO "yyyy-MM-dd"
  actualDueDate?: string; // ISO "yyyy-MM-dd"
  offspringCount?: number;
  notes?: string;
  costItems: CostItem[];
  totalBreedingCost: number;
  farmingYearId?: string;
  farmingSeasonId?: string;
  createdAt: any; // Firestore ServerTimestamp
  updatedAt: any; // Firestore ServerTimestamp
}

// --- Feeding & Nutrition Types ---
export const feedTypes = ['Starter Mash', 'Grower Pellets', 'Layer Mash', 'Broiler Finisher', 'Silage', 'Hay', 'Custom Mix', 'Other'] as const;
export type FeedType = typeof feedTypes[number];

export interface FeedingRecord {
  id: string;
  farmId: string;
  date: string; // ISO string "yyyy-MM-dd"
  animalsFed: string; // e.g., "Broiler House 1", "All Goats"
  feedType: FeedType | string; // Allow custom string for 'Other'
  quantity: number;
  quantityUnit: string; // e.g., 'kg', 'bags'
  notes?: string;
  costItems: CostItem[];
  totalCost: number;
  farmingYearId?: string;
  farmingSeasonId?: string;
  createdAt: any; // Firestore ServerTimestamp
  updatedAt: any; // Firestore ServerTimestamp
}

// Future types for production, etc. will go here
// e.g.,
// export interface ProductionRecord { ... }
