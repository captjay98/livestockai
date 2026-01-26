import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { AppError } from '~/lib/errors'

export { WATER_QUALITY_THRESHOLDS } from './constants'

const createRecordSchema = z.object({
  farmId: z.string(),
  data: z.object({
    batchId: z.string(),
    date: z.date(),
    ph: z.number().min(0).max(14),
    temperatureCelsius: z.number().min(0).max(50),
    dissolvedOxygenMgL: z.number().min(0),
    ammoniaMgL: z.number().min(0),
    notes: z.string().optional(),
  }),
})

export type CreateWaterQualityInput = z.infer<typeof createRecordSchema>['data']

const updateRecordSchema = z.object({
  recordId: z.string(),
  data: z.object({
    ph: z.number().min(0).max(14).optional(),
    temperatureCelsius: z.number().min(0).max(50).optional(),
    dissolvedOxygenMgL: z.number().min(0).optional(),
    ammoniaMgL: z.number().min(0).optional(),
    date: z.date().optional(),
    notes: z.string().nullable().optional(),
  }),
})

export type UpdateWaterQualityInput = z.infer<typeof updateRecordSchema>['data']

const getRecordsSchema = z.object({
  farmId: z.string().optional().nullable(),
  page: z.number().optional(),
  pageSize: z.number().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  search: z.string().optional(),
})

export const getWaterQualityDataForFarmFn = createServerFn({ method: 'GET' })
  .inputValidator(getRecordsSchema)
  .handler(async ({ data: input }) => {
    const { requireAuth } = await import('~/features/auth/server-middleware')
    const session = await requireAuth()
    const { getBatches } = await import('~/features/batches/server')
    const { getWaterQualityPaginated } = await import('./repository')

    try {
      const farmId = input.farmId || undefined
      const { getUserFarms } = await import('~/features/auth/utils')
      const { getDb } = await import('~/lib/db')
      const db = await getDb()

      // Get farm IDs
      const farmIds = farmId ? [farmId] : await getUserFarms(session.user.id)

      const [paginatedRecords, allBatches] = await Promise.all([
        getWaterQualityPaginated(db, farmIds, {
          page: input.page,
          pageSize: input.pageSize,
          sortBy: input.sortBy,
          sortOrder: input.sortOrder,
          search: input.search,
        }),
        getBatches(session.user.id, farmId),
      ])

      const batches = allBatches.filter(
        (b) => b.status === 'active' && b.livestockType === 'fish',
      )

      return {
        paginatedRecords,
        batches,
      }
    } catch (error) {
      throw new AppError('DATABASE_ERROR', {
        message: 'Failed to fetch water quality data',
        cause: error,
      })
    }
  })

export const insertReadingFn = createServerFn({ method: 'POST' })
  .inputValidator(createRecordSchema)
  .handler(async ({ data: input }) => {
    const { requireAuth } = await import('~/features/auth/server-middleware')
    await requireAuth()
    const { insertReading } = await import('./repository')
    const { getDb } = await import('~/lib/db')
    const db = await getDb()

    try {
      return await insertReading(db, {
        ...input.data,
        ph: input.data.ph.toString(),
        temperatureCelsius: input.data.temperatureCelsius.toString(),
        dissolvedOxygenMgL: input.data.dissolvedOxygenMgL.toString(),
        ammoniaMgL: input.data.ammoniaMgL.toString(),
        notes: input.data.notes ?? null,
      })
    } catch (error) {
      throw new AppError('DATABASE_ERROR', {
        message: 'Failed to create water quality record',
        cause: error,
      })
    }
  })

export const updateReadingFn = createServerFn({ method: 'POST' })
  .inputValidator(updateRecordSchema)
  .handler(async ({ data: input }) => {
    const { requireAuth } = await import('~/features/auth/server-middleware')
    await requireAuth()
    const { updateReading } = await import('./repository')
    const { getDb } = await import('~/lib/db')
    const db = await getDb()

    try {
      const updateData: {
        date?: Date
        ph?: string
        temperatureCelsius?: string
        dissolvedOxygenMgL?: string
        ammoniaMgL?: string
        notes?: string | null
      } = {}
      if (input.data.date !== undefined) updateData.date = input.data.date
      if (input.data.ph !== undefined) updateData.ph = input.data.ph.toString()
      if (input.data.temperatureCelsius !== undefined)
        updateData.temperatureCelsius = input.data.temperatureCelsius.toString()
      if (input.data.dissolvedOxygenMgL !== undefined)
        updateData.dissolvedOxygenMgL = input.data.dissolvedOxygenMgL.toString()
      if (input.data.ammoniaMgL !== undefined)
        updateData.ammoniaMgL = input.data.ammoniaMgL.toString()
      if (input.data.notes !== undefined)
        updateData.notes = input.data.notes ?? null

      return await updateReading(db, input.recordId, updateData)
    } catch (error) {
      throw new AppError('DATABASE_ERROR', {
        message: 'Failed to update water quality record',
        cause: error,
      })
    }
  })

export const deleteReadingFn = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ recordId: z.string() }))
  .handler(async ({ data: input }) => {
    const { requireAuth } = await import('~/features/auth/server-middleware')
    await requireAuth()
    const { deleteReading } = await import('./repository')
    const { getDb } = await import('~/lib/db')
    const db = await getDb()

    try {
      return await deleteReading(db, input.recordId)
    } catch (error) {
      throw new AppError('DATABASE_ERROR', {
        message: 'Failed to delete water quality record',
        cause: error,
      })
    }
  })
export type { CreateWaterQualityData } from './types'
