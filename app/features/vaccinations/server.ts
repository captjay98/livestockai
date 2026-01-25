import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { mapSortColumnToDbColumn } from './service'
import type { PaginatedResult } from '~/lib/types'
import type {
  TreatmentInsert,
  TreatmentUpdate,
  VaccinationFilters,
  VaccinationInsert,
  VaccinationUpdate,
} from './repository'
import { AppError } from '~/lib/errors'

export type { PaginatedResult }

/**
 * Represents a historical or upcoming health intervention for a batch.
 */
export interface HealthRecord {
  /** Unique identifier for the record */
  id: string
  /** ID of the livestock batch */
  batchId: string
  /** Species of the batch for display purposes */
  batchSpecies: string | null
  /** Discriminator between preventative and curative care */
  type: 'vaccination' | 'treatment'
  /** Name of the vaccine or medication */
  name: string
  /** Date the intervention was performed */
  date: Date
  /** Amount and unit of administration (e.g., "0.5ml") */
  dosage: string
  /** Expected date for the next dose (primarily for vaccinations) */
  nextDueDate: Date | null
  /** Mandatory wait time before slaughter/sale after medication */
  withdrawalDays: number | null
  /** Diagnostic or administrative details */
  notes: string | null
}

/**
 * Input for recording a preventative vaccination event.
 */
export interface CreateVaccinationInput {
  /** ID of the target batch */
  batchId: string
  /** Name of the vaccine used */
  vaccineName: string
  /** Date of administration */
  dateAdministered: Date
  /** Dose amount administered */
  dosage: string
  /** Optional next scheduled dose */
  nextDueDate?: Date | null
  /** Optional administration notes */
  notes?: string | null
}

/**
 * Input for recording a curative medical treatment.
 */
export interface CreateTreatmentInput {
  /** ID of the target batch */
  batchId: string
  /** Name of the medication used */
  medicationName: string
  /** Symptom or diagnosis necessitating treatment */
  reason: string
  /** Start date of treatment */
  date: Date
  /** Dose amount administered */
  dosage: string
  /** Wait period required after final dose */
  withdrawalDays: number
  /** Optional treatment details */
  notes?: string | null
}

/**
 * Pagination and filtering options for health records.
 */
export interface PaginatedQuery {
  /** Page number (1-based) */
  page?: number
  /** Items per page */
  pageSize?: number
  /** Field to sort by */
  sortBy?: string
  /** Sort direction */
  sortOrder?: 'asc' | 'desc'
  /** Search term for filtering by name or species */
  search?: string
  /** Filter by farm ID */
  farmId?: string
  /** Filter by batch ID */
  batchId?: string
  /** Filter by record type */
  type?: 'all' | 'vaccination' | 'treatment'
}

/**
 * Input for updating a vaccination record.
 */
export interface UpdateVaccinationInput {
  vaccineName?: string
  dateAdministered?: Date
  dosage?: string
  nextDueDate?: Date | null
  notes?: string | null
}

/**
 * Input for updating a treatment record.
 */
export interface UpdateTreatmentInput {
  medicationName?: string
  reason?: string
  date?: Date
  dosage?: string
  withdrawalDays?: number
  notes?: string | null
}

/**
 * Records a new vaccination event for a batch.
 *
 * @param userId - ID of the user performing the action
 * @param farmId - ID of the farm owning the batch
 * @param input - Vaccination details including next due date
 * @returns Promise resolving to the new vaccination ID
 */
