import { beforeAll, describe, expect, it } from 'vitest'
import { config } from 'dotenv'

config()

describe('Audit Logging', () => {
  // We need a valid user ID for FK constraint usually, but let's see if we can insert straight or if we need to seed a user.
  // The migration has `userId uuid references users.id`. So we need a valid user.
  // We can pick one from the DB or insert a dummy one.

  let validUserId: string
  let logAudit: any
  let getAuditLogs: any
  let db: any

  beforeAll(async () => {
    // Dynamic import to ensure env is loaded
    const auditModule = await import('~/features/logging/audit')
    logAudit = auditModule.logAudit
    getAuditLogs = auditModule.getAuditLogs

    const dbModule = await import('~/lib/db')
    db = dbModule.db

    // find or create a user
    const user = await db.selectFrom('users').select('id').executeTakeFirst()
    if (user) {
      validUserId = user.id
    } else {
      // Create dummy user
      const newUser = await db
        .insertInto('users')
        .values({
          email: 'audit-test@example.com',
          name: 'Audit Tester',
          role: 'admin',
        })
        .returning('id')
        .executeTakeFirstOrThrow()
      validUserId = newUser.id
    }
  })

  it('should log an action and retrieve it', async () => {
    const entityId = 'test-batch-123'
    const details = { foo: 'bar' }

    // 1. Log
    await logAudit({
      userId: validUserId,
      action: 'create',
      entityType: 'batch',
      entityId,
      details,
    })

    // 2. Retrieve
    const result = await getAuditLogs(validUserId, {
      entityType: 'batch',
      search: entityId,
    })

    expect(result.total).toBeGreaterThan(0)
    const log = result.data.find(
      (l: any) => l.entityId === entityId && l.action === 'create',
    )
    expect(log).toBeDefined()
    expect(log?.userId).toBe(validUserId)

    // Check details
    // It comes back as string (if jsonb) or object depending on driver
    // Our code treats it as is.
    if (typeof log?.details === 'string') {
      const parsed = JSON.parse(log.details)
      expect(parsed).toEqual(details)
    } else {
      expect(log?.details).toEqual(details)
    }
  })
})
