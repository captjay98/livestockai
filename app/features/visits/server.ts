import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import {
  acknowledgeVisit,
  createVisitRecord,
  getVisitRecordsForFarm,
} from '~/features/extension/visit-repository'

const createVisitSchema = z.object({
  farmId: z.string(),
  visitDate: z.date(),
  visitType: z.string(),
  findings: z.string(),
  recommendations: z.string(),
  followUpDate: z.date().nullable(),
  attachments: z.array(z.string()).optional(),
})

const getVisitRecordsSchema = z.object({
  farmId: z.string(),
})

const acknowledgeVisitSchema = z.object({
  visitId: z.string().uuid(),
})

export const createVisitRecordFn = createServerFn({ method: 'POST' })
  .inputValidator(createVisitSchema)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('../auth/server-middleware')
    const session = await requireAuth()

    const { getDb } = await import('~/lib/db')
    const db = await getDb()

    const visitId = await createVisitRecord(db, {
      ...data,
      visitType: data.visitType as any,
      agentId: session.user.id,
      attachments: data.attachments?.map((url) => ({
        name: url.split('/').pop() || 'file',
        url,
        type: 'application/octet-stream', // simplified
        size: 0,
      })),
    })

    return { id: visitId, ...data }
  })

export const getVisitRecordsFn = createServerFn({ method: 'GET' })
  .inputValidator(getVisitRecordsSchema)
  .handler(async ({ data }) => {
    const { getDb } = await import('~/lib/db')
    const db = await getDb()
    return await getVisitRecordsForFarm(db, data.farmId)
  })

export const acknowledgeVisitFn = createServerFn({ method: 'POST' })
  .inputValidator(acknowledgeVisitSchema)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('../auth/server-middleware')
    await requireAuth()

    const { getDb } = await import('~/lib/db')
    const db = await getDb()

    await acknowledgeVisit(db, data.visitId)

    return { success: true }
  })
