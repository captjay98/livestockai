import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

const createVisitSchema = z.object({
  farmId: z.string(),
  visitDate: z.date(),
  visitType: z.string(),
  findings: z.string(),
  recommendations: z.string(),
  followUpDate: z.date().nullable(),
})

const getVisitRecordsSchema = z.object({
  farmId: z.string(),
})

const acknowledgeVisitSchema = z.object({
  visitId: z.string().uuid(),
})

export const createVisitRecordFn = createServerFn({ method: 'POST' })
  .inputValidator(createVisitSchema)
  .handler(({ data }) => {
    // Minimal implementation
    return { id: 'visit-1', ...data }
  })

export const getVisitRecordsFn = createServerFn({ method: 'GET' })
  .inputValidator(getVisitRecordsSchema)
  .handler(() => {
    // Return empty array for now
    return []
  })

export const acknowledgeVisitFn = createServerFn({ method: 'POST' })
  .inputValidator(acknowledgeVisitSchema)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('../auth/server-middleware')
    const session = await requireAuth()

    const { getDb } = await import('~/lib/db')
    const db = await getDb()

    // Update visit record to mark as acknowledged
    await db
      .updateTable('visit_records')
      .set({ acknowledgedAt: new Date() })
      .where('id', '=', data.visitId)
      .execute()

    return { success: true }
  })
