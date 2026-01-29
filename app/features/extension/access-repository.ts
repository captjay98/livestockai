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
  requesterId: string,
  farmId: string,
  purpose: string,
  durationDays: number,
) {
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 30) // Request expires in 30 days if not responded

  const result = await db
    .insertInto('access_requests')
    .values({
      requesterId,
      farmId,
      purpose,
      requestedDurationDays: durationDays,
      status: 'pending',
      expiresAt,
    })
    .returning('id')
    .executeTakeFirstOrThrow()
  return result.id
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
  rejectionReason?: string,
) {
  await db
    .updateTable('access_requests')
    .set({
      status: approved ? 'approved' : 'denied',
      responderId,
      rejectionReason: rejectionReason || null,
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
  userId: string,
  farmId: string,
  grantedBy: string,
  expiresAt: Date,
  financialVisibility: boolean = false,
  accessRequestId?: string,
) {
  const result = await db
    .insertInto('access_grants')
    .values({
      userId,
      farmId,
      grantedBy,
      expiresAt,
      financialVisibility,
      accessRequestId: accessRequestId || null,
    })
    .returning('id')
    .executeTakeFirstOrThrow()
  return result.id
}

/**
 * Get active access grant
 */
export async function getActiveAccessGrant(
  db: Kysely<Database>,
  userId: string,
  farmId: string,
) {
  return await db
    .selectFrom('access_grants')
    .selectAll()
    .where('userId', '=', userId)
    .where('farmId', '=', farmId)
    .where('revokedAt', 'is', null)
    .where('expiresAt', '>', new Date())
    .executeTakeFirst()
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
  reason: string,
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
