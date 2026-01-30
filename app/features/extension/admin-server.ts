import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { AppError } from '~/lib/errors'

// ============================================
// District Assignment Schemas
// ============================================

const assignUserSchema = z.object({
  userId: z.string().uuid(),
  districtId: z.string().uuid(),
  isSupervisor: z.boolean(),
})

const removeAssignmentSchema = z.object({
  userId: z.string().uuid(),
  districtId: z.string().uuid(),
})

const toggleSupervisorSchema = z.object({
  userId: z.string().uuid(),
  districtId: z.string().uuid(),
})

// ============================================
// Region Management Schemas
// ============================================

const createRegionSchema = z.object({
  countryId: z.string().uuid(),
  parentId: z.string().uuid().optional(),
  level: z.number().int().min(1).max(2),
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100),
})

const updateRegionSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100),
})

const deleteRegionSchema = z.object({
  id: z.string().uuid(),
})

// ============================================
// District Assignment Functions
// ============================================

/**
 * Get all district assignments
 */
export const getDistrictAssignmentsFn = createServerFn({
  method: 'GET',
}).handler(async () => {
  const { requireAdmin } = await import('../auth/server-middleware')
  await requireAdmin()

  const { getDb } = await import('~/lib/db')
  const db = await getDb()

  // Get all users with their district assignments
  const users = await db
    .selectFrom('users')
    .select(['id', 'name', 'email'])
    .execute()

  const assignments = await Promise.all(
    users.map(async (user) => {
      const districts = await db
        .selectFrom('user_districts')
        .innerJoin('regions', 'regions.id', 'user_districts.districtId')
        .select([
          'user_districts.districtId',
          'regions.name as districtName',
          'user_districts.isSupervisor',
          'user_districts.assignedAt',
        ])
        .where('user_districts.userId', '=', user.id)
        .execute()

      return {
        userId: user.id,
        userName: user.name || 'Unknown',
        userEmail: user.email || '',
        districts: districts.map((d) => ({
          districtId: d.districtId,
          districtName: d.districtName,
          isSupervisor: d.isSupervisor,
          assignedAt: d.assignedAt.toISOString(),
        })),
      }
    }),
  )

  // Get all districts for filtering
  const allDistricts = await db
    .selectFrom('regions')
    .select(['id', 'name'])
    .where('level', '=', 2) // District level (2-level system)
    .execute()

  return {
    assignments,
    districts: allDistricts.map((d) => ({
      id: d.id,
      name: d.name,
    })),
  }
})

/**
 * Assign user to district
 */
export const assignUserToDistrictFn = createServerFn({ method: 'POST' })
  .inputValidator(assignUserSchema)
  .handler(async ({ data }) => {
    const { requireAdmin } = await import('../auth/server-middleware')
    await requireAdmin()

    const { getDb } = await import('~/lib/db')
    const db = await getDb()

    // Check if assignment already exists
    const existing = await db
      .selectFrom('user_districts')
      .select('id')
      .where('userId', '=', data.userId)
      .where('districtId', '=', data.districtId)
      .executeTakeFirst()

    if (existing) {
      throw new AppError('VALIDATION_ERROR', {
        message: 'User is already assigned to this district',
      })
    }

    // Create assignment
    await db
      .insertInto('user_districts')
      .values({
        userId: data.userId,
        districtId: data.districtId,
        isSupervisor: data.isSupervisor,
        assignedAt: new Date(),
      })
      .execute()

    const { requireAuth } = await import('../auth/server-middleware')
    const session = await requireAuth()

    // Audit log
    await db
      .insertInto('audit_logs')
      .values({
        userId: session.user.id,
        action: 'user_assigned_to_district',
        entityType: 'user_district',
        entityId: data.userId,
        details: JSON.stringify({
          districtId: data.districtId,
          isSupervisor: data.isSupervisor,
        }),
      })
      .execute()

    return { success: true }
  })

/**
 * Remove user from district
 */
export const removeUserFromDistrictFn = createServerFn({ method: 'POST' })
  .inputValidator(removeAssignmentSchema)
  .handler(async ({ data }) => {
    const { requireAdmin } = await import('../auth/server-middleware')
    await requireAdmin()

    const { getDb } = await import('~/lib/db')
    const db = await getDb()

    // Remove assignment
    await db
      .deleteFrom('user_districts')
      .where('userId', '=', data.userId)
      .where('districtId', '=', data.districtId)
      .execute()

    const { requireAuth } = await import('../auth/server-middleware')
    const session = await requireAuth()

    // Audit log
    await db
      .insertInto('audit_logs')
      .values({
        userId: session.user.id,
        action: 'user_removed_from_district',
        entityType: 'user_district',
        entityId: data.userId,
        details: JSON.stringify({
          districtId: data.districtId,
        }),
      })
      .execute()

    return { success: true }
  })

