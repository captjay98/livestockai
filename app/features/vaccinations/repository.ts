/**
 * Database operations for vaccination management.
 * All functions are pure data access - no business logic.
 */

import type { Kysely } from 'kysely'
import type { Database } from '~/lib/db/types'

/**
 * Data for inserting a new vaccination
 */
export interface VaccinationInsert {
  batchId: string
  vaccineName: string
  dateAdministered: Date
  dosage: string
  nextDueDate: Date | null
  notes: string | null
}

/**
 * Data for updating a vaccination
 */
export interface VaccinationUpdate {
  vaccineName?: string
  dateAdministered?: Date
  dosage?: string
  nextDueDate?: Date | null
  notes?: string | null
}

/**
 * Data for inserting a new treatment
 */
export interface TreatmentInsert {
  batchId: string
  medicationName: string
  reason: string
  date: Date
  dosage: string
  withdrawalDays: number
  notes: string | null
}

/**
 * Data for updating a treatment
 */
export interface TreatmentUpdate {
  medicationName?: string
  reason?: string
  date?: Date
  dosage?: string
  withdrawalDays?: number
  notes?: string | null
}

/**
 * Vaccination record with batch info
 */
export interface VaccinationWithBatch {
  id: string
  batchId: string
  vaccineName: string
  dateAdministered: Date
  dosage: string
  nextDueDate: Date | null
  notes: string | null
  species: string | null
  livestockType: string | null
  farmId: string
  farmName: string | null
}

/**
 * Treatment record with batch info
 */
export interface TreatmentWithBatch {
  id: string
  batchId: string
  medicationName: string
  reason: string
  date: Date
  dosage: string
  withdrawalDays: number
  notes: string | null
  species: string | null
  livestockType: string | null
  farmId: string
  farmName: string | null
}

/**
 * Paginated query filters
 */
export interface VaccinationFilters {
  farmIds: Array<string>
  batchId?: string
  search?: string
  type?: 'vaccination' | 'treatment'
}

/**
 * Insert a new vaccination into the database
 *
 * @param db - Kysely database instance
 * @param data - Vaccination data to insert
 * @returns The ID of the created vaccination
 */
export async function insertVaccination(
  db: Kysely<Database>,
  data: VaccinationInsert,
): Promise<string> {
  const result = await db
    .insertInto('vaccinations')
    .values(data)
    .returning('id')
    .executeTakeFirstOrThrow()
  return result.id
}

/**
 * Get a vaccination by ID
 *
 * @param db - Kysely database instance
 * @param vaccinationId - ID of the vaccination
 * @returns The vaccination data or null if not found
 */
export async function getVaccinationById(
  db: Kysely<Database>,
  vaccinationId: string,
): Promise<VaccinationWithBatch | null> {
  const vaccination = await db
    .selectFrom('vaccinations')
    .innerJoin('batches', 'batches.id', 'vaccinations.batchId')
    .innerJoin('farms', 'farms.id', 'batches.farmId')
    .select([
      'vaccinations.id',
      'vaccinations.batchId',
      'vaccinations.vaccineName',
      'vaccinations.dateAdministered',
      'vaccinations.dosage',
      'vaccinations.nextDueDate',
      'vaccinations.notes',
      'batches.species',
      'batches.livestockType',
      'batches.farmId',
      'farms.name as farmName',
    ])
    .where('vaccinations.id', '=', vaccinationId)
    .executeTakeFirst()

  return (vaccination as VaccinationWithBatch | null) ?? null
}

/**
 * Get a batch by ID
 *
 * @param db - Kysely database instance
 * @param batchId - ID of the batch
 * @returns The batch data with farm ID or null if not found
 */
export async function getBatchById(
  db: Kysely<Database>,
  batchId: string,
): Promise<{ id: string; farmId: string } | null> {
  const batch = await db
    .selectFrom('batches')
    .select(['id', 'farmId'])
    .where('id', '=', batchId)
    .executeTakeFirst()

  return (batch as { id: string; farmId: string } | null) ?? null
}

/**
 * Delete a vaccination by ID
 *
 * @param db - Kysely database instance
 * @param vaccinationId - ID of the vaccination to delete
 */
export async function deleteVaccination(
  db: Kysely<Database>,
  vaccinationId: string,
): Promise<void> {
  await db.deleteFrom('vaccinations').where('id', '=', vaccinationId).execute()
}

/**
 * Update vaccination fields
 *
 * @param db - Kysely database instance
 * @param vaccinationId - ID of the vaccination to update
 * @param data - Fields to update
 */
export async function updateVaccination(
  db: Kysely<Database>,
  vaccinationId: string,
  data: VaccinationUpdate,
): Promise<void> {
  await db
    .updateTable('vaccinations')
    .set(data)
    .where('id', '=', vaccinationId)
    .execute()
}

