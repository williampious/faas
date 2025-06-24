
/**
 * @fileOverview TypeScript type definitions for the Farm Calendar feature.
 */

export interface CalendarEvent {
  id: string;
  farmId: string;
  date: string; // Store date as ISO string "yyyy-MM-dd"
  title: string;
  description?: string;
  createdAt: any; // Firestore ServerTimestamp
  updatedAt: any; // Firestore ServerTimestamp
}
