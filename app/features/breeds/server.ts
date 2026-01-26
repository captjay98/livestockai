/**
 * Server functions for breeds
 */

import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import type { ModuleKey } from './types'
import { AppError } from '~/lib/errors'

const moduleKeySchema = z.enum([
  'poultry',
  'aquaculture',
  'cattle',
  'goats',
  'sheep',
  'bees',
])

export const getBreedsForModuleFn = createServerFn({ method: 'GET' })
  .inputValidator(
    z.object({
      moduleKey: moduleKeySchema,
    }),
  )
  .handler(async ({ data }) => {
    try {
      const { getDb } = await import('~/lib/db')
      const db = await getDb()
      const { getBreedsByModule } = await import('./repository')

      return getBreedsByModule(db, data.moduleKey as ModuleKey)
    } catch (error) {
      if (error instanceof AppError) throw error
      throw new AppError('DATABASE_ERROR', {
        message: 'Failed to fetch breeds for module',
        cause: error,
      })
    }
  })

export const getBreedsForSpeciesFn = createServerFn({ method: 'GET' })
  .inputValidator(
    z.object({
      speciesKey: z.string().min(1),
    }),
  )
  .handler(async ({ data }) => {
    try {
      const { getDb } = await import('~/lib/db')
      const db = await getDb()
      const { getBreedsBySpecies } = await import('./repository')

      return getBreedsBySpecies(db, data.speciesKey)
    } catch (error) {
      if (error instanceof AppError) throw error
      throw new AppError('DATABASE_ERROR', {
        message: 'Failed to fetch breeds for species',
        cause: error,
      })
    }
  })

export const getBreedByIdFn = createServerFn({ method: 'GET' })
  .inputValidator(
    z.object({
      breedId: z.string().uuid(),
    }),
  )
  .handler(async ({ data }) => {
    try {
      const { getDb } = await import('~/lib/db')
      const db = await getDb()
      const { getBreedById } = await import('./repository')

      const breed = await getBreedById(db, data.breedId)
      if (!breed) {
        throw new AppError('BREED_NOT_FOUND', {
          metadata: { breedId: data.breedId },
        })
      }

      return breed
    } catch (error) {
      if (error instanceof AppError) throw error
      throw new AppError('DATABASE_ERROR', {
        message: 'Failed to fetch breed',
        cause: error,
      })
    }
  })

export const getSpeciesForModuleFn = createServerFn({ method: 'GET' })
  .inputValidator(
    z.object({
      moduleKey: moduleKeySchema,
    }),
  )
  .handler(async ({ data }) => {
    try {
      const { getDb } = await import('~/lib/db')
      const db = await getDb()
      const { getSpeciesForModule } = await import('./repository')

      return getSpeciesForModule(db, data.moduleKey as ModuleKey)
    } catch (error) {
      if (error instanceof AppError) throw error
      throw new AppError('DATABASE_ERROR', {
        message: 'Failed to fetch species for module',
        cause: error,
      })
    }
  })

export const getSpeciesForLivestockTypeFn = createServerFn({ method: 'GET' })
  .inputValidator(
    z.object({
      livestockType: z.string().min(1),
    }),
  )
  .handler(async ({ data }) => {
    try {
      const { getDb } = await import('~/lib/db')
      const db = await getDb()
      const { getSpeciesForLivestockType } = await import('./repository')

      return getSpeciesForLivestockType(db, data.livestockType)
    } catch (error) {
      if (error instanceof AppError) throw error
      throw new AppError('DATABASE_ERROR', {
        message: 'Failed to fetch species for livestock type',
        cause: error,
      })
    }
  })


export const submitBreedRequestFn = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      moduleKey: z.string(),
      speciesKey: z.string(),
      breedName: z.string().min(1),
      typicalMarketWeightG: z.number().int().positive().optional(),
      typicalDaysToMarket: z.number().int().positive().optional(),
      typicalFcr: z.number().positive().optional(),
      source: z.string().optional(),
      userEmail: z.string().email().optional(),
      notes: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const { requireAuth } = await import('../auth/server-middleware')
    const session = await requireAuth()
    const { getDb } = await import('~/lib/db')
    const db = await getDb()

    await db
      .insertInto('breed_requests')
      .values({
        userId: session.user.id,
        moduleKey: data.moduleKey,
        speciesKey: data.speciesKey,
        breedName: data.breedName,
        typicalMarketWeightG: data.typicalMarketWeightG || null,
        typicalDaysToMarket: data.typicalDaysToMarket || null,
        typicalFcr: data.typicalFcr ? data.typicalFcr.toString() : null,
        source: data.source || null,
        userEmail: data.userEmail || null,
        notes: data.notes || null,
        status: 'pending',
      })
      .execute()
  })