/**
 * Get vaccinations by batch ID
 *
 * @param db - Kysely database instance
 * @param batchId - ID of the batch
 * @returns Array of vaccination records for the batch
 */
export async function getVaccinationsByBatch(
  db: Kysely<Database>,
  batchId: string,
): Promise<Array<VaccinationWithBatch>> {
  return await db
    .selectFrom('vaccinations')
    .innerJoin('batches', 'batches.id', 'vaccinations.batchId')
    .innerJoin('farms', 'farms.id', 'batches.farmId')
    .select([
      'vaccinations.id',
      'vaccinations.batchId',
      'vaccinations.vaccineName',
      'vaccinations.dateAdministered',
      'vaccinations.dosage',
      'vaccinations.nextDueDate',
      'vaccinations.notes',
      'batches.species',
      'batches.livestockType',
      'batches.farmId',
      'farms.name as farmName',
    ])
    .where('vaccinations.batchId', '=', batchId)
    .orderBy('vaccinations.dateAdministered', 'desc')
    .execute()
}

/**
 * Get paginated health records (vaccinations and treatments)
 *
 * @param db - Kysely database instance
 * @param filters - Query filters
 * @param page - Page number (1-based)
 * @param pageSize - Items per page
 * @param sortBy - Column to sort by
 * @param sortOrder - Sort direction
 * @returns Paginated result with data and metadata
 */
export async function getHealthRecordsPaginated(
  db: Kysely<Database>,
  filters: VaccinationFilters,
  page: number,
  pageSize: number,
  sortBy: string,
  sortOrder: 'asc' | 'desc',
): Promise<{
  data: Array<any>
  total: number
  page: number
  pageSize: number
  totalPages: number
}> {
  const { sql } = await import('kysely')

  // Build vaccines query
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
    .where('batches.farmId', 'in', filters.farmIds)

  // Build treatments query
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
    .where('batches.farmId', 'in', filters.farmIds)

  // Apply search filter
  if (filters.search) {
    const searchLower = `%${filters.search.toLowerCase()}%`
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

  // Apply batch filter
  if (filters.batchId) {
    vaccinesQuery = vaccinesQuery.where(
      'vaccinations.batchId',
      '=',
      filters.batchId,
    )
    treatmentsQuery = treatmentsQuery.where(
      'treatments.batchId',
      '=',
      filters.batchId,
    )
  }

  // Combine or filter by type
  let finalQuery
  if (filters.type === 'vaccination') {
    finalQuery = vaccinesQuery
  } else if (filters.type === 'treatment') {
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
  const totalPages = Math.ceil(total / pageSize)
  const offset = (page - 1) * pageSize

  // Get paginated data - validate sort column to prevent SQL injection
  const allowedSortCols = [
    'dateAdministered',
    'vaccineName',
    'nextDueDate',
    'createdAt',
    'date',
    'medicationName',
  ]
  const safeSortBy = allowedSortCols.includes(sortBy)
    ? sortBy
    : 'dateAdministered'

  const dataQuery = db
    .with('union_table', () => finalQuery)
    .selectFrom('union_table')
    .select([
      'id',
      'batchId',
      'type',
      'name',
      'date',
      'dosage',
      'notes',
      'reason',
      'withdrawalDays',
      'nextDueDate',
      'species',
      'livestockType',
      'farmName',
      'farmId',
    ])
    .limit(pageSize)
    .offset(offset)
    .orderBy(sql.raw(`"${safeSortBy}"`), sortOrder)

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
 * Get vaccination summary for a farm
 *
 * @param db - Kysely database instance
 * @param farmId - ID of the farm
 * @returns Summary statistics
 */
export async function getVaccinationSummary(
  db: Kysely<Database>,
  farmId: string,
): Promise<{
  total: number
  completed: number
  scheduled: number
  overdue: number
  upcoming: number
}> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const futureDate = new Date(today)
  futureDate.setDate(futureDate.getDate() + 7)
  futureDate.setHours(23, 59, 59, 999)

  const [totalResult, overdueResult, upcomingResult] = await Promise.all([
    db
      .selectFrom('vaccinations')
      .innerJoin('batches', 'batches.id', 'vaccinations.batchId')
      .select(db.fn.count('vaccinations.id').as('count'))
      .where('batches.farmId', '=', farmId)
      .executeTakeFirst(),

    db
      .selectFrom('vaccinations')
      .innerJoin('batches', 'batches.id', 'vaccinations.batchId')
      .select(db.fn.count('vaccinations.id').as('count'))
      .where('batches.farmId', '=', farmId)
      .where('vaccinations.nextDueDate', '<', today)
      .executeTakeFirst(),

    db
      .selectFrom('vaccinations')
      .innerJoin('batches', 'batches.id', 'vaccinations.batchId')
      .select(db.fn.count('vaccinations.id').as('count'))
      .where('batches.farmId', '=', farmId)
      .where('vaccinations.nextDueDate', '>=', today)
      .where('vaccinations.nextDueDate', '<=', futureDate)
      .executeTakeFirst(),
  ])

  const total = Number(totalResult?.count || 0)
  const overdue = Number(overdueResult?.count || 0)
  const upcoming = Number(upcomingResult?.count || 0)
  const scheduled = overdue + upcoming
  const completed = total - scheduled

  return {
    total,
    completed,
    scheduled,
    overdue,
    upcoming,
  }
}

/**
 * Get upcoming vaccinations for active batches
 *
 * @param db - Kysely database instance
 * @param farmIds - Array of farm IDs
 * @param daysAhead - Number of days to look ahead
 * @returns Array of upcoming vaccinations
 */
export async function getUpcomingVaccinations(
  db: Kysely<Database>,
  farmIds: Array<string>,
  daysAhead: number,
): Promise<Array<VaccinationWithBatch>> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const futureDate = new Date(today)
  futureDate.setDate(futureDate.getDate() + daysAhead)
  futureDate.setHours(23, 59, 59, 999)

  return await db
    .selectFrom('vaccinations')
    .innerJoin('batches', 'batches.id', 'vaccinations.batchId')
    .innerJoin('farms', 'farms.id', 'batches.farmId')
    .select([
      'vaccinations.id',
      'vaccinations.batchId',
      'vaccinations.vaccineName',
      'vaccinations.nextDueDate',
      'vaccinations.dateAdministered',
      'vaccinations.dosage',
      'vaccinations.notes',
      'batches.species',
      'batches.livestockType',
      'farms.name as farmName',
      'batches.farmId',
    ])
    .where('batches.farmId', 'in', farmIds)
    .where('batches.status', '=', 'active')
    .where('vaccinations.nextDueDate', '>=', today)
    .where('vaccinations.nextDueDate', '<=', futureDate)
    .orderBy('vaccinations.nextDueDate', 'asc')
    .execute()
}

/**
 * Get overdue vaccinations for active batches
 *
 * @param db - Kysely database instance
 * @param farmIds - Array of farm IDs
 * @returns Array of overdue vaccinations
 */
export async function getOverdueVaccinations(
  db: Kysely<Database>,
  farmIds: Array<string>,
): Promise<Array<VaccinationWithBatch>> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return await db
    .selectFrom('vaccinations')
    .innerJoin('batches', 'batches.id', 'vaccinations.batchId')
    .innerJoin('farms', 'farms.id', 'batches.farmId')
    .select([
      'vaccinations.id',
      'vaccinations.batchId',
      'vaccinations.vaccineName',
      'vaccinations.nextDueDate',
      'vaccinations.dateAdministered',
      'vaccinations.dosage',
      'vaccinations.notes',
      'batches.species',
      'batches.livestockType',
      'farms.name as farmName',
      'batches.farmId',
    ])
    .where('batches.farmId', 'in', farmIds)
    .where('batches.status', '=', 'active')
    .where('vaccinations.nextDueDate', '<', today)
    .orderBy('vaccinations.nextDueDate', 'asc')
    .execute()
}