/**
 * Toggle supervisor status
 */
export const toggleSupervisorStatusFn = createServerFn({ method: 'POST' })
  .inputValidator(toggleSupervisorSchema)
  .handler(async ({ data }) => {
    const { requireAdmin } = await import('../auth/server-middleware')
    const { session } = await requireAdmin()

    const { getDb } = await import('~/lib/db')
    const db = await getDb()

    // Get current status
    const current = await db
      .selectFrom('user_districts')
      .select('isSupervisor')
      .where('userId', '=', data.userId)
      .where('districtId', '=', data.districtId)
      .executeTakeFirst()

    if (!current) {
      throw new AppError('NOT_FOUND', {
        message: 'Assignment not found',
      })
    }

    // Toggle status
    await db
      .updateTable('user_districts')
      .set({ isSupervisor: !current.isSupervisor })
      .where('userId', '=', data.userId)
      .where('districtId', '=', data.districtId)
      .execute()

    // Audit log
    await db
      .insertInto('audit_logs')
      .values({
        userId: session.user.id,
        action: 'supervisor_status_toggled',
        entityType: 'user_district',
        entityId: data.userId,
        details: JSON.stringify({
          districtId: data.districtId,
          newStatus: !current.isSupervisor,
        }),
      })
      .execute()

    return { success: true }
  })

// ============================================
// Region Management Functions
// ============================================

/**
 * Get all countries with their regions
 */
export const getRegionTreeFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    const { requireAdmin } = await import('../auth/server-middleware')
    await requireAdmin()

    const { getDb } = await import('~/lib/db')
    const db = await getDb()

    // Get all countries
    const countries = await db
      .selectFrom('countries')
      .select(['id', 'code', 'name'])
      .execute()

    // Get all regions with farm and agent counts
    const regions = await db
      .selectFrom('regions')
      .leftJoin('farms', 'farms.districtId', 'regions.id')
      .leftJoin('user_districts', 'user_districts.districtId', 'regions.id')
      .select([
        'regions.id',
        'regions.countryId',
        'regions.parentId',
        'regions.level',
        'regions.name',
        'regions.slug',
        'regions.isActive',
      ])
      .select((eb) => [
        eb.fn.countAll<number>().as('farmCount'),
        eb.fn
          .count<number>('user_districts.userId')
          .distinct()
          .as('agentCount'),
      ])
      .groupBy([
        'regions.id',
        'regions.countryId',
        'regions.parentId',
        'regions.level',
        'regions.name',
        'regions.slug',
        'regions.isActive',
      ])
      .execute()

    // Build tree structure
    const tree = countries.map((country) => {
      const countryRegions = regions.filter(
        (r) => r.countryId === country.id && r.level === 1,
      )

      return {
        ...country,
        regions: countryRegions.map((region) => ({
          ...region,
          farmCount: Number(region.farmCount),
          agentCount: Number(region.agentCount),
          districts: regions
            .filter((r) => r.parentId === region.id && r.level === 2)
            .map((district) => ({
              ...district,
              farmCount: Number(district.farmCount),
              agentCount: Number(district.agentCount),
            })),
        })),
      }
    })

    return tree
  },
)

/**
 * Create new region or district
 */
export const createRegionFn = createServerFn({ method: 'POST' })
  .inputValidator(createRegionSchema)
  .handler(async ({ data }) => {
    const { requireAdmin } = await import('../auth/server-middleware')
    const { session } = await requireAdmin()

    const { getDb } = await import('~/lib/db')
    const db = await getDb()

    // Validate level
    if (data.level === 2 && !data.parentId) {
      throw new AppError('VALIDATION_ERROR', {
        message: 'Districts (level 2) must have a parent region',
      })
    }

    // Check for duplicate slug
    const existing = await db
      .selectFrom('regions')
      .select('id')
      .where('slug', '=', data.slug)
      .where('countryId', '=', data.countryId)
      .executeTakeFirst()

    if (existing) {
      throw new AppError('VALIDATION_ERROR', {
        message: 'A region with this slug already exists',
      })
    }

    // Create region
    const result = await db
      .insertInto('regions')
      .values({
        countryId: data.countryId,
        parentId: data.parentId || null,
        level: data.level as 1 | 2,
        name: data.name,
        slug: data.slug,
        isActive: true,
      })
      .returning('id')
      .executeTakeFirstOrThrow()

    // Audit log
    await db
      .insertInto('audit_logs')
      .values({
        userId: session.user.id,
        action: 'region_created',
        entityType: 'region',
        entityId: result.id,
        details: JSON.stringify({
          name: data.name,
          level: data.level,
          parentId: data.parentId,
        }),
      })
      .execute()

    return { id: result.id }
  })

