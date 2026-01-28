import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

// Import service and repository functions
import { validateStructureData, validateUpdateData } from './service'
import {
    deleteStructure as deleteStructureDb,
    getStructureById as getStructureByIdDb,
    getStructuresByFarm as getStructuresByFarmDb,
    getStructuresWithCounts as getStructuresWithCountsDb,
    insertStructure as insertStructureDb,
    updateStructure as updateStructureDb,
} from './repository'

/**
 * Valid physical structure types for housing livestock.
 */
export type StructureType =
    | 'house'
    | 'pond'
    | 'pen'
    | 'cage'
    | 'barn'
    | 'pasture'
    | 'hive'
    | 'milking_parlor'
    | 'shearing_shed'
    | 'tank'
    | 'tarpaulin'
    | 'raceway'
    | 'feedlot'
    | 'kraal'

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
    { value: 'barn', label: 'Barn' },
    { value: 'pasture', label: 'Pasture' },
    { value: 'hive', label: 'Hive' },
    { value: 'milking_parlor', label: 'Milking Parlor' },
    { value: 'shearing_shed', label: 'Shearing Shed' },
    { value: 'tank', label: 'Tank' },
    { value: 'tarpaulin', label: 'Tarpaulin Pond' },
    { value: 'raceway', label: 'Raceway' },
    { value: 'feedlot', label: 'Feedlot' },
    { value: 'kraal', label: 'Kraal' },
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
    const { getDb } = await import('~/lib/db')
    const db = await getDb()
    const { verifyFarmAccess } = await import('~/features/auth/utils')
    const { AppError } = await import('~/lib/errors')

    try {
        await verifyFarmAccess(userId, farmId)

        return await getStructuresByFarmDb(db, farmId)
    } catch (error) {
        if (error instanceof AppError) throw error
        throw new AppError('DATABASE_ERROR', {
            message: 'Failed to fetch structures',
            cause: error,
        })
    }
}

/**
 * Server function to retrieve all structures for a farm.
 */
