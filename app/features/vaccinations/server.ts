import { createServerFn } from '@tanstack/react-start'
import type { PaginatedResult } from '~/lib/types'

export type { PaginatedResult }

export interface HealthRecord {
  id: string
  batchId: string
  batchSpecies: string | null
  type: 'vaccination' | 'treatment'
  name: string
  date: Date
  dosage: string
  nextDueDate: Date | null
  withdrawalDays: number | null
  notes: string | null
}

export interface CreateVaccinationInput {
  batchId: string
  vaccineName: string
  dateAdministered: Date
  dosage: string
  nextDueDate?: Date | null
  notes?: string | null
}

export interface CreateTreatmentInput {
  batchId: string
  medicationName: string
  reason: string
  date: Date
  dosage: string
  withdrawalDays: number
  notes?: string | null
}

export interface PaginatedQuery {
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  search?: string
  farmId?: string
  batchId?: string
  type?: 'all' | 'vaccination' | 'treatment'
}

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

export const createVaccinationFn = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: { farmId: string; data: CreateVaccinationInput }) => data,
  )
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/features/auth/server-middleware')
    const session = await requireAuth()
    return createVaccination(session.user.id, data.farmId, data.data)
  })

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

export const createTreatmentFn = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: { farmId: string; data: CreateTreatmentInput }) => data,
  )
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/features/auth/server-middleware')
    const session = await requireAuth()
    return createTreatment(session.user.id, data.farmId, data.data)
  })

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

export const getHealthRecordsPaginatedFn = createServerFn({ method: 'GET' })
  .inputValidator((data: PaginatedQuery) => data)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/features/auth/server-middleware')
    const session = await requireAuth()
    return getHealthRecordsPaginated(session.user.id, data)
  })

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

// Update vaccination input
export interface UpdateVaccinationInput {
  vaccineName?: string
  dateAdministered?: Date
  dosage?: string
  nextDueDate?: Date | null
  notes?: string | null
}

// Update treatment input
export interface UpdateTreatmentInput {
  medicationName?: string
  reason?: string
  date?: Date
  dosage?: string
  withdrawalDays?: number
  notes?: string | null
}

/**
 * Update vaccination record
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
 * Delete vaccination record
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

export const deleteVaccinationFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { recordId: string }) => data)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/features/auth/server-middleware')
    const session = await requireAuth()
    return deleteVaccination(session.user.id, data.recordId)
  })

/**
 * Update treatment record
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
 * Delete treatment record
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

export const deleteTreatmentFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { recordId: string }) => data)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/features/auth/server-middleware')
    const session = await requireAuth()
    return deleteTreatment(session.user.id, data.recordId)
  })
