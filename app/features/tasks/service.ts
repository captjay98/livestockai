/**
 * Business logic and data transformation for task management.
 */

import type { TaskWithCompletionRow } from './repository'

/**
 * Represents a farm task with its status for the viewing period.
 */
export interface TaskWithStatus {
  id: string
  farmId: string
  title: string
  description: string | null
  frequency: 'daily' | 'weekly' | 'monthly'
  isDefault: boolean
  createdAt: Date
  completed: boolean
  completionId: string | null
}

/**
 * Input for creating a task
 */
export interface CreateTaskInput {
  title: string
  description?: string | null
  frequency: 'daily' | 'weekly' | 'monthly'
}

/**
 * Get the logical start of a period based on frequency.
 */
export function getPeriodStart(
  date: Date,
  frequency: 'daily' | 'weekly' | 'monthly',
): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)

  if (frequency === 'daily') {
    return d
  } else if (frequency === 'weekly') {
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Monday as start
    d.setDate(diff)
    return d
  } else {
    // monthly
    d.setDate(1)
    return d
  }
}

/**
 * Validate task creation inputs.
 */
export function validateTaskData(data: CreateTaskInput): string | null {
  if (!data.title || data.title.trim().length < 3) {
    return 'Title must be at least 3 characters long'
  }
  if (!['daily', 'weekly', 'monthly'].includes(data.frequency)) {
    return 'Invalid frequency'
  }
  return null
}

/**
 * Transform raw database rows into UI-ready TaskWithStatus objects.
 */
export function calculateCompletionStatus(
  rows: Array<TaskWithCompletionRow>,
  now: Date,
): Array<TaskWithStatus> {
  return rows.map((row) => {
    const periodStart = getPeriodStart(
      now,
      row.frequency as 'daily' | 'weekly' | 'monthly',
    )

    // Check if the completion record in the join matches the current period
    const completed =
      row.completionId !== null &&
      row.periodStart !== null &&
      new Date(row.periodStart).getTime() === periodStart.getTime()

    return {
      id: row.id,
      farmId: row.farmId,
      title: row.title,
      description: row.description,
      frequency: row.frequency as 'daily' | 'weekly' | 'monthly',
      isDefault: row.isDefault,
      createdAt: row.createdAt,
      completed,
      completionId: completed ? row.completionId : null,
    }
  })
}

/**
 * Default tasks for new farms.
 */
export const DEFAULT_TASKS: Array<{
  title: string
  frequency: 'daily' | 'weekly' | 'monthly'
  description: string
}> = [
  // Daily
  {
    title: 'Check Water Lines',
    frequency: 'daily',
    description: 'Ensure water is flowing properly',
  },
  {
    title: 'Feed Morning',
    frequency: 'daily',
    description: 'Distribute morning feed ration',
  },
  {
    title: 'Collect Eggs',
    frequency: 'daily',
    description: 'Collect and count eggs from layers',
  },
  {
    title: 'Check for Sick Birds',
    frequency: 'daily',
    description: 'Visual inspection for symptoms',
  },
  // Weekly
  {
    title: 'Weigh Sample Birds',
    frequency: 'weekly',
    description: 'Record weight samples for FCR tracking',
  },
  {
    title: 'Check Medicine Inventory',
    frequency: 'weekly',
    description: 'Verify stock levels and expiry dates',
  },
  {
    title: 'Clean Feeders',
    frequency: 'weekly',
    description: 'Remove old feed and clean equipment',
  },
  // Monthly
  {
    title: 'Vaccination Review',
    frequency: 'monthly',
    description: 'Review upcoming vaccination schedule',
  },
  {
    title: 'Deep Clean Coop',
    frequency: 'monthly',
    description: 'Full disinfection and cleaning',
  },
]
