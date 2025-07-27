
/**
 * @fileOverview TypeScript type definitions for the AEO Support & Communication Logs feature.
 */

export const interactionTypes = [
  'Phone Call',
  'Field Visit',
  'Meeting (Group)',
  'Meeting (Individual)',
  'SMS/WhatsApp',
  'Email',
  'Training Session',
  'Other'
] as const;
export type InteractionType = typeof interactionTypes[number];

export interface SupportLog {
  id: string; // Firestore document ID
  tenantId: string; // The farm the farmer belongs to, if applicable
  aeoId: string; // The AEO who created the log
  farmerId: string; // The farmer this log is about
  farmerName: string; // For easy display
  interactionDate: string; // ISO yyyy-MM-dd
  interactionType: InteractionType;
  summary: string; // A summary of the discussion/interaction
  adviceGiven?: string; // Specific advice provided
  farmerFeedback?: string; // Any feedback from the farmer
  followUpRequired: boolean;
  followUpDate?: string; // ISO yyyy-MM-dd
  followUpNotes?: string;
  createdAt: any; // Firestore ServerTimestamp
  updatedAt: any; // Firestore ServerTimestamp
}
