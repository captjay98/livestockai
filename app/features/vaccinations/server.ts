import { createServerFn } from '@tanstack/react-start'
import type { PaginatedResult } from '~/lib/types'

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
  const { db } = await import('~/lib/db')
  const { verifyFarmAccess } = await import('~/features/auth/utils')

  await verifyFarmAccess(userId, farmId)

  const batch = await db
    .selectFrom('batches')
    .select(['id', 'farmId'])
    .where('id', '=', input.batchId)
    .where('farmId', '=', farmId)
    .executeTakeFirst()

  if (!batch) {
    throw new Error('Batch not found or does not belong to this farm')
  }

  const result = await db
    .insertInto('vaccinations')
    .values({
      batchId: input.batchId,
      vaccineName: input.vaccineName,
      dateAdministered: input.dateAdministered,
      dosage: input.dosage,
      nextDueDate: input.nextDueDate || null,
      notes: input.notes || null,
    })
    .returning('id')
    .executeTakeFirstOrThrow()

  return result.id
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
  const { db } = await import('~/lib/db')
  const { verifyFarmAccess } = await import('~/features/auth/utils')

  await verifyFarmAccess(userId, farmId)

  const batch = await db
    .selectFrom('batches')
    .select(['id', 'farmId'])
    .where('id', '=', input.batchId)
    .where('farmId', '=', farmId)
    .executeTakeFirst()

  if (!batch) {
    throw new Error('Batch not found or does not belong to this farm')
  }

  const result = await db
    .insertInto('treatments')
    .values({
      batchId: input.batchId,
      medicationName: input.medicationName,
      reason: input.reason,
      date: input.date,
      dosage: input.dosage,
      withdrawalDays: input.withdrawalDays,
      notes: input.notes || null,
    })
    .returning('id')
    .executeTakeFirstOrThrow()

  return result.id
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
  const { db } = await import('~/lib/db')
  const { getUserFarms } = await import('~/features/auth/utils')
  const { sql } = await import('kysely')

  let targetFarmIds: Array<string> = []
  if (query.farmId) {
    targetFarmIds = [query.farmId]
  } else {
    targetFarmIds = await getUserFarms(userId)
  }

  // Construct Vaccines Query
  let vaccinesQuery = db
    .selectFrom('vaccinations')
    .innerJoin('batches', 'batches.id', 'vaccinations.batchId')
    .innerJoin('farms', 'farms.id', 'batches.farmId')
    .select([
      'vaccinations.id',
      'vaccinations.batchId',
      sql<string>`'vaccination'`.as('type'),
      'vaccinations.vaccineName as name',
      'vaccinations.dateAdministered as date',
      'vaccinations.dosage',
      'vaccinations.notes',
      sql<string>`NULL`.as('reason'),
      sql<number>`NULL`.as('withdrawalDays'),
      'vaccinations.nextDueDate',
      'batches.species',
      'batches.livestockType',
      'farms.name as farmName',
      'batches.farmId',
    ])
    .where('batches.farmId', 'in', targetFarmIds)

  // Construct Treatments Query
  let treatmentsQuery = db
    .selectFrom('treatments')
    .innerJoin('batches', 'batches.id', 'treatments.batchId')
    .innerJoin('farms', 'farms.id', 'batches.farmId')
    .select([
      'treatments.id',
      'treatments.batchId',
      sql<string>`'treatment'`.as('type'),
      'treatments.medicationName as name',
      'treatments.date',
      'treatments.dosage',
      'treatments.notes',
      'treatments.reason',
      'treatments.withdrawalDays',
      sql<Date>`NULL`.as('nextDueDate'),
      'batches.species',
      'batches.livestockType',
      'farms.name as farmName',
      'batches.farmId',
    ])
    .where('batches.farmId', 'in', targetFarmIds)

  // Apply filters to subqueries if precise, but for Union we usually wrap or Apply to both
  if (query.search) {
    const searchLower = `%${query.search.toLowerCase()}%`
    vaccinesQuery = vaccinesQuery.where((eb) =>
      eb.or([
        eb('vaccinations.vaccineName', 'ilike', searchLower),
        eb('batches.species', 'ilike', searchLower),
      ]),
    )
    treatmentsQuery = treatmentsQuery.where((eb) =>
      eb.or([
        eb('treatments.medicationName', 'ilike', searchLower),
        eb('treatments.reason', 'ilike', searchLower),
        eb('batches.species', 'ilike', searchLower),
      ]),
    )
  }

  if (query.batchId) {
    vaccinesQuery = vaccinesQuery.where(
      'vaccinations.batchId',
      '=',
      query.batchId,
    )
    treatmentsQuery = treatmentsQuery.where(
      'treatments.batchId',
      '=',
      query.batchId,
    )
  }

  let finalQuery
  if (query.type === 'vaccination') {
    finalQuery = vaccinesQuery
  } else if (query.type === 'treatment') {
    finalQuery = treatmentsQuery
  } else {
    finalQuery = vaccinesQuery.unionAll(treatmentsQuery)
  }

  // Get total count
  const countResult = await db
    .with('union_table', () => finalQuery)
    .selectFrom('union_table')
    .select(sql<number>`count(*)`.as('count'))
    .executeTakeFirst()

  const total = Number(countResult?.count || 0)
  const page = query.page || 1
  const pageSize = query.pageSize || 10
  const totalPages = Math.ceil(total / pageSize)
  const offset = (page - 1) * pageSize

  // Get Data
  let dataQuery = db
    .with('union_table', () => finalQuery)
    .selectFrom('union_table')
    .selectAll()
    .limit(pageSize)
    .offset(offset)

  // Sorting
  if (query.sortBy) {
    const sortOrder = query.sortOrder || 'desc'
    dataQuery = dataQuery.orderBy(sql.raw(query.sortBy), sortOrder)
  } else {
    dataQuery = dataQuery.orderBy(sql.raw('date'), 'desc')
  }

  const data = await dataQuery.execute()

  return {
    data,
    total,
    page,
    pageSize,
    totalPages,
  }
}

