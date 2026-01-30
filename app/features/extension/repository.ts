/**
 * Re-export all repository functions for convenience
 * Maps function names used in server.ts to actual implementations
 */

// Access repository exports
// District dashboard query - complex aggregation
import type { Kysely } from 'kysely'
import type { Database } from '~/lib/db/types'

export {
  createAccessRequest,
  getAccessRequest,
  getAccessRequestsForFarm,
  getAccessRequestsByUser,
  respondToAccessRequest,
  createAccessGrant,
  getActiveAccessGrant,
  getAccessibleFarms as getMyAccessGrants,
  revokeAccessGrant as revokeAccess,
} from './access-repository'

// Alias for server.ts compatibility
export { getAccessRequestsForFarm as getAccessRequests } from './access-repository'

// Regions repository exports
export {
  getCountries,
  getRegionsByCountry,
  getDistrictsByRegion,
  getRegionById,
  createRegion,
  updateRegion,
  deleteRegion,
} from './regions-repository'

// User districts repository exports
export {
  assignUserToDistrict,
  getUserDistricts,
  getDistrictUsers,
  removeUserFromDistrict,
  isSupervisor,
} from './user-districts-repository'

// Outbreak repository exports
export {
  createOutbreakAlert,
  getOutbreakAlert,
  getActiveAlerts,
  addFarmToAlert,
  updateAlertStatus,
  resolveAlert,
} from './outbreak-repository'

// Visit repository exports
export {
  createVisitRecord,
  updateVisitRecord,
  getVisitRecord,
  getVisitRecordsForFarm,
  getVisitRecordsByAgent,
  acknowledgeVisit,
} from './visit-repository'

interface DistrictDashboardParams {
  districtId: string
  page?: number
  pageSize?: number
  livestockType?: string
  healthStatus?: string
}

export async function getDistrictDashboard(
  db: Kysely<Database>,
  params: DistrictDashboardParams,
) {
  const { districtId, page = 1, pageSize = 20, livestockType } = params

  // Build base query for farms in district with active access grants
  let farmsQuery = db
    .selectFrom('farms')
    .innerJoin('access_grants', 'access_grants.farmId', 'farms.id')
    .leftJoin('batches', 'batches.farmId', 'farms.id')
    .select([
      'farms.id as farmId',
      'farms.name as farmName',
      'farms.location',
      db.fn.count('batches.id').as('batchCount'),
    ])
    .where('farms.districtId', '=', districtId)
    .where('access_grants.revokedAt', 'is', null)
    .where('access_grants.expiresAt', '>', new Date())

  // Filter by livestock type if provided (filter by batch livestockType)
  if (livestockType) {
    farmsQuery = farmsQuery.where(
      'batches.livestockType',
      '=',
      livestockType as any,
    )
  }

  const farms = await farmsQuery
    .groupBy(['farms.id', 'farms.name', 'farms.location'])
    .limit(pageSize)
    .offset((page - 1) * pageSize)
    .execute()

  // Build count query with same filters
  let countQuery = db
    .selectFrom('farms')
    .innerJoin('access_grants', 'access_grants.farmId', 'farms.id')
    .where('farms.districtId', '=', districtId)
    .where('access_grants.revokedAt', 'is', null)
    .where('access_grants.expiresAt', '>', new Date())

  // Apply livestock type filter to count query as well
  if (livestockType) {
    countQuery = countQuery
      .innerJoin('batches', 'batches.farmId', 'farms.id')
      .where('batches.livestockType', '=', livestockType as any)
  }

  const countResult = await countQuery
    .select(db.fn.countAll().as('total'))
    .executeTakeFirst()

  return {
    farms: farms.map((f) => ({
      ...f,
      batchCount: Number(f.batchCount),
      healthStatus: 'green' as const,
    })),
    total: Number(countResult?.total || 0),
    page,
    pageSize,
  }
}