/**
 * Update region name and slug
 */
export const updateRegionFn = createServerFn({ method: 'POST' })
  .inputValidator(updateRegionSchema)
  .handler(async ({ data }) => {
    const { requireAdmin } = await import('../auth/server-middleware')
    const { session } = await requireAdmin()

    const { getDb } = await import('~/lib/db')
    const db = await getDb()

    // Check if region exists
    const region = await db
      .selectFrom('regions')
      .select(['id', 'countryId'])
      .where('id', '=', data.id)
      .executeTakeFirst()

    if (!region) {
      throw new AppError('REGION_NOT_FOUND', {
        message: 'Region not found',
      })
    }

    // Check for duplicate slug (excluding current region)
    const existing = await db
      .selectFrom('regions')
      .select('id')
      .where('slug', '=', data.slug)
      .where('countryId', '=', region.countryId)
      .where('id', '!=', data.id)
      .executeTakeFirst()

    if (existing) {
      throw new AppError('VALIDATION_ERROR', {
        message: 'A region with this slug already exists',
      })
    }

    // Update region
    await db
      .updateTable('regions')
      .set({
        name: data.name,
        slug: data.slug,
      })
      .where('id', '=', data.id)
      .execute()

    // Audit log
    await db
      .insertInto('audit_logs')
      .values({
        userId: session.user.id,
        action: 'region_updated',
        entityType: 'region',
        entityId: data.id,
        details: JSON.stringify({
          name: data.name,
          slug: data.slug,
        }),
      })
      .execute()

    return { success: true }
  })

/**
 * Deactivate region (soft delete)
 */
export const deactivateRegionFn = createServerFn({ method: 'POST' })
  .inputValidator(deleteRegionSchema)
  .handler(async ({ data }) => {
    const { requireAdmin } = await import('../auth/server-middleware')
    const { session } = await requireAdmin()

    const { getDb } = await import('~/lib/db')
    const db = await getDb()

    // Check if region has child regions
    const childCount = await db
      .selectFrom('regions')
      .select((eb) => eb.fn.countAll<number>().as('count'))
      .where('parentId', '=', data.id)
      .where('isActive', '=', true)
      .executeTakeFirstOrThrow()

    if (Number(childCount.count) > 0) {
      throw new AppError('REGION_HAS_CHILDREN', {
        message: 'Cannot deactivate region with active child regions',
      })
    }

    // Check if region has farms
    const farmCount = await db
      .selectFrom('farms')
      .select((eb) => eb.fn.countAll<number>().as('count'))
      .where('districtId', '=', data.id)
      .executeTakeFirstOrThrow()

    if (Number(farmCount.count) > 0) {
      throw new AppError('REGION_HAS_FARMS', {
        message: 'Cannot deactivate region with assigned farms',
      })
    }

    // Deactivate region
    await db
      .updateTable('regions')
      .set({ isActive: false })
      .where('id', '=', data.id)
      .execute()

    // Audit log
    await db
      .insertInto('audit_logs')
      .values({
        userId: session.user.id,
        action: 'region_deactivated',
        entityType: 'region',
        entityId: data.id,
        details: JSON.stringify({}),
      })
      .execute()

    return { success: true }
  })

// ============================================
// Threshold Configuration Schemas
// ============================================

const updateThresholdSchema = z.object({
  species: z.enum([
    'broiler',
    'layer',
    'catfish',
    'tilapia',
    'cattle',
    'goats',
    'sheep',
    'bees',
  ]),
  regionId: z.string().uuid().optional(),
  amberThreshold: z.number().positive().max(100),
  redThreshold: z.number().positive().max(100),
})

const deleteThresholdSchema = z.object({
  id: z.string().uuid(),
})

// ============================================
// Threshold Configuration Functions
// ============================================

/**
 * Get all species thresholds with region overrides
 */