/**
 * Server function to get paginated health records.
 */
export const getHealthRecordsPaginatedFn = createServerFn({ method: 'GET' })
  .inputValidator((data: PaginatedQuery) => data)
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
  const { db } = await import('~/lib/db')
  const { verifyFarmAccess, getUserFarms } =
    await import('~/features/auth/utils')

  let targetFarmIds: Array<string> = []
  if (farmId) {
    await verifyFarmAccess(userId, farmId)
    targetFarmIds = [farmId]
  } else {
    targetFarmIds = await getUserFarms(userId)
    if (targetFarmIds.length === 0) return []
  }

  const today = new Date()
  const futureDate = new Date()
  futureDate.setDate(today.getDate() + daysAhead)

  return db
    .selectFrom('vaccinations')
    .innerJoin('batches', 'batches.id', 'vaccinations.batchId')
    .innerJoin('farms', 'farms.id', 'batches.farmId')
    .select([
      'vaccinations.id',
      'vaccinations.batchId',
      'vaccinations.vaccineName',
      'vaccinations.nextDueDate',
      'batches.species',
      'batches.livestockType',
      'farms.name as farmName',
    ])
    .where('batches.farmId', 'in', targetFarmIds)
    .where('batches.status', '=', 'active')
    .where('vaccinations.nextDueDate', '>=', today)
    .where('vaccinations.nextDueDate', '<=', futureDate)
    .orderBy('vaccinations.nextDueDate', 'asc')
    .execute()
}

/**
 * Retrieves overdue vaccination events.
 *
 * @param userId - ID of the user
 * @param farmId - Optional farm filter
 * @returns Promise resolving to list of overdue vaccinations
 */
