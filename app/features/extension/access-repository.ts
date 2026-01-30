/**
 * Database operations for access requests and grants.
 * All functions are pure data access - no business logic.
 */

import type { Kysely } from 'kysely'
import type { Database } from '~/lib/db/types'

/**
 * Create access request
 */
export async function createAccessRequest(
  db: Kysely<Database>,
  data: {
    requesterId: string
    farmId: string
    purpose: string
    requestedDurationDays: number
  },
) {
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 30)

  const result = await db
    .insertInto('access_requests')
    .values({
      requesterId: data.requesterId,
      farmId: data.farmId,
      purpose: data.purpose,
      requestedDurationDays: data.requestedDurationDays,
      status: 'pending',
      expiresAt,
    })
    .returning(['id', 'status'])
    .executeTakeFirstOrThrow()
  return result
}

/**
 * Get access request by ID
 */
export async function getAccessRequest(db: Kysely<Database>, id: string) {
  return await db
    .selectFrom('access_requests')
    .leftJoin(
      'users as requester',
      'requester.id',
      'access_requests.requesterId',
    )
    .leftJoin(
      'users as responder',
      'responder.id',
      'access_requests.responderId',
    )
    .leftJoin('farms', 'farms.id', 'access_requests.farmId')
    .select([
      'access_requests.id',
      'access_requests.requesterId',
      'access_requests.farmId',
      'access_requests.purpose',
      'access_requests.requestedDurationDays',
      'access_requests.status',
      'access_requests.responderId',
      'access_requests.rejectionReason',
      'access_requests.createdAt',
      'access_requests.respondedAt',
      'requester.name as requesterName',
      'requester.email as requesterEmail',
      'responder.name as responderName',
      'farms.name as farmName',
    ])
    .where('access_requests.id', '=', id)
    .executeTakeFirst()
}

/**
 * Get access requests for farm
 */
export async function getAccessRequestsForFarm(
  db: Kysely<Database>,
  farmId: string,
) {
  return await db
    .selectFrom('access_requests')
    .leftJoin(
      'users as requester',
      'requester.id',
      'access_requests.requesterId',
    )
    .select([
      'access_requests.id',
      'access_requests.requesterId',
      'access_requests.purpose',
      'access_requests.requestedDurationDays',
      'access_requests.status',
      'access_requests.createdAt',
      'requester.name as requesterName',
      'requester.email as requesterEmail',
    ])
    .where('access_requests.farmId', '=', farmId)
    .orderBy('access_requests.createdAt', 'desc')
    .execute()
}

/**
 * Get access requests by user
 */
export async function getAccessRequestsByUser(
  db: Kysely<Database>,
  userId: string,
) {
  return await db
    .selectFrom('access_requests')
    .leftJoin('farms', 'farms.id', 'access_requests.farmId')
    .select([
      'access_requests.id',
      'access_requests.farmId',
      'access_requests.purpose',
      'access_requests.requestedDurationDays',
      'access_requests.status',
      'access_requests.rejectionReason',
      'access_requests.createdAt',
      'access_requests.respondedAt',
      'farms.name as farmName',
    ])
    .where('access_requests.requesterId', '=', userId)
    .orderBy('access_requests.createdAt', 'desc')
    .execute()
}

/**
 * Respond to access request
 */
export async function respondToAccessRequest(
  db: Kysely<Database>,
  id: string,
  responderId: string,
  approved: boolean,
  rejectionReason?: string | null,
) {
  await db
    .updateTable('access_requests')
    .set({
      status: approved ? 'approved' : 'denied',
      responderId,
      rejectionReason: rejectionReason ?? null,
      respondedAt: new Date(),
    })
    .where('id', '=', id)
    .execute()
}

/**
 * Create access grant
 */
export async function createAccessGrant(
  db: Kysely<Database>,
  data: {
    userId: string
    farmId: string
    grantedBy: string
    expiresAt: Date
    financialVisibility?: boolean
    accessRequestId?: string
  },
) {
  const result = await db
    .insertInto('access_grants')
    .values({
      userId: data.userId,
      farmId: data.farmId,
      grantedBy: data.grantedBy,
      expiresAt: data.expiresAt,
      financialVisibility: data.financialVisibility ?? false,
      accessRequestId: data.accessRequestId || null,
    })
    .returning('id')
    .executeTakeFirstOrThrow()
  return result.id
}

/**
 * Get active access grant - returns null if no active grant found
 */
export async function getActiveAccessGrant(
  db: Kysely<Database>,
  userId: string,
  farmId: string,
) {
  const result = await db
    .selectFrom('access_grants')
    .select([
      'id',
      'userId',
      'farmId',
      'accessRequestId',
      'grantedBy',
      'grantedAt',
      'expiresAt',
      'financialVisibility',
      'revokedAt',
      'revokedBy',
      'revokedReason',
    ])
    .where('userId', '=', userId)
    .where('farmId', '=', farmId)
    .where('revokedAt', 'is', null)
    .where('expiresAt', '>', new Date())
    .executeTakeFirst()

  return result ?? null
}

/**
 * Get accessible farms for user
 */
export async function getAccessibleFarms(db: Kysely<Database>, userId: string) {
  return await db
    .selectFrom('access_grants')
    .leftJoin('farms', 'farms.id', 'access_grants.farmId')
    .select([
      'access_grants.farmId',
      'access_grants.financialVisibility',
      'access_grants.expiresAt',
      'farms.name as farmName',
      'farms.location as farmLocation',
    ])
    .where('access_grants.userId', '=', userId)
    .where('access_grants.revokedAt', 'is', null)
    .where('access_grants.expiresAt', '>', new Date())
    .execute()
}

/**
 * Revoke access grant
 */
export async function revokeAccessGrant(
  db: Kysely<Database>,
  id: string,
  revokedBy: string,
  reason: string | null,
) {
  await db
    .updateTable('access_grants')
    .set({
      revokedBy,
      revokedAt: new Date(),
      revokedReason: reason,
    })
    .where('id', '=', id)
    .execute()
}
