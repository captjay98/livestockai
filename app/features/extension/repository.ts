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
    const { districtId, page = 1, pageSize = 20 } = params

    // Get farms in district with active access grants
    const farms = await db
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
        .groupBy(['farms.id', 'farms.name', 'farms.location'])
        .limit(pageSize)
        .offset((page - 1) * pageSize)
        .execute()

    // Get total count
    const countResult = await db
        .selectFrom('farms')
        .innerJoin('access_grants', 'access_grants.farmId', 'farms.id')
        .select(db.fn.countAll().as('total'))
        .where('farms.districtId', '=', districtId)
        .where('access_grants.revokedAt', 'is', null)
        .where('access_grants.expiresAt', '>', new Date())
        .executeTakeFirst()

    return {
        farms: farms.map(f => ({
            ...f,
            batchCount: Number(f.batchCount),
            healthStatus: 'green' as const,
        })),
        total: Number(countResult?.total || 0),
        page,
        pageSize,
    }
}
