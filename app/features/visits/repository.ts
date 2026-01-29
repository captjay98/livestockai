/**
 * Database operations for extension worker visit records.
 * All functions are pure data access - no business logic.
 */

import type { Kysely } from 'kysely'
import type { Database } from '~/lib/db/types'

/**
 * Data for inserting a new visit record
 */
export interface VisitRecordInsert {
  agentId: string
  farmId: string
  visitDate: Date
  visitType: 'routine' | 'emergency' | 'follow_up'
  findings: string
  recommendations: string
  attachments: Array<{
    name: string
    url: string
    type: string
    size: number
  }>
  followUpDate: Date | null
}

/**
 * Data for updating a visit record
 */
export interface VisitRecordUpdate {
  visitType?: 'routine' | 'emergency' | 'follow_up'
  findings?: string
  recommendations?: string
  attachments?: Array<{
    name: string
    url: string
    type: string
    size: number
  }>
  followUpDate?: Date | null
  farmerAcknowledged?: boolean
  farmerAcknowledgedAt?: Date | null
}

/**
 * Insert a new visit record
 */
export async function insertVisitRecord(
  db: Kysely<Database>,
  data: VisitRecordInsert,
): Promise<string> {
  const result = await db
    .insertInto('visit_records')
    .values(data)
    .returning('id')
    .executeTakeFirstOrThrow()
  return result.id
}

/**
 * Get visit record by ID
 */
export async function getVisitRecordById(db: Kysely<Database>, id: string) {
  return db
    .selectFrom('visit_records')
    .select([
      'id',
      'agentId',
      'farmId',
      'visitDate',
      'visitType',
      'findings',
      'recommendations',
      'attachments',
      'followUpDate',
      'farmerAcknowledged',
      'farmerAcknowledgedAt',
      'createdAt',
      'updatedAt',
    ])
    .where('id', '=', id)
    .executeTakeFirst()
}

/**
 * Get visit records for a farm
 */
export async function getVisitRecordsByFarm(
  db: Kysely<Database>,
  farmId: string,
) {
  return db
    .selectFrom('visit_records')
    .select([
      'id',
      'agentId',
      'farmId',
      'visitDate',
      'visitType',
      'findings',
      'recommendations',
      'attachments',
      'followUpDate',
      'farmerAcknowledged',
      'farmerAcknowledgedAt',
      'createdAt',
      'updatedAt',
    ])
    .where('farmId', '=', farmId)
    .orderBy('visitDate', 'desc')
    .execute()
}

/**
 * Get visit records by agent
 */
export async function getVisitRecordsByAgent(
  db: Kysely<Database>,
  agentId: string,
) {
  return db
    .selectFrom('visit_records')
    .select([
      'id',
      'agentId',
      'farmId',
      'visitDate',
      'visitType',
      'findings',
      'recommendations',
      'attachments',
      'followUpDate',
      'farmerAcknowledged',
      'farmerAcknowledgedAt',
      'createdAt',
      'updatedAt',
    ])
    .where('agentId', '=', agentId)
    .orderBy('visitDate', 'desc')
    .execute()
}

/**
 * Update visit record
 */
export async function updateVisitRecord(
  db: Kysely<Database>,
  id: string,
  data: VisitRecordUpdate,
): Promise<void> {
  await db
    .updateTable('visit_records')
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where('id', '=', id)
    .execute()
}

/**
 * Mark visit as acknowledged by farmer
 */
export async function acknowledgeVisit(
  db: Kysely<Database>,
  id: string,
): Promise<void> {
  await db
    .updateTable('visit_records')
    .set({
      farmerAcknowledged: true,
      farmerAcknowledgedAt: new Date(),
      updatedAt: new Date(),
    })
    .where('id', '=', id)
    .execute()
}

/**
 * Get pending follow-ups for an agent
 */
export async function getPendingFollowUps(
  db: Kysely<Database>,
  agentId: string,
) {
  const today = new Date()
  return db
    .selectFrom('visit_records')
    .select([
      'id',
      'agentId',
      'farmId',
      'visitDate',
      'visitType',
      'findings',
      'recommendations',
      'followUpDate',
      'farmerAcknowledged',
    ])
    .where('agentId', '=', agentId)
    .where('followUpDate', 'is not', null)
    .where('followUpDate', '<=', today)
    .orderBy('followUpDate', 'asc')
    .execute()
}