/**
 * Get compliance statistics for a farm
 *
 * @param db - Kysely database instance
 * @param farmId - ID of the farm
 * @returns Compliance statistics
 */
export async function getComplianceStats(
  db: Kysely<Database>,
  farmId: string,
): Promise<{
  totalVaccinations: number
  completedVaccinations: number
  pendingVaccinations: number
  complianceRate: number
}> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [totalResult, completedResult] = await Promise.all([
    db
      .selectFrom('vaccinations')
      .innerJoin('batches', 'batches.id', 'vaccinations.batchId')
      .select(db.fn.count('vaccinations.id').as('count'))
      .where('batches.farmId', '=', farmId)
      .executeTakeFirst(),

    db
      .selectFrom('vaccinations')
      .innerJoin('batches', 'batches.id', 'vaccinations.batchId')
      .select(db.fn.count('vaccinations.id').as('count'))
      .where('batches.farmId', '=', farmId)
      .where('vaccinations.nextDueDate', 'is', null)
      .executeTakeFirst(),
  ])

  const totalVaccinations = Number(totalResult?.count || 0)
  const completedVaccinations = Number(completedResult?.count || 0)
  const pendingVaccinations = totalVaccinations - completedVaccinations

  const complianceRate =
    totalVaccinations > 0
      ? (completedVaccinations / totalVaccinations) * 100
      : 100

  return {
    totalVaccinations,
    completedVaccinations,
    pendingVaccinations,
    complianceRate,
  }
}

// Treatment operations

