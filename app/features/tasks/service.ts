/**
 * Business logic and data transformation for task management.
 */

import type { ModuleKey } from '../modules/types'
import type { TaskWithCompletionRow } from './repository'

/**
 * Represents a farm task with its status for the viewing period.
 */
export interface TaskWithStatus {
  id: string
  farmId: string
  batchId: string | null
  moduleKey: string | null
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
  batchId?: string | null
  moduleKey?: string | null
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
      batchId: row.batchId,
      moduleKey: row.moduleKey,
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
 * Task definition for default tasks
 */
interface DefaultTask {
  title: string
  frequency: 'daily' | 'weekly' | 'monthly'
  description: string
}

/**
 * Farm-level default tasks (general maintenance, not species-specific)
 * These are created when a farm is created.
 */
export const FARM_DEFAULT_TASKS: Array<DefaultTask> = [
  // Daily
  {
    title: 'tasks:defaults.checkEquipment',
    frequency: 'daily',
    description: 'tasks:defaults.checkEquipmentDesc',
  },
  // Weekly
  {
    title: 'tasks:defaults.inventoryCheck',
    frequency: 'weekly',
    description: 'tasks:defaults.inventoryCheckDesc',
  },
  // Monthly
  {
    title: 'tasks:defaults.deepClean',
    frequency: 'monthly',
    description: 'tasks:defaults.deepCleanDesc',
  },
  {
    title: 'tasks:defaults.maintenanceReview',
    frequency: 'monthly',
    description: 'tasks:defaults.maintenanceReviewDesc',
  },
]

/**
 * Module-specific default tasks (created when a batch is created)
 * These are species-specific tasks that make sense for each livestock type.
 */
export const MODULE_DEFAULT_TASKS: Record<ModuleKey, Array<DefaultTask>> = {
  poultry: [
    // Daily
    {
      title: 'tasks:defaults.checkWater',
      frequency: 'daily',
      description: 'tasks:defaults.checkWaterDesc',
    },
    {
      title: 'tasks:defaults.feedMorning',
      frequency: 'daily',
      description: 'tasks:defaults.feedMorningDesc',
    },
    {
      title: 'tasks:defaults.collectEggs',
      frequency: 'daily',
      description: 'tasks:defaults.collectEggsDesc',
    },
    {
      title: 'tasks:defaults.checkSick',
      frequency: 'daily',
      description: 'tasks:defaults.checkSickDesc',
    },
    // Weekly
    {
      title: 'tasks:defaults.weighBirds',
      frequency: 'weekly',
      description: 'tasks:defaults.weighBirdsDesc',
    },
    {
      title: 'tasks:defaults.checkMedication',
      frequency: 'weekly',
      description: 'tasks:defaults.checkMedicationDesc',
    },
    {
      title: 'tasks:defaults.cleanFeeders',
      frequency: 'weekly',
      description: 'tasks:defaults.cleanFeedersDesc',
    },
    // Monthly
    {
      title: 'tasks:defaults.vaccinationReview',
      frequency: 'monthly',
      description: 'tasks:defaults.vaccinationReviewDesc',
    },
  ],

  aquaculture: [
    // Daily
    {
      title: 'tasks:defaults.checkWaterQuality',
      frequency: 'daily',
      description: 'tasks:defaults.checkWaterQualityDesc',
    },
    {
      title: 'tasks:defaults.feedFish',
      frequency: 'daily',
      description: 'tasks:defaults.feedFishDesc',
    },
    {
      title: 'tasks:defaults.checkAeration',
      frequency: 'daily',
      description: 'tasks:defaults.checkAerationDesc',
    },
    {
      title: 'tasks:defaults.checkMortality',
      frequency: 'daily',
      description: 'tasks:defaults.checkMortalityDesc',
    },
    // Weekly
    {
      title: 'tasks:defaults.sampleWeight',
      frequency: 'weekly',
      description: 'tasks:defaults.sampleWeightDesc',
    },
    {
      title: 'tasks:defaults.cleanFilters',
      frequency: 'weekly',
      description: 'tasks:defaults.cleanFiltersDesc',
    },
    // Monthly
    {
      title: 'tasks:defaults.pondMaintenance',
      frequency: 'monthly',
      description: 'tasks:defaults.pondMaintenanceDesc',
    },
  ],

  cattle: [
    // Daily
    {
      title: 'tasks:defaults.checkWaterTroughs',
      frequency: 'daily',
      description: 'tasks:defaults.checkWaterTroughsDesc',
    },
    {
      title: 'tasks:defaults.feedCattle',
      frequency: 'daily',
      description: 'tasks:defaults.feedCattleDesc',
    },
    {
      title: 'tasks:defaults.checkHerdHealth',
      frequency: 'daily',
      description: 'tasks:defaults.checkHerdHealthDesc',
    },
    // Weekly
    {
      title: 'tasks:defaults.weighCattle',
      frequency: 'weekly',
      description: 'tasks:defaults.weighCattleDesc',
    },
    {
      title: 'tasks:defaults.checkFencing',
      frequency: 'weekly',
      description: 'tasks:defaults.checkFencingDesc',
    },
    // Monthly
    {
      title: 'tasks:defaults.hoofCare',
      frequency: 'monthly',
      description: 'tasks:defaults.hoofCareDesc',
    },
    {
      title: 'tasks:defaults.dewormingCheck',
      frequency: 'monthly',
      description: 'tasks:defaults.dewormingCheckDesc',
    },
  ],

  goats: [
    // Daily
    {
      title: 'tasks:defaults.checkWaterGoats',
      frequency: 'daily',
      description: 'tasks:defaults.checkWaterGoatsDesc',
    },
    {
      title: 'tasks:defaults.feedGoats',
      frequency: 'daily',
      description: 'tasks:defaults.feedGoatsDesc',
    },
    {
      title: 'tasks:defaults.checkGoatHealth',
      frequency: 'daily',
      description: 'tasks:defaults.checkGoatHealthDesc',
    },
    // Weekly
    {
      title: 'tasks:defaults.weighGoats',
      frequency: 'weekly',
      description: 'tasks:defaults.weighGoatsDesc',
    },
    {
      title: 'tasks:defaults.checkPasture',
      frequency: 'weekly',
      description: 'tasks:defaults.checkPastureDesc',
    },
    // Monthly
    {
      title: 'tasks:defaults.hoofTrimming',
      frequency: 'monthly',
      description: 'tasks:defaults.hoofTrimmingDesc',
    },
  ],

  sheep: [
    // Daily
    {
      title: 'tasks:defaults.checkWaterSheep',
      frequency: 'daily',
      description: 'tasks:defaults.checkWaterSheepDesc',
    },
    {
      title: 'tasks:defaults.feedSheep',
      frequency: 'daily',
      description: 'tasks:defaults.feedSheepDesc',
    },
    {
      title: 'tasks:defaults.checkFlockHealth',
      frequency: 'daily',
      description: 'tasks:defaults.checkFlockHealthDesc',
    },
    // Weekly
    {
      title: 'tasks:defaults.weighSheep',
      frequency: 'weekly',
      description: 'tasks:defaults.weighSheepDesc',
    },
    {
      title: 'tasks:defaults.checkWool',
      frequency: 'weekly',
      description: 'tasks:defaults.checkWoolDesc',
    },
    // Monthly
    {
      title: 'tasks:defaults.footBath',
      frequency: 'monthly',
      description: 'tasks:defaults.footBathDesc',
    },
  ],

  bees: [
    // Daily - bees don't need daily checks typically
    // Weekly
    {
      title: 'tasks:defaults.hiveInspection',
      frequency: 'weekly',
      description: 'tasks:defaults.hiveInspectionDesc',
    },
    {
      title: 'tasks:defaults.checkQueenActivity',
      frequency: 'weekly',
      description: 'tasks:defaults.checkQueenActivityDesc',
    },
    // Monthly
    {
      title: 'tasks:defaults.pestControl',
      frequency: 'monthly',
      description: 'tasks:defaults.pestControlDesc',
    },
    {
      title: 'tasks:defaults.honeyHarvest',
      frequency: 'monthly',
      description: 'tasks:defaults.honeyHarvestDesc',
    },
  ],
}

/**
 * Legacy DEFAULT_TASKS for backward compatibility
 * @deprecated Use FARM_DEFAULT_TASKS and MODULE_DEFAULT_TASKS instead
 */
export const DEFAULT_TASKS: Array<DefaultTask> = [
  // Daily
  {
    title: 'tasks:defaults.checkWater',
    frequency: 'daily',
    description: 'tasks:defaults.checkWaterDesc',
  },
  {
    title: 'tasks:defaults.feedMorning',
    frequency: 'daily',
    description: 'tasks:defaults.feedMorningDesc',
  },
  {
    title: 'tasks:defaults.collectEggs',
    frequency: 'daily',
    description: 'tasks:defaults.collectEggsDesc',
  },
  {
    title: 'tasks:defaults.checkSick',
    frequency: 'daily',
    description: 'tasks:defaults.checkSickDesc',
  },
  // Weekly
  {
    title: 'tasks:defaults.weighBirds',
    frequency: 'weekly',
    description: 'tasks:defaults.weighBirdsDesc',
  },
  {
    title: 'tasks:defaults.checkMedication',
    frequency: 'weekly',
    description: 'tasks:defaults.checkMedicationDesc',
  },
  {
    title: 'tasks:defaults.cleanFeeders',
    frequency: 'weekly',
    description: 'tasks:defaults.cleanFeedersDesc',
  },
  // Monthly
  {
    title: 'tasks:defaults.vaccinationReview',
    frequency: 'monthly',
    description: 'tasks:defaults.vaccinationReviewDesc',
  },
  {
    title: 'tasks:defaults.deepClean',
    frequency: 'monthly',
    description: 'tasks:defaults.deepCleanDesc',
  },
]

/**
 * Get module key from livestock type
 */
export function getModuleKeyFromLivestockType(
  livestockType: string,
): ModuleKey | null {
  const mapping: Record<string, ModuleKey> = {
    poultry: 'poultry',
    fish: 'aquaculture',
    cattle: 'cattle',
    goats: 'goats',
    sheep: 'sheep',
    bees: 'bees',
  }
  return mapping[livestockType] ?? null
}
