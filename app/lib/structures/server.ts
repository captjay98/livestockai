import { createServerFn } from '@tanstack/react-start'

export type StructureType = 'house' | 'pond' | 'pen' | 'cage'
export type StructureStatus = 'active' | 'empty' | 'maintenance'

export const STRUCTURE_TYPES: Array<{ value: StructureType; label: string }> = [
  { value: 'house', label: 'House' },
  { value: 'pond', label: 'Pond' },
  { value: 'pen', label: 'Pen' },
  { value: 'cage', label: 'Cage' },
]

export const STRUCTURE_STATUSES: Array<{
  value: StructureStatus
  label: string
}> = [
  { value: 'active', label: 'Active' },
  { value: 'empty', label: 'Empty' },
  { value: 'maintenance', label: 'Maintenance' },
]

export interface CreateStructureInput {
  farmId: string
  name: string
  type: StructureType
  capacity?: number | null
  areaSqm?: number | null
  status: StructureStatus
  notes?: string | null
}

export interface UpdateStructureInput {
  name?: string
  type?: StructureType
  capacity?: number | null
  areaSqm?: number | null
  status?: StructureStatus
  notes?: string | null
}

/**
 * Get all structures for a farm
 */
export async function getStructures(userId: string, farmId: string) {
  const { db } = await import('~/lib/db')
  const { verifyFarmAccess } = await import('~/lib/auth/utils')

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

export const getStructuresFn = createServerFn({ method: 'GET' })
  .inputValidator((data: { farmId: string }) => data)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/lib/auth/server-middleware')
    const session = await requireAuth()
    return getStructures(session.user.id, data.farmId)
  })

/**
 * Get a single structure with its assigned batches
 */
export async function getStructure(userId: string, structureId: string) {
  const { db } = await import('~/lib/db')
  const { getUserFarms } = await import('~/lib/auth/utils')

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

export const getStructureFn = createServerFn({ method: 'GET' })
  .inputValidator((data: { structureId: string }) => data)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/lib/auth/server-middleware')
    const session = await requireAuth()
    return getStructure(session.user.id, data.structureId)
  })

/**
 * Create a new structure
 */
export async function createStructure(
  userId: string,
  input: CreateStructureInput,
): Promise<string> {
  const { db } = await import('~/lib/db')
  const { verifyFarmAccess } = await import('~/lib/auth/utils')

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

export const createStructureFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { input: CreateStructureInput }) => data)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/lib/auth/server-middleware')
    const session = await requireAuth()
    return createStructure(session.user.id, data.input)
  })

/**
 * Update a structure
 */
export async function updateStructure(
  userId: string,
  id: string,
  input: UpdateStructureInput,
) {
  const { db } = await import('~/lib/db')
  const { getUserFarms } = await import('~/lib/auth/utils')

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

export const updateStructureFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string; input: UpdateStructureInput }) => data)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/lib/auth/server-middleware')
    const session = await requireAuth()
    return updateStructure(session.user.id, data.id, data.input)
  })

/**
 * Delete a structure
 */
export async function deleteStructure(userId: string, id: string) {
  const { db } = await import('~/lib/db')
  const { getUserFarms } = await import('~/lib/auth/utils')

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

export const deleteStructureFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/lib/auth/server-middleware')
    const session = await requireAuth()
    return deleteStructure(session.user.id, data.id)
  })

/**
 * Get structures with batch counts for a farm
 */
export async function getStructuresWithCounts(userId: string, farmId: string) {
  const { db } = await import('~/lib/db')
  const { sql } = await import('kysely')
  const { verifyFarmAccess } = await import('~/lib/auth/utils')

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

export const getStructuresWithCountsFn = createServerFn({ method: 'GET' })
  .inputValidator((data: { farmId: string }) => data)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/lib/auth/server-middleware')
    const session = await requireAuth()
    return getStructuresWithCounts(session.user.id, data.farmId)
  })