export async function createVaccination(
  userId: string,
  farmId: string,
  input: CreateVaccinationInput,
): Promise<string> {
  const { getDb } = await import('~/lib/db'); const db = await getDb()
  const { verifyFarmAccess } = await import('~/features/auth/utils')
  const { validateVaccinationData } =
    await import('~/features/vaccinations/service')
  const { insertVaccination, getBatchById } =
    await import('~/features/vaccinations/repository')

  try {
    await verifyFarmAccess(userId, farmId)

    // Validate business logic
    const validationError = validateVaccinationData(input, input.batchId)
    if (validationError) {
      throw new AppError('VALIDATION_ERROR', {
        metadata: { error: validationError },
      })
    }

    // Check batch exists and belongs to farm
    const batch = await getBatchById(db, input.batchId)
    if (!batch || batch.farmId !== farmId) {
      throw new AppError('BATCH_NOT_FOUND', {
        metadata: { batchId: input.batchId, farmId },
      })
    }

    // Insert vaccination
    const insertData: VaccinationInsert = {
      batchId: input.batchId,
      vaccineName: input.vaccineName,
      dateAdministered: input.dateAdministered,
      dosage: input.dosage,
      nextDueDate: input.nextDueDate || null,
      notes: input.notes || null,
    }

    return await insertVaccination(db, insertData)
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError('DATABASE_ERROR', {
      message: 'Failed to create vaccination',
      cause: error,
    })
  }
}

/**
 * Server function to create a vaccination record.
 */
export const createVaccinationFn = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: { farmId: string; data: CreateVaccinationInput }) => data,
  )
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/features/auth/server-middleware')
    const session = await requireAuth()
    return createVaccination(session.user.id, data.farmId, data.data)
  })

/**
 * Records a medical treatment for a batch.
 *
 * @param userId - ID of the user performing the action
 * @param farmId - ID of the farm owning the batch
 * @param input - Treatment details including withdrawal period
 * @returns Promise resolving to the new treatment ID
 */
export async function createTreatment(
  userId: string,
  farmId: string,
  input: CreateTreatmentInput,
): Promise<string> {
  const { getDb } = await import('~/lib/db'); const db = await getDb()
  const { verifyFarmAccess } = await import('~/features/auth/utils')
  const { validateTreatmentData } =
    await import('~/features/vaccinations/service')
  const { insertTreatment, getBatchById } =
    await import('~/features/vaccinations/repository')

  try {
    await verifyFarmAccess(userId, farmId)

    // Validate business logic
    const validationError = validateTreatmentData(input, input.batchId)
    if (validationError) {
      throw new AppError('VALIDATION_ERROR', {
        metadata: { error: validationError },
      })
    }

    // Check batch exists and belongs to farm
    const batch = await getBatchById(db, input.batchId)
    if (!batch || batch.farmId !== farmId) {
      throw new AppError('BATCH_NOT_FOUND', {
        metadata: { batchId: input.batchId, farmId },
      })
    }

    // Insert treatment
    const insertData: TreatmentInsert = {
      batchId: input.batchId,
      medicationName: input.medicationName,
      reason: input.reason,
      date: input.date,
      dosage: input.dosage,
      withdrawalDays: input.withdrawalDays,
      notes: input.notes || null,
    }

    return await insertTreatment(db, insertData)
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError('DATABASE_ERROR', {
      message: 'Failed to create treatment',
      cause: error,
    })
  }
}

/**
 * Server function to create a treatment record.
 */
export const createTreatmentFn = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: { farmId: string; data: CreateTreatmentInput }) => data,
  )
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/features/auth/server-middleware')
    const session = await requireAuth()
    return createTreatment(session.user.id, data.farmId, data.data)
  })

/**
 * Retrieve paginated health records (vaccinations and treatments) with filtering and sorting.
 *
 * @param userId - ID of the user
 * @param query - Pagination and filter parameters
 * @returns Promise resolving to a paginated list of health records
 */
export async function getHealthRecordsPaginated(
  userId: string,
  query: PaginatedQuery = {},
) {
  const { getUserFarms } = await import('~/features/auth/utils')
  const { getHealthRecordsPaginated: getRecordsPaginated } =
    await import('~/features/vaccinations/repository')

  try {
    let targetFarmIds: Array<string> = []
    if (query.farmId) {
      targetFarmIds = [query.farmId]
    } else {
      targetFarmIds = await getUserFarms(userId)
    }

    const filters: VaccinationFilters = {
      farmIds: targetFarmIds,
      batchId: query.batchId,
      search: query.search,
      type: query.type === 'all' ? undefined : query.type,
    }

    const page = query.page || 1
    const pageSize = query.pageSize || 10
    const sortBy = mapSortColumnToDbColumn(query.sortBy || 'date')
    const sortOrder = query.sortOrder || 'desc'

    return await getRecordsPaginated(
      await import('~/lib/db').then((m) => m.db),
      filters,
      page,
      pageSize,
      sortBy,
      sortOrder,
    )
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError('DATABASE_ERROR', {
      message: 'Failed to fetch health records',
      cause: error,
    })
  }
}