export const getSpeciesThresholdsFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    const { requireAdmin } = await import('../auth/server-middleware')
    await requireAdmin()

    const { getDb } = await import('~/lib/db')
    const db = await getDb()

    // Get all custom thresholds
    const customThresholds = await db
      .selectFrom('species_thresholds')
      .leftJoin('regions', 'regions.id', 'species_thresholds.regionId')
      .select([
        'species_thresholds.id',
        'species_thresholds.species',
        'species_thresholds.regionId',
        'regions.name as regionName',
        'species_thresholds.amberThreshold',
        'species_thresholds.redThreshold',
        'species_thresholds.createdAt',
      ])
      .execute()

    // Get default thresholds from health service
    const { DEFAULT_THRESHOLDS } =
      await import('~/features/extension/health-service')

    // Build response with defaults and overrides
    const species = [
      'broiler',
      'layer',
      'catfish',
      'tilapia',
      'cattle',
      'goats',
      'sheep',
      'bees',
    ] as const

    const thresholds = species.map((s) => {
      const defaults = DEFAULT_THRESHOLDS[s]
      const overrides = customThresholds.filter((t) => t.species === s)

      return {
        species: s,
        amberThreshold: defaults.amber,
        redThreshold: defaults.red,
        overrides: overrides.map((o) => ({
          id: o.id,
          regionId: o.regionId,
          regionName: o.regionName || 'Unknown',
          amberThreshold: Number(o.amberThreshold),
          redThreshold: Number(o.redThreshold),
        })),
      }
    })

    return thresholds
  },
)

/**
 * Create or update species threshold
 */
export const updateSpeciesThresholdFn = createServerFn({ method: 'POST' })
  .inputValidator(updateThresholdSchema)
  .handler(async ({ data }) => {
    const { requireAdmin } = await import('../auth/server-middleware')
    const { session } = await requireAdmin()

    const { getDb } = await import('~/lib/db')
    const db = await getDb()

    // Validate amber < red
    if (data.amberThreshold >= data.redThreshold) {
      throw new AppError('VALIDATION_ERROR', {
        message: 'Amber threshold must be less than red threshold',
      })
    }

    // Check if threshold already exists
    const existing = await db
      .selectFrom('species_thresholds')
      .select('id')
      .where('species', '=', data.species)
      .where('regionId', 'is', data.regionId || null)
      .executeTakeFirst()

    if (existing) {
      // Update existing
      await db
        .updateTable('species_thresholds')
        .set({
          amberThreshold: data.amberThreshold.toString(),
          redThreshold: data.redThreshold.toString(),
        })
        .where('id', '=', existing.id)
        .execute()

      // Audit log
      await db
        .insertInto('audit_logs')
        .values({
          userId: session.user.id,
          action: 'threshold_updated',
          entityType: 'species_threshold',
          entityId: existing.id,
          details: JSON.stringify({
            species: data.species,
            regionId: data.regionId,
            amberThreshold: data.amberThreshold,
            redThreshold: data.redThreshold,
          }),
        })
        .execute()

      return { id: existing.id }
    } else {
      // Create new
      const result = await db
        .insertInto('species_thresholds')
        .values({
          species: data.species,
          regionId: data.regionId || null,
          amberThreshold: data.amberThreshold.toString(),
          redThreshold: data.redThreshold.toString(),
        })
        .returning('id')
        .executeTakeFirstOrThrow()

      // Audit log
      await db
        .insertInto('audit_logs')
        .values({
          userId: session.user.id,
          action: 'threshold_created',
          entityType: 'species_threshold',
          entityId: result.id,
          details: JSON.stringify({
            species: data.species,
            regionId: data.regionId,
            amberThreshold: data.amberThreshold,
            redThreshold: data.redThreshold,
          }),
        })
        .execute()

      return { id: result.id }
    }
  })

/**
 * Delete species threshold (reset to default)
 */
export const deleteSpeciesThresholdFn = createServerFn({ method: 'POST' })
  .inputValidator(deleteThresholdSchema)
  .handler(async ({ data }) => {
    const { requireAdmin } = await import('../auth/server-middleware')
    const { session } = await requireAdmin()

    const { getDb } = await import('~/lib/db')
    const db = await getDb()

    // Delete threshold
    await db
      .deleteFrom('species_thresholds')
      .where('id', '=', data.id)
      .execute()

    // Audit log
    await db
      .insertInto('audit_logs')
      .values({
        userId: session.user.id,
        action: 'threshold_deleted',
        entityType: 'species_threshold',
        entityId: data.id,
        details: JSON.stringify({}),
      })
      .execute()

    return { success: true }
  })
