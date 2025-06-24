
/**
 * @fileOverview TypeScript type definitions for the Task Management feature.
 */

export type TaskStatus = 'To Do' | 'In Progress' | 'Done';
export const taskStatuses: TaskStatus[] = ['To Do', 'In Progress', 'Done'];

export type TaskPriority = 'High' | 'Medium' | 'Low';
export const taskPriorities: TaskPriority[] = ['High', 'Medium', 'Low'];

export interface Task {
  id: string;
  farmId: string;
  name: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignedArea: string;
  description?: string;
  project?: string;
  owner?: string; // Assignee name
  startDate?: string; // ISO date string
  dueDate?: string; // ISO date string
  createdAt: any; // Firestore ServerTimestamp
  updatedAt: any; // Firestore ServerTimestamp
}