export async function getOverdueVaccinations(userId: string, farmId?: string) {
  const { db } = await import('~/lib/db')
  const { verifyFarmAccess, getUserFarms } =
    await import('~/features/auth/utils')

  let targetFarmIds: Array<string> = []
  if (farmId) {
    await verifyFarmAccess(userId, farmId)
    targetFarmIds = [farmId]
  } else {
    targetFarmIds = await getUserFarms(userId)
    if (targetFarmIds.length === 0) return []
  }

  const today = new Date()

  return db
    .selectFrom('vaccinations')
    .innerJoin('batches', 'batches.id', 'vaccinations.batchId')
    .innerJoin('farms', 'farms.id', 'batches.farmId')
    .select([
      'vaccinations.id',
      'vaccinations.batchId',
      'vaccinations.vaccineName',
      'vaccinations.nextDueDate',
      'batches.species',
      'batches.livestockType',
      'farms.name as farmName',
    ])
    .where('batches.farmId', 'in', targetFarmIds)
    .where('batches.status', '=', 'active')
    .where('vaccinations.nextDueDate', '<', today)
    .orderBy('vaccinations.nextDueDate', 'asc')
    .execute()
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
  const { db } = await import('~/lib/db')
  const { checkFarmAccess } = await import('../auth/utils')

  const existing = await db
    .selectFrom('vaccinations')
    .innerJoin('batches', 'batches.id', 'vaccinations.batchId')
    .select(['vaccinations.id', 'batches.farmId'])
    .where('vaccinations.id', '=', recordId)
    .executeTakeFirst()

  if (!existing) throw new Error('Record not found')

  const hasAccess = await checkFarmAccess(userId, existing.farmId)
  if (!hasAccess) throw new Error('Access denied')

  await db
    .updateTable('vaccinations')
    .set({
      ...(input.vaccineName !== undefined && {
        vaccineName: input.vaccineName,
      }),
      ...(input.dateAdministered !== undefined && {
        dateAdministered: input.dateAdministered,
      }),
      ...(input.dosage !== undefined && { dosage: input.dosage }),
      ...(input.nextDueDate !== undefined && {
        nextDueDate: input.nextDueDate,
      }),
      ...(input.notes !== undefined && { notes: input.notes }),
    })
    .where('id', '=', recordId)
    .execute()
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
  const { db } = await import('~/lib/db')
  const { checkFarmAccess } = await import('../auth/utils')

  const existing = await db
    .selectFrom('vaccinations')
    .innerJoin('batches', 'batches.id', 'vaccinations.batchId')
    .select(['vaccinations.id', 'batches.farmId'])
    .where('vaccinations.id', '=', recordId)
    .executeTakeFirst()

  if (!existing) throw new Error('Record not found')

  const hasAccess = await checkFarmAccess(userId, existing.farmId)
  if (!hasAccess) throw new Error('Access denied')

  await db.deleteFrom('vaccinations').where('id', '=', recordId).execute()
}

/**
 * Server function to delete a vaccination record.
 */
export const deleteVaccinationFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { recordId: string }) => data)
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
  const { db } = await import('~/lib/db')
  const { checkFarmAccess } = await import('../auth/utils')

  const existing = await db
    .selectFrom('treatments')
    .innerJoin('batches', 'batches.id', 'treatments.batchId')
    .select(['treatments.id', 'batches.farmId'])
    .where('treatments.id', '=', recordId)
    .executeTakeFirst()

  if (!existing) throw new Error('Record not found')

  const hasAccess = await checkFarmAccess(userId, existing.farmId)
  if (!hasAccess) throw new Error('Access denied')

  await db
    .updateTable('treatments')
    .set({
      ...(input.medicationName !== undefined && {
        medicationName: input.medicationName,
      }),
      ...(input.reason !== undefined && { reason: input.reason }),
      ...(input.date !== undefined && { date: input.date }),
      ...(input.dosage !== undefined && { dosage: input.dosage }),
      ...(input.withdrawalDays !== undefined && {
        withdrawalDays: input.withdrawalDays,
      }),
      ...(input.notes !== undefined && { notes: input.notes }),
    })
    .where('id', '=', recordId)
    .execute()
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
  const { db } = await import('~/lib/db')
  const { checkFarmAccess } = await import('../auth/utils')

  const existing = await db
    .selectFrom('treatments')
    .innerJoin('batches', 'batches.id', 'treatments.batchId')
    .select(['treatments.id', 'batches.farmId'])
    .where('treatments.id', '=', recordId)
    .executeTakeFirst()

  if (!existing) throw new Error('Record not found')

  const hasAccess = await checkFarmAccess(userId, existing.farmId)
  if (!hasAccess) throw new Error('Access denied')

  await db.deleteFrom('treatments').where('id', '=', recordId).execute()
}

/**
 * Server function to delete a treatment record.
 */
export const deleteTreatmentFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { recordId: string }) => data)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/features/auth/server-middleware')
    const session = await requireAuth()
    return deleteTreatment(session.user.id, data.recordId)
  })