/**
 * Server function to get paginated health records.
 */
export const getHealthRecordsPaginatedFn = createServerFn({ method: 'GET' })
  .inputValidator(
    z.object({
      page: z.number().int().positive().optional(),
      pageSize: z.number().int().positive().max(100).optional(),
      sortBy: z.string().optional(),
      sortOrder: z.enum(['asc', 'desc']).optional(),
      search: z.string().optional(),
      farmId: z.string().uuid().optional(),
      batchId: z.string().uuid().optional(),
      type: z.enum(['vaccination', 'treatment']).optional(),
    }),
  )
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/features/auth/server-middleware')
    const session = await requireAuth()
    return getHealthRecordsPaginated(session.user.id, data)
  })

/**
 * retrieves upcoming vaccinations (due within X days) for active batches.
 *
 * @param userId - ID of the user
 * @param farmId - Optional farm filter
 * @param daysAhead - Number of days to look ahead (default: 7)
 * @returns Promise resolving to list of upcoming vaccinations
 */
export async function getUpcomingVaccinations(
  userId: string,
  farmId?: string,
  daysAhead: number = 7,
) {
  const { verifyFarmAccess, getUserFarms } =
    await import('~/features/auth/utils')
  const { getUpcomingVaccinations: getUpcoming } =
    await import('~/features/vaccinations/repository')

  try {
    let targetFarmIds: Array<string> = []
    if (farmId) {
      await verifyFarmAccess(userId, farmId)
      targetFarmIds = [farmId]
    } else {
      targetFarmIds = await getUserFarms(userId)
      if (targetFarmIds.length === 0) return []
    }

    const { getDb } = await import('~/lib/db'); const db = await getDb()
    return await getUpcoming(db, targetFarmIds, daysAhead)
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError('DATABASE_ERROR', {
      message: 'Failed to fetch upcoming vaccinations',
      cause: error,
    })
  }
}

/**
 * Retrieves overdue vaccination events.
 *
 * @param userId - ID of the user
 * @param farmId - Optional farm filter
 * @returns Promise resolving to list of overdue vaccinations
 */
export async function getOverdueVaccinations(userId: string, farmId?: string) {
  const { verifyFarmAccess, getUserFarms } =
    await import('~/features/auth/utils')
  const { getOverdueVaccinations: getOverdue } =
    await import('~/features/vaccinations/repository')

  try {
    let targetFarmIds: Array<string> = []
    if (farmId) {
      await verifyFarmAccess(userId, farmId)
      targetFarmIds = [farmId]
    } else {
      targetFarmIds = await getUserFarms(userId)
      if (targetFarmIds.length === 0) return []
    }

    const { getDb } = await import('~/lib/db'); const db = await getDb()
    return await getOverdue(db, targetFarmIds)
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError('DATABASE_ERROR', {
      message: 'Failed to fetch overdue vaccinations',
      cause: error,
    })
  }
}

/**
 * Gets a summary of vaccination alerts (upcoming and overdue).
 *
 * @param userId - ID of the user
 * @param farmId - Optional farm filter
 * @returns Promise with upcoming, overdue, and total alert count
 */
export async function getVaccinationAlerts(userId: string, farmId?: string) {
  const [upcoming, overdue] = await Promise.all([
    getUpcomingVaccinations(userId, farmId),
    getOverdueVaccinations(userId, farmId),
  ])

  return {
    upcoming,
    overdue,
    totalAlerts: upcoming.length + overdue.length,
  }
}

/**
 * Update a specific vaccination record.
 *
 * @param userId - ID of the user
 * @param recordId - ID of the record to update
 * @param input - Fields to update
 */
