
/**
 * @fileOverview TypeScript type definitions for the AEO Knowledge Base feature.
 */

export const knowledgeArticleCategories = [
  'Crop Management',
  'Pest & Disease Control',
  'Soil Health & Fertilization',
  'Harvesting & Post-Harvest',
  'Livestock Management',
  'Farm Finance & Business',
  'Technology & Innovation',
  'Other'
] as const;
export type KnowledgeArticleCategory = typeof knowledgeArticleCategories[number];

export interface KnowledgeArticle {
  id: string; // Firestore document ID
  authorId: string; // The AEO's userId
  authorName: string; // The AEO's name
  title: string;
  category: KnowledgeArticleCategory;
  content: string; // Markdown content or simple text
  tags?: string[]; // Optional tags for searchability
  createdAt: any; // Firestore ServerTimestamp
  updatedAt: any; // Firestore ServerTimestamp
}
