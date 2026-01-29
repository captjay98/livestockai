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
