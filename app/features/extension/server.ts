import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

const updateOutbreakAlertSchema = z.object({
  alertId: z.string(),
  status: z.string().optional(),
  notes: z.string().optional(),
})

const getDistrictDashboardSchema = z.object({
  districtId: z.string(),
  page: z.number().optional(),
  pageSize: z.number().optional(),
  livestockType: z.string().optional(),
  healthStatus: z.string().optional(),
  search: z.string().optional(),
})

const getAccessRequestsSchema = z.object({
  farmId: z.string(),
})

const respondToAccessRequestSchema = z.object({
  requestId: z.string(),
  approved: z.boolean(),
})

const revokeAccessSchema = z.object({
  grantId: z.string(),
})

export const updateOutbreakAlertFn = createServerFn({ method: 'POST' })
  .inputValidator(updateOutbreakAlertSchema)
  .handler(() => {
    return { success: true }
  })

export const getDistrictDashboardFn = createServerFn({ method: 'GET' })
  .inputValidator(getDistrictDashboardSchema)
  .handler(() => {
    return {
      district: { name: 'Sample District' },
      stats: {
        totalFarms: 0,
        healthyFarms: 0,
        warningFarms: 0,
        criticalFarms: 0,
      },
      farms: [],
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
      },
    }
  })

export const getSupervisorDashboardFn = createServerFn({
  method: 'GET',
}).handler(() => {
  return {
    districts: [],
    totalDistricts: 0,
  }
})

export const getUserDistrictsFn = createServerFn({ method: 'GET' }).handler(
  () => {
    return []
  },
)

export const getAccessRequestsFn = createServerFn({ method: 'GET' })
  .inputValidator(getAccessRequestsSchema)
  .handler(() => {
    return {
      pendingRequests: [],
      activeGrants: [],
    }
  })

export const respondToAccessRequestFn = createServerFn({ method: 'POST' })
  .inputValidator(respondToAccessRequestSchema)
  .handler(() => {
    return { success: true }
  })

export const revokeAccessFn = createServerFn({ method: 'POST' })
  .inputValidator(revokeAccessSchema)
  .handler(() => {
    return { success: true }
  })