/**
 * Insert a new treatment into the database
 *
 * @param db - Kysely database instance
 * @param data - Treatment data to insert
 * @returns The ID of the created treatment
 */
export async function insertTreatment(
  db: Kysely<Database>,
  data: TreatmentInsert,
): Promise<string> {
  const result = await db
    .insertInto('treatments')
    .values(data)
    .returning('id')
    .executeTakeFirstOrThrow()
  return result.id
}

/**
 * Get a treatment by ID
 *
 * @param db - Kysely database instance
 * @param treatmentId - ID of the treatment
 * @returns The treatment data or null if not found
 */
export async function getTreatmentById(
  db: Kysely<Database>,
  treatmentId: string,
): Promise<TreatmentWithBatch | null> {
  const treatment = await db
    .selectFrom('treatments')
    .innerJoin('batches', 'batches.id', 'treatments.batchId')
    .innerJoin('farms', 'farms.id', 'batches.farmId')
    .select([
      'treatments.id',
      'treatments.batchId',
      'treatments.medicationName',
      'treatments.reason',
      'treatments.date',
      'treatments.dosage',
      'treatments.withdrawalDays',
      'treatments.notes',
      'batches.species',
      'batches.livestockType',
      'batches.farmId',
      'farms.name as farmName',
    ])
    .where('treatments.id', '=', treatmentId)
    .executeTakeFirst()

  return (treatment as TreatmentWithBatch | null) ?? null
}

/**
 * Delete a treatment by ID
 *
 * @param db - Kysely database instance
 * @param treatmentId - ID of the treatment to delete
 */
export async function deleteTreatment(
  db: Kysely<Database>,
  treatmentId: string,
): Promise<void> {
  await db.deleteFrom('treatments').where('id', '=', treatmentId).execute()
}

/**
 * Update treatment fields
 *
 * @param db - Kysely database instance
 * @param treatmentId - ID of the treatment to update
 * @param data - Fields to update
 */
export async function updateTreatment(
  db: Kysely<Database>,
  treatmentId: string,
  data: TreatmentUpdate,
): Promise<void> {
  await db
    .updateTable('treatments')
    .set(data)
    .where('id', '=', treatmentId)
    .execute()
}

/**
 * Get treatments by batch ID
 *
 * @param db - Kysely database instance
 * @param batchId - ID of the batch
 * @returns Array of treatment records for the batch
 */
export async function getTreatmentsByBatch(
  db: Kysely<Database>,
  batchId: string,
): Promise<Array<TreatmentWithBatch>> {
  return await db
    .selectFrom('treatments')
    .innerJoin('batches', 'batches.id', 'treatments.batchId')
    .innerJoin('farms', 'farms.id', 'batches.farmId')
    .select([
      'treatments.id',
      'treatments.batchId',
      'treatments.medicationName',
      'treatments.reason',
      'treatments.date',
      'treatments.dosage',
      'treatments.withdrawalDays',
      'treatments.notes',
      'batches.species',
      'batches.livestockType',
      'batches.farmId',
      'farms.name as farmName',
    ])
    .where('treatments.batchId', '=', batchId)
    .orderBy('treatments.date', 'desc')
    .execute()
}

/**
 * Get treatments in withdrawal period for active batches
 *
 * @param db - Kysely database instance
 * @param farmIds - Array of farm IDs
 * @returns Array of treatments in withdrawal period
 */
export async function getTreatmentsInWithdrawal(
  db: Kysely<Database>,
  farmIds: Array<string>,
): Promise<
  Array<{
    id: string
    batchId: string
    medicationName: string
    date: Date
    withdrawalDays: number
    withdrawalEndDate: Date
    species: string | null
    farmName: string | null
  }>
> {
  const today = new Date()

  const treatments = await db
    .selectFrom('treatments')
    .innerJoin('batches', 'batches.id', 'treatments.batchId')
    .innerJoin('farms', 'farms.id', 'batches.farmId')
    .select([
      'treatments.id',
      'treatments.batchId',
      'treatments.medicationName',
      'treatments.date',
      'treatments.withdrawalDays',
      'batches.species',
      'farms.name as farmName',
    ])
    .where('batches.farmId', 'in', farmIds)
    .where('batches.status', '=', 'active')
    .where('treatments.withdrawalDays', '>', 0)
    .execute()

  // Calculate withdrawal end date in application layer
  return treatments
    .map((t) => {
      const endDate = new Date(t.date)
      endDate.setDate(endDate.getDate() + t.withdrawalDays)
      return {
        ...t,
        withdrawalEndDate: endDate,
      }
    })
    .filter((t) => t.withdrawalEndDate >= today)
    .sort(
      (a, b) => a.withdrawalEndDate.getTime() - b.withdrawalEndDate.getTime(),
    )
}
