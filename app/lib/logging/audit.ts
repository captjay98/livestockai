import { createServerFn } from '@tanstack/react-start'
import { logger } from '../logger'

export type AuditAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'enable_module'
  | 'disable_module'
export type AuditEntityType =
  | 'batch'
  | 'expense'
  | 'mortality'
  | 'water_quality'
  | 'feed_record'
  | 'sale'
  | 'customer'
  | 'supplier'
  | 'farm_module'
  | 'worker_profile'
  | 'worker_check_in'
  | 'task_assignment'
  | 'wage_payment'

export interface AuditLogParams {
  userId: string
  userName?: string
  action: AuditAction
  entityType: AuditEntityType
  entityId: string
  details?: Record<string, any>
  ipAddress?: string
}

/**
 * Records an entry in the system audit trail.
 * Gracefully handles failures to ensure logging never blocks primary business logic.
 *
 * @param params - User info, action type, and entity metadata
 */
export async function logAudit({
  userId,
  userName,
  action,
  entityType,
  entityId,
  details,
  ipAddress,
}: AuditLogParams) {
  try {
    const { getDb } = await import('~/lib/db')
    const db = await getDb()

    // If userName not provided, fetch it from the database
    let resolvedUserName = userName
    if (!resolvedUserName && userId) {
      const user = await db
        .selectFrom('users')
        .select('name')
        .where('id', '=', userId)
        .executeTakeFirst()
      resolvedUserName = user?.name
    }

    await db
      .insertInto('audit_logs')
      .values({
        userId,
        userName: resolvedUserName,
        action,
        entityType,
        entityId,
        details: details ? JSON.stringify(details) : undefined,
        ipAddress,
      })
      .execute()
  } catch (error) {
    // Fail silently to avoiding blocking main action?
    logger.error('Failed to create audit log', {
      error,
      userId,
      action,
      entityType,
      entityId,
    })
  }
}

export interface AuditLogQuery {
  page?: number
  pageSize?: number
  action?: string
  entityType?: string
  search?: string // search details or entityId
}

export interface AuditLogResult {
  data: Array<{
    id: string
    userId: string | null
    userName: string | null
    action: string
    entityType: string
    entityId: string
    details: string | null
    ipAddress: string | null
    createdAt: Date
  }>
  total: number
  page: number
  pageSize: number
  totalPages: number
}

/**
 * Retrieves a paginated list of audit logs.
 * Restricted to administrative access via server function wrapper.
 *
 * @param _userId - ID of the requesting user (for permission check)
 * @param query - Filtering and pagination parameters
 */
export async function getAuditLogs(
  _userId: string, // Admin checking
  query: AuditLogQuery = {},
): Promise<AuditLogResult> {
  const { getDb } = await import('~/lib/db')
  const db = await getDb()
  const { sql } = await import('kysely')
  // Ideally verify admin access here, but usually page loader handles permissions.

  const page = query.page || 1
  const pageSize = query.pageSize || 20
  const offset = (page - 1) * pageSize

  let baseQuery = db
    .selectFrom('audit_logs')
    .leftJoin('users', 'users.id', 'audit_logs.userId')

  if (query.action) {
    baseQuery = baseQuery.where('audit_logs.action', '=', query.action)
  }
  if (query.entityType) {
    baseQuery = baseQuery.where('audit_logs.entityType', '=', query.entityType)
  }
  if (query.search) {
    const term = `%${query.search}%`
    baseQuery = baseQuery.where((eb) =>
      eb.or([
        eb('audit_logs.entityId', 'ilike', term),
        eb('users.name', 'ilike', term),
        // Casting details (jsonb/text) to text for search if possible
        eb(sql`cast(audit_logs.details as text)`, 'ilike', term),
      ]),
    )
  }

  // Count
  const countRes = await baseQuery
    .select(sql<number>`count(*)`.as('count'))
    .executeTakeFirst()
  const total = Number(countRes?.count || 0)
  const totalPages = Math.ceil(total / pageSize)

  // Data
  const data = await baseQuery
    .select([
      'audit_logs.id',
      'audit_logs.userId',
      'audit_logs.action',
      'audit_logs.entityType',
      'audit_logs.entityId',
      'audit_logs.details',
      'audit_logs.ipAddress',
      'audit_logs.createdAt',
      'users.name as userName',
    ])
    .orderBy('audit_logs.createdAt', 'desc')
    .limit(pageSize)
    .offset(offset)
    .execute()

  return {
    data: data.map((log) => ({
      ...log,
      userName: log.userName || 'Unknown',
      // details is already string or object depending on driver, let's treat as is or ensure string
      // Kysely type says string | null in our interface
    })),
    total,
    page,
    pageSize,
    totalPages,
  }
}

export const getAuditLogsFn = createServerFn({ method: 'GET' })
  .inputValidator((data: AuditLogQuery) => data)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/features/auth/server-middleware')
    const session = await requireAuth()

    // Verify admin role
    const { isAdmin } = await import('~/features/auth/utils')
    const admin = await isAdmin(session.user.id)
    if (!admin) {
      throw new Error('Unauthorized: Admin access required')
    }

    return getAuditLogs(session.user.id, data)
  })