export async function updateVaccination(
  userId: string,
  recordId: string,
  input: UpdateVaccinationInput,
): Promise<void> {
  const { getDb } = await import('~/lib/db'); const db = await getDb()
  const { checkFarmAccess } = await import('../auth/utils')
  const { validateVaccinationUpdateData } =
    await import('~/features/vaccinations/service')
  const { getVaccinationById, updateVaccination: updateRecord } =
    await import('~/features/vaccinations/repository')

  try {
    // Validate business logic
    const validationError = validateVaccinationUpdateData(input)
    if (validationError) {
      throw new AppError('VALIDATION_ERROR', {
        metadata: { error: validationError },
      })
    }

    const existing = await getVaccinationById(db, recordId)

    if (!existing) {
      throw new AppError('VACCINATION_NOT_FOUND', {
        metadata: { recordId },
      })
    }

    const hasAccess = await checkFarmAccess(userId, existing.farmId)
    if (!hasAccess) {
      throw new AppError('ACCESS_DENIED', {
        metadata: { farmId: existing.farmId },
      })
    }

    const updateData: VaccinationUpdate = {}
    if (input.vaccineName !== undefined) {
      updateData.vaccineName = input.vaccineName
    }
    if (input.dateAdministered !== undefined) {
      updateData.dateAdministered = input.dateAdministered
    }
    if (input.dosage !== undefined) {
      updateData.dosage = input.dosage
    }
    if (input.nextDueDate !== undefined) {
      updateData.nextDueDate = input.nextDueDate
    }
    if (input.notes !== undefined) {
      updateData.notes = input.notes
    }

    await updateRecord(db, recordId, updateData)
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError('DATABASE_ERROR', {
      message: 'Failed to update vaccination',
      cause: error,
    })
  }
}

/**
 * Server function to update a vaccination record.
 */
export const updateVaccinationFn = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: { recordId: string; data: UpdateVaccinationInput }) => data,
  )
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/features/auth/server-middleware')
    const session = await requireAuth()
    return updateVaccination(session.user.id, data.recordId, data.data)
  })

/**
 * Permanently delete a vaccination record.
 *
 * @param userId - ID of the user
 * @param recordId - ID of the record needed
 */
export async function deleteVaccination(
  userId: string,
  recordId: string,
): Promise<void> {
  const { getDb } = await import('~/lib/db'); const db = await getDb()
  const { checkFarmAccess } = await import('../auth/utils')
  const { getVaccinationById, deleteVaccination: deleteRecord } =
    await import('~/features/vaccinations/repository')

  try {
    const existing = await getVaccinationById(db, recordId)

    if (!existing) {
      throw new AppError('VACCINATION_NOT_FOUND', {
        metadata: { recordId },
      })
    }

    const hasAccess = await checkFarmAccess(userId, existing.farmId)
    if (!hasAccess) {
      throw new AppError('ACCESS_DENIED', {
        metadata: { farmId: existing.farmId },
      })
    }

    await deleteRecord(db, recordId)
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError('DATABASE_ERROR', {
      message: 'Failed to delete vaccination',
      cause: error,
    })
  }
}

/**
 * Server function to delete a vaccination record.
 */
export const deleteVaccinationFn = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ recordId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/features/auth/server-middleware')
    const session = await requireAuth()
    return deleteVaccination(session.user.id, data.recordId)
  })

/**
 * Update a specific treatment record.
 *
 * @param userId - ID of the user
 * @param recordId - ID of the record to update
 * @param input - Fields to update
 */
