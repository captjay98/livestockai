import { z } from 'zod'

export const createBatchSchema = z.object({
  farmId: z.string().uuid(),
  livestockType: z.enum([
    'poultry',
    'fish',
    'cattle',
    'goats',
    'sheep',
    'bees',
  ]),
  species: z.string().min(1).max(100),
  breedId: z.string().uuid().nullish(),
  initialQuantity: z.number().int().positive(),
  acquisitionDate: z.coerce.date(),
  costPerUnit: z.number().nonnegative(),
  batchName: z.string().max(100).nullish(),
  sourceSize: z.string().max(50).nullish(),
  structureId: z.string().uuid().nullish(),
  targetHarvestDate: z.coerce.date().nullish(),
  target_weight_g: z.number().positive().nullish(),
  targetPricePerUnit: z.number().nonnegative().nullish(),
  supplierId: z.string().uuid().nullish(),
  notes: z.string().max(500).nullish(),
})

export const updateBatchSchema = z.object({
  species: z.string().min(1).max(100).optional(),
  status: z.enum(['active', 'depleted', 'sold']).optional(),
  batchName: z.string().max(100).nullish(),
  sourceSize: z.string().max(50).nullish(),
  structureId: z.string().uuid().nullish(),
  targetHarvestDate: z.coerce.date().nullish(),
  target_weight_g: z.number().positive().nullish(),
  notes: z.string().max(500).nullish(),
  /** Expected updatedAt timestamp for conflict detection (offline sync) */
  expectedUpdatedAt: z.coerce.date().optional(),
})

export const paginatedQuerySchema = z.object({
  page: z.number().int().positive().optional().default(1),
  pageSize: z.number().int().positive().max(100).optional().default(10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  search: z.string().optional(),
  farmId: z.string().uuid().optional(),
  status: z.enum(['active', 'depleted', 'sold']).optional(),
  livestockType: z
    .enum(['poultry', 'fish', 'cattle', 'goats', 'sheep', 'bees'])
    .optional(),
  breedId: z.string().uuid().optional(),
})