export const getStructuresFn = createServerFn({ method: 'GET' })
    .inputValidator(z.object({ farmId: z.string().uuid() }))
    .handler(async ({ data }) => {
        const { requireAuth } =
            await import('~/features/auth/server-middleware')
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
    const { getDb } = await import('~/lib/db')
    const db = await getDb()
    const { getUserFarms } = await import('~/features/auth/utils')
    const { AppError } = await import('~/lib/errors')

    try {
        const farmIds = await getUserFarms(userId)

        const structure = await getStructureByIdDb(db, structureId)

        if (!structure) {
            throw new AppError('STRUCTURE_NOT_FOUND', {
                metadata: { resource: 'Structure', id: structureId },
            })
        }
        if (!farmIds.includes(structure.farmId)) {
            throw new AppError('ACCESS_DENIED', {
                metadata: { farmId: structure.farmId },
            })
        }

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
    } catch (error) {
        if (error instanceof AppError) throw error
        throw new AppError('DATABASE_ERROR', {
            message: 'Failed to fetch structure details',
            cause: error,
        })
    }
}

/**
 * Server function to retrieve a specific structure's details.
 */
export const getStructureFn = createServerFn({ method: 'GET' })
    .inputValidator(z.object({ structureId: z.string().uuid() }))
    .handler(async ({ data }) => {
        const { requireAuth } =
            await import('~/features/auth/server-middleware')
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
    const { getDb } = await import('~/lib/db')
    const db = await getDb()
    const { verifyFarmAccess } = await import('~/features/auth/utils')
    const { AppError } = await import('~/lib/errors')

    try {
        await verifyFarmAccess(userId, input.farmId)

        // Business logic validation from service layer
        const validationError = validateStructureData(input)
        if (validationError) {
            throw new AppError('VALIDATION_ERROR', {
                metadata: { error: validationError },
            })
        }

        const id = await insertStructureDb(db, {
            farmId: input.farmId,
            name: input.name,
            type: input.type,
            capacity: input.capacity || null,
            areaSqm: input.areaSqm?.toString() || null,
            status: input.status,
            notes: input.notes || null,
        })

        return id
    } catch (error) {
        if (error instanceof AppError) throw error
        throw new AppError('DATABASE_ERROR', {
            message: 'Failed to create structure',
            cause: error,
        })
    }
}

/**
 * Server function to create a new farm structure.
 */
export const createStructureFn = createServerFn({ method: 'POST' })
    .inputValidator(
        z.object({
            input: z.object({
                farmId: z.string().uuid(),
                name: z.string().min(1),
                type: z.enum([
                    'house',
                    'pond',
                    'pen',
                    'cage',
                    'barn',
                    'pasture',
                    'hive',
                    'milking_parlor',
                    'shearing_shed',
                    'tank',
                    'tarpaulin',
                    'raceway',
                    'feedlot',
                    'kraal',
                ]),
                capacity: z.number().int().positive().optional().nullable(),
                areaSqm: z.number().positive().optional().nullable(),
                status: z.enum(['active', 'empty', 'maintenance']),
                notes: z.string().optional().nullable(),
            }),
        }),
    )
    .handler(async ({ data }) => {
        const { requireAuth } =
            await import('~/features/auth/server-middleware')
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
    const { getDb } = await import('~/lib/db')
    const db = await getDb()
    const { getUserFarms } = await import('~/features/auth/utils')
    const { AppError } = await import('~/lib/errors')

    try {
        const farmIds = await getUserFarms(userId)

        const structure = await getStructureByIdDb(db, id)

        if (!structure) {
            throw new AppError('STRUCTURE_NOT_FOUND', {
                metadata: { resource: 'Structure', id },
            })
        }
        if (!farmIds.includes(structure.farmId)) {
            throw new AppError('ACCESS_DENIED', {
                metadata: { farmId: structure.farmId },
            })
        }

        // Business logic validation from service layer
        const validationError = validateUpdateData(input)
        if (validationError) {
            throw new AppError('VALIDATION_ERROR', {
                metadata: { error: validationError },
            })
        }

        const updateData: Record<string, unknown> = {}
        if (input.name !== undefined) updateData.name = input.name
        if (input.type !== undefined) updateData.type = input.type
        if (input.capacity !== undefined) updateData.capacity = input.capacity
        if (input.areaSqm !== undefined)
            updateData.areaSqm = input.areaSqm?.toString() || null
        if (input.status !== undefined) updateData.status = input.status
        if (input.notes !== undefined) updateData.notes = input.notes

        if (Object.keys(updateData).length > 0) {
            await updateStructureDb(db, id, updateData)
        }

        return true
    } catch (error) {
        if (error instanceof AppError) throw error
        throw new AppError('DATABASE_ERROR', {
            message: 'Failed to update structure',
            cause: error,
        })
    }
}

/**
 * Server function to update a farm structure.
 */
export const updateStructureFn = createServerFn({ method: 'POST' })
    .inputValidator(
        z.object({
            id: z.string().uuid(),
            input: z.object({
                name: z.string().min(1).optional(),
                type: z
                    .enum([
                        'house',
                        'pond',
                        'pen',
                        'cage',
                        'barn',
                        'pasture',
                        'hive',
                        'milking_parlor',
                        'shearing_shed',
                        'tank',
                        'tarpaulin',
                        'raceway',
                        'feedlot',
                        'kraal',
                    ])
                    .optional(),
                capacity: z.number().int().positive().optional().nullable(),
                areaSqm: z.number().positive().optional().nullable(),
                status: z.enum(['active', 'empty', 'maintenance']).optional(),
                notes: z.string().optional().nullable(),
            }),
        }),
    )
    .handler(async ({ data }) => {
        const { requireAuth } =
            await import('~/features/auth/server-middleware')
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
    const { getDb } = await import('~/lib/db')
    const db = await getDb()
    const { getUserFarms } = await import('~/features/auth/utils')
    const { AppError } = await import('~/lib/errors')

    try {
        const farmIds = await getUserFarms(userId)

        const structure = await getStructureByIdDb(db, id)

        if (!structure) {
            throw new AppError('STRUCTURE_NOT_FOUND', {
                metadata: { resource: 'Structure', id },
            })
        }
        if (!farmIds.includes(structure.farmId)) {
            throw new AppError('ACCESS_DENIED', {
                metadata: { farmId: structure.farmId },
            })
        }

        // Check if any active batches are assigned (using repository function)
        const assignedBatches = await db
            .selectFrom('batches')
            .select('id')
            .where('structureId', '=', id)
            .where('status', '=', 'active')
            .execute()

        if (assignedBatches.length > 0) {
            throw new AppError('VALIDATION_ERROR', {
                message: `Cannot delete structure with ${assignedBatches.length} active batch(es) assigned. Please reassign or complete the batches first.`,
            })
        }

        await deleteStructureDb(db, id)
        return true
    } catch (error) {
        if (error instanceof AppError) throw error
        throw new AppError('DATABASE_ERROR', {
            message: 'Failed to delete structure',
            cause: error,
        })
    }
}

/**
 * Server function to delete a farm structure.
 */
export const deleteStructureFn = createServerFn({ method: 'POST' })
    .inputValidator(z.object({ id: z.string().uuid() }))
    .handler(async ({ data }) => {
        const { requireAuth } =
            await import('~/features/auth/server-middleware')
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
    const { getDb } = await import('~/lib/db')
    const db = await getDb()
    const { verifyFarmAccess } = await import('~/features/auth/utils')
    const { AppError } = await import('~/lib/errors')

    try {
        await verifyFarmAccess(userId, farmId)

        return await getStructuresWithCountsDb(db, farmId)
    } catch (error) {
        if (error instanceof AppError) throw error
        throw new AppError('DATABASE_ERROR', {
            message: 'Failed to fetch structures with counts',
            cause: error,
        })
    }
}

/**
 * Server function to retrieve structures with summary counts.
 */
export const getStructuresWithCountsFn = createServerFn({ method: 'GET' })
    .inputValidator(z.object({ farmId: z.string().uuid() }))
    .handler(async ({ data }) => {
        const { requireAuth } =
            await import('~/features/auth/server-middleware')
        const session = await requireAuth()
        return getStructuresWithCounts(session.user.id, data.farmId)
    })