export async function updateTreatment(
  userId: string,
  recordId: string,
  input: UpdateTreatmentInput,
): Promise<void> {
  const { getDb } = await import('~/lib/db'); const db = await getDb()
  const { checkFarmAccess } = await import('../auth/utils')
  const { validateTreatmentUpdateData } =
    await import('~/features/vaccinations/service')
  const { getTreatmentById, updateTreatment: updateRecord } =
    await import('~/features/vaccinations/repository')

  try {
    // Validate business logic
    const validationError = validateTreatmentUpdateData(input)
    if (validationError) {
      throw new AppError('VALIDATION_ERROR', {
        metadata: { error: validationError },
      })
    }

    const existing = await getTreatmentById(db, recordId)

    if (!existing) {
      throw new AppError('TREATMENT_NOT_FOUND', {
        metadata: { recordId },
      })
    }

    const hasAccess = await checkFarmAccess(userId, existing.farmId)
    if (!hasAccess) {
      throw new AppError('ACCESS_DENIED', {
        metadata: { farmId: existing.farmId },
      })
    }

    const updateData: TreatmentUpdate = {}
    if (input.medicationName !== undefined) {
      updateData.medicationName = input.medicationName
    }
    if (input.reason !== undefined) {
      updateData.reason = input.reason
    }
    if (input.date !== undefined) {
      updateData.date = input.date
    }
    if (input.dosage !== undefined) {
      updateData.dosage = input.dosage
    }
    if (input.withdrawalDays !== undefined) {
      updateData.withdrawalDays = input.withdrawalDays
    }
    if (input.notes !== undefined) {
      updateData.notes = input.notes
    }

    await updateRecord(db, recordId, updateData)
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError('DATABASE_ERROR', {
      message: 'Failed to update treatment',
      cause: error,
    })
  }
}

/**
 * Server function to update a treatment record.
 */
export const updateTreatmentFn = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: { recordId: string; data: UpdateTreatmentInput }) => data,
  )
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/features/auth/server-middleware')
    const session = await requireAuth()
    return updateTreatment(session.user.id, data.recordId, data.data)
  })

/**
 * Permanently delete a treatment record.
 *
 * @param userId - ID of the user
 * @param recordId - ID of the record to delete
 */
export async function deleteTreatment(
  userId: string,
  recordId: string,
): Promise<void> {
  const { getDb } = await import('~/lib/db'); const db = await getDb()
  const { checkFarmAccess } = await import('../auth/utils')
  const { getTreatmentById, deleteTreatment: deleteRecord } =
    await import('~/features/vaccinations/repository')

  try {
    const existing = await getTreatmentById(db, recordId)

    if (!existing) {
      throw new AppError('TREATMENT_NOT_FOUND', {
        metadata: { recordId },
      })
    }

    const hasAccess = await checkFarmAccess(userId, existing.farmId)
    if (!hasAccess) {
      throw new AppError('ACCESS_DENIED', {
        metadata: { farmId: existing.farmId },
      })
    }

    await deleteRecord(db, recordId)
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError('DATABASE_ERROR', {
      message: 'Failed to delete treatment',
      cause: error,
    })
  }
}

/**
 * Server function to delete a treatment record.
 */
export const deleteTreatmentFn = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ recordId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/features/auth/server-middleware')
    const session = await requireAuth()
    return deleteTreatment(session.user.id, data.recordId)
  })

/**
 * Server function to get health data for a farm including records, alerts, and batches.
 */
export const getHealthDataForFarm = createServerFn({ method: 'GET' })
  .inputValidator(
    (data: {
      farmId?: string | null
      page?: number
      pageSize?: number
      sortBy?: string
      sortOrder?: 'asc' | 'desc'
      search?: string
      type?: 'all' | 'vaccination' | 'treatment'
    }) => data,
  )
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/features/auth/server-middleware')
    const { getBatches } = await import('~/features/batches/server')

    const session = await requireAuth()
    const farmId = data.farmId || undefined

    const [paginatedRecords, alerts, allBatches] = await Promise.all([
      getHealthRecordsPaginated(session.user.id, {
        farmId,
        page: data.page,
        pageSize: data.pageSize,
        sortBy: data.sortBy,
        sortOrder: data.sortOrder,
        search: data.search,
        type: data.type,
      }),
      getVaccinationAlerts(session.user.id, farmId),
      getBatches(session.user.id, farmId),
    ])

    return {
      paginatedRecords,
      alerts,
      batches: allBatches.filter((b) => b.status === 'active'),
    }
  })
