import { createServerFn } from '@tanstack/react-start'

/**
 * Valid physical structure types for housing livestock.
 */
export type StructureType = 'house' | 'pond' | 'pen' | 'cage'

/**
 * Operational status of a farm structure.
 */
export type StructureStatus = 'active' | 'empty' | 'maintenance'

/**
 * UI-friendly labels for each structure type.
 */
export const STRUCTURE_TYPES: Array<{ value: StructureType; label: string }> = [
  { value: 'house', label: 'House' },
  { value: 'pond', label: 'Pond' },
  { value: 'pen', label: 'Pen' },
  { value: 'cage', label: 'Cage' },
]

/**
 * UI-friendly labels for each structure status.
 */
export const STRUCTURE_STATUSES: Array<{
  value: StructureStatus
  label: string
}> = [
  { value: 'active', label: 'Active' },
  { value: 'empty', label: 'Empty' },
  { value: 'maintenance', label: 'Maintenance' },
]

/**
 * Data required to create a new physical structure on a farm.
 */
export interface CreateStructureInput {
  /** ID of the farm owning the structure */
  farmId: string
  /** Unique name or number of the structure on the farm */
  name: string
  /** Type of housing (e.g., pond, pen) */
  type: StructureType
  /** Maximum number of animals the structure can hold */
  capacity?: number | null
  /** Floor or surface area in square meters */
  areaSqm?: number | null
  /** Initial operational status */
  status: StructureStatus
  /** Optional notes about the construction or features */
  notes?: string | null
}

/**
 * Data structure for updating an existing structure's details.
 */
export interface UpdateStructureInput {
  /** Updated display name */
  name?: string
  /** Updated housing type */
  type?: StructureType
  /** Updated occupancy capacity */
  capacity?: number | null
  /** Updated area measurement */
  areaSqm?: number | null
  /** Updated operational status */
  status?: StructureStatus
  /** Updated descriptive notes */
  notes?: string | null
}

/**
 * Retrieve all physical structures belonging to a specific farm.
 *
 * @param userId - ID of the user requesting the data
 * @param farmId - ID of the farm
 * @returns Promise resolving to an array of structures
 * @throws {Error} If user does not have access to the farm
 */
export async function getStructures(userId: string, farmId: string) {
  const { db } = await import('~/lib/db')
  const { verifyFarmAccess } = await import('~/features/auth/utils')

  await verifyFarmAccess(userId, farmId)

  return db
    .selectFrom('structures')
    .select([
      'id',
      'farmId',
      'name',
      'type',
      'capacity',
      'areaSqm',
      'status',
      'notes',
      'createdAt',
    ])
    .where('farmId', '=', farmId)
    .orderBy('name', 'asc')
    .execute()
}

/**
 * Server function to retrieve all structures for a farm.
 */
export const getStructuresFn = createServerFn({ method: 'GET' })
  .inputValidator((data: { farmId: string }) => data)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/features/auth/server-middleware')
    const session = await requireAuth()
    return getStructures(session.user.id, data.farmId)
  })

/**
 * Retrieve details for a single structure, including currently active livestock batches.
 *
 * @param userId - ID of the user requesting the data
 * @param structureId - ID of the structure to retrieve
 * @returns Promise resolving to the structure details with active batch list
 * @throws {Error} If structure is not found or access is denied
 */
export async function getStructure(userId: string, structureId: string) {
  const { db } = await import('~/lib/db')
  const { getUserFarms } = await import('~/features/auth/utils')

  const farmIds = await getUserFarms(userId)

  const structure = await db
    .selectFrom('structures')
    .leftJoin('farms', 'farms.id', 'structures.farmId')
    .select([
      'structures.id',
      'structures.farmId',
      'structures.name',
      'structures.type',
      'structures.capacity',
      'structures.areaSqm',
      'structures.status',
      'structures.notes',
      'structures.createdAt',
      'farms.name as farmName',
    ])
    .where('structures.id', '=', structureId)
    .executeTakeFirst()

  if (!structure) throw new Error('Structure not found')
  if (!farmIds.includes(structure.farmId)) throw new Error('Unauthorized')

  // Get batches assigned to this structure
  const batches = await db
    .selectFrom('batches')
    .select([
      'id',
      'batchName',
      'species',
      'livestockType',
      'currentQuantity',
      'status',
    ])
    .where('structureId', '=', structureId)
    .where('status', '=', 'active')
    .execute()

  return { ...structure, batches }
}

/**
 * Server function to retrieve a specific structure's details.
 */
export const getStructureFn = createServerFn({ method: 'GET' })
  .inputValidator((data: { structureId: string }) => data)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/features/auth/server-middleware')
    const session = await requireAuth()
    return getStructure(session.user.id, data.structureId)
  })

/**
 * Create a new physical structure for a farm.
 *
 * @param userId - ID of the user creating the structure
 * @param input - Creation details (farmId, name, type, capacity, etc.)
 * @returns Promise resolving to the new structure record ID
 * @throws {Error} If user does not have access to the specified farm
 */
export async function createStructure(
  userId: string,
  input: CreateStructureInput,
): Promise<string> {
  const { db } = await import('~/lib/db')
  const { verifyFarmAccess } = await import('~/features/auth/utils')

  await verifyFarmAccess(userId, input.farmId)

  const result = await db
    .insertInto('structures')
    .values({
      farmId: input.farmId,
      name: input.name,
      type: input.type,
      capacity: input.capacity || null,
      areaSqm: input.areaSqm?.toString() || null,
      status: input.status,
      notes: input.notes || null,
    })
    .returning('id')
    .executeTakeFirstOrThrow()

  return result.id
}

