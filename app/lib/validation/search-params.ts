import { z } from 'zod'

interface SearchValidatorConfig {
  page?: boolean
  pageSize?: boolean | Array<number>
  sortBy?: Array<string>
  sortOrder?: boolean
  search?: boolean | string
  status?: Array<string>
  custom?: Record<string, z.ZodTypeAny>
}

export function createSearchValidator(config: SearchValidatorConfig = {}) {
  const schema: Record<string, z.ZodTypeAny> = {}

  // Pagination
  if (config.page !== false) {
    schema.page = z.coerce.number().min(1).default(1)
  }

  if (config.pageSize !== false) {
    const pageSizeOptions = Array.isArray(config.pageSize)
      ? config.pageSize
      : [10, 25, 50, 100]
    schema.pageSize = z.coerce
      .number()
      .refine((val) => pageSizeOptions.includes(val), {
        message: `Page size must be one of: ${pageSizeOptions.join(', ')}`,
      })
      .default(10)
  }

  // Sorting
  if (config.sortBy && config.sortBy.length > 0) {
    schema.sortBy = z
      .enum(config.sortBy as [string, ...Array<string>])
      .default(config.sortBy[0])
  }

  if (config.sortOrder !== false) {
    schema.sortOrder = z.enum(['asc', 'desc']).default('desc')
  }

  // Search
  if (config.search !== false) {
    const searchKey = typeof config.search === 'string' ? config.search : 'q'
    schema[searchKey] = z.string().optional()
  }

  // Status filtering
  if (config.status && config.status.length > 0) {
    schema.status = z
      .enum(config.status as [string, ...Array<string>])
      .optional()
  }

  // Custom fields
  if (config.custom) {
    Object.assign(schema, config.custom)
  }

  return z.object(schema)
}
