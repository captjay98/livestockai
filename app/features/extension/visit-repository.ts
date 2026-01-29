import type { Kysely } from 'kysely'
import type { Database } from '~/lib/db/types'

export interface VisitRecordInsert {
  agentId: string
  farmId: string
  visitDate: Date
  visitType: 'routine' | 'emergency' | 'follow_up'
  findings: string
  recommendations: string
  attachments?: Array<{
    name: string
    url: string
    type: string
    size: number
  }>
  followUpDate?: Date | null
}

export interface VisitRecordUpdate {
  visitDate?: Date
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
}

export async function createVisitRecord(
  db: Kysely<Database>,
  data: VisitRecordInsert,
): Promise<string> {
  const result = await db
    .insertInto('visit_records')
    .values({
      ...data,
      attachments: data.attachments || [],
    })
    .returning('id')
    .executeTakeFirstOrThrow()
  return result.id
}

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

export async function getVisitRecord(db: Kysely<Database>, id: string) {
  return await db
    .selectFrom('visit_records')
    .leftJoin('users as agent', 'agent.id', 'visit_records.agentId')
    .leftJoin('farms', 'farms.id', 'visit_records.farmId')
    .select([
      'visit_records.id',
      'visit_records.agentId',
      'visit_records.farmId',
      'visit_records.visitDate',
      'visit_records.visitType',
      'visit_records.findings',
      'visit_records.recommendations',
      'visit_records.attachments',
      'visit_records.followUpDate',
      'visit_records.farmerAcknowledged',
      'visit_records.farmerAcknowledgedAt',
      'visit_records.createdAt',
      'visit_records.updatedAt',
      'agent.name as agentName',
      'farms.name as farmName',
    ])
    .where('visit_records.id', '=', id)
    .executeTakeFirst()
}

export async function getVisitRecordsForFarm(
  db: Kysely<Database>,
  farmId: string,
) {
  return await db
    .selectFrom('visit_records')
    .leftJoin('users as agent', 'agent.id', 'visit_records.agentId')
    .select([
      'visit_records.id',
      'visit_records.agentId',
      'visit_records.visitDate',
      'visit_records.visitType',
      'visit_records.findings',
      'visit_records.recommendations',
      'visit_records.followUpDate',
      'visit_records.farmerAcknowledged',
      'visit_records.createdAt',
      'agent.name as agentName',
    ])
    .where('visit_records.farmId', '=', farmId)
    .orderBy('visit_records.visitDate', 'desc')
    .execute()
}

export async function getVisitRecordsByAgent(
  db: Kysely<Database>,
  agentId: string,
) {
  return await db
    .selectFrom('visit_records')
    .leftJoin('farms', 'farms.id', 'visit_records.farmId')
    .select([
      'visit_records.id',
      'visit_records.farmId',
      'visit_records.visitDate',
      'visit_records.visitType',
      'visit_records.findings',
      'visit_records.recommendations',
      'visit_records.followUpDate',
      'visit_records.farmerAcknowledged',
      'visit_records.createdAt',
      'farms.name as farmName',
    ])
    .where('visit_records.agentId', '=', agentId)
    .orderBy('visit_records.visitDate', 'desc')
    .execute()
}

export async function acknowledgeVisit(
  db: Kysely<Database>,
  id: string,
): Promise<void> {
  await db
    .updateTable('visit_records')
    .set({
      farmerAcknowledged: true,
      farmerAcknowledgedAt: new Date(),
    })
    .where('id', '=', id)
    .execute()
}