/**
 * Server function to create a new farm structure.
 */
export const createStructureFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { input: CreateStructureInput }) => data)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/features/auth/server-middleware')
    const session = await requireAuth()
    return createStructure(session.user.id, data.input)
  })

/**
 * Update an existing structure's configuration or status.
 *
 * @param userId - ID of the user performing the update
 * @param id - ID of the structure to update
 * @param input - Partial update parameters
 * @returns Promise resolving to true on success
 */
export async function updateStructure(
  userId: string,
  id: string,
  input: UpdateStructureInput,
) {
  const { db } = await import('~/lib/db')
  const { getUserFarms } = await import('~/features/auth/utils')

  const farmIds = await getUserFarms(userId)

  const structure = await db
    .selectFrom('structures')
    .select(['id', 'farmId'])
    .where('id', '=', id)
    .executeTakeFirst()

  if (!structure) throw new Error('Structure not found')
  if (!farmIds.includes(structure.farmId)) throw new Error('Unauthorized')

  const updateData: Record<string, unknown> = {}
  if (input.name !== undefined) updateData.name = input.name
  if (input.type !== undefined) updateData.type = input.type
  if (input.capacity !== undefined) updateData.capacity = input.capacity
  if (input.areaSqm !== undefined)
    updateData.areaSqm = input.areaSqm?.toString() || null
  if (input.status !== undefined) updateData.status = input.status
  if (input.notes !== undefined) updateData.notes = input.notes

  if (Object.keys(updateData).length > 0) {
    await db
      .updateTable('structures')
      .set(updateData)
      .where('id', '=', id)
      .execute()
  }

  return true
}

/**
 * Server function to update a farm structure.
 */
export const updateStructureFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string; input: UpdateStructureInput }) => data)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/features/auth/server-middleware')
    const session = await requireAuth()
    return updateStructure(session.user.id, data.id, data.input)
  })

/**
 * Permanently delete a structure record from a farm.
 * Operation fails if the structure has any active livestock batches assigned to it.
 *
 * @param userId - ID of the user requesting deletion
 * @param id - ID of the structure to delete
 * @returns Promise resolving to true on successful deletion
 * @throws {Error} If structure is not found, user is unauthorized, or structure has active batches
 */
export async function deleteStructure(userId: string, id: string) {
  const { db } = await import('~/lib/db')
  const { getUserFarms } = await import('~/features/auth/utils')

  const farmIds = await getUserFarms(userId)

  const structure = await db
    .selectFrom('structures')
    .select(['id', 'farmId'])
    .where('id', '=', id)
    .executeTakeFirst()

  if (!structure) throw new Error('Structure not found')
  if (!farmIds.includes(structure.farmId)) throw new Error('Unauthorized')

  // Check if any active batches are assigned
  const assignedBatches = await db
    .selectFrom('batches')
    .select('id')
    .where('structureId', '=', id)
    .where('status', '=', 'active')
    .execute()

  if (assignedBatches.length > 0) {
    throw new Error(
      `Cannot delete structure with ${assignedBatches.length} active batch(es) assigned. Please reassign or complete the batches first.`,
    )
  }

  await db.deleteFrom('structures').where('id', '=', id).execute()
  return true
}

/**
 * Server function to delete a farm structure.
 */
export const deleteStructureFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/features/auth/server-middleware')
    const session = await requireAuth()
    return deleteStructure(session.user.id, data.id)
  })

/**
 * Retrieve a list of farm structures including aggregated livestock counts for each.
 * Calculates both the number of active batches and the total animal headcount per structure.
 *
 * @param userId - ID of the user requesting the data
 * @param farmId - ID of the farm
 * @returns Promise resolving to an array of structures with batch and animal totals
 */
export async function getStructuresWithCounts(userId: string, farmId: string) {
  const { db } = await import('~/lib/db')
  const { sql } = await import('kysely')
  const { verifyFarmAccess } = await import('~/features/auth/utils')

  await verifyFarmAccess(userId, farmId)

  const structures = await db
    .selectFrom('structures')
    .leftJoin('batches', (join) =>
      join
        .onRef('batches.structureId', '=', 'structures.id')
        .on('batches.status', '=', 'active'),
    )
    .select([
      'structures.id',
      'structures.farmId',
      'structures.name',
      'structures.type',
      'structures.capacity',
      'structures.areaSqm',
      'structures.status',
      'structures.notes',
      'structures.createdAt',
      sql<number>`count(batches.id)`.as('batchCount'),
      sql<number>`coalesce(sum(batches."currentQuantity"), 0)`.as(
        'totalAnimals',
      ),
    ])
    .where('structures.farmId', '=', farmId)
    .groupBy('structures.id')
    .orderBy('structures.name', 'asc')
    .execute()

  return structures
}

/**
 * Server function to retrieve structures with summary counts.
 */
export const getStructuresWithCountsFn = createServerFn({ method: 'GET' })
  .inputValidator((data: { farmId: string }) => data)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/features/auth/server-middleware')
    const session = await requireAuth()
    return getStructuresWithCounts(session.user.id, data.farmId)
  })
