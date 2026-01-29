import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { AppError } from '~/lib/errors'

/**
 * @module Integrations
 *
 * Server-side functions for handling external integrations (Email, SMS).
 * Provides test functions and status checks for configured providers.
 */

/**
 * Server function to send a test email.
 *
 * @param data.to - The recipient email address.
 * @returns A promise that resolves to the result of sending the email.
 */
export const testEmailFn = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ to: z.string().email() }))
  .handler(async ({ data }) => {
    try {
      const { requireAuth } = await import('../auth/server-middleware')
      await requireAuth()
      const { sendEmail, emailTemplates } = await import('./email')
      const template = emailTemplates.test()
      return await sendEmail({ to: data.to, ...template })
    } catch (error) {
      if (error instanceof AppError) throw error
      throw new AppError('INTERNAL_ERROR', {
        message: 'Failed to send test email',
        cause: error,
      })
    }
  })

/**
 * Server function to send a test SMS.
 *
 * @param data.to - The recipient phone number.
 * @returns A promise that resolves to the result of sending the SMS.
 */
export const testSMSFn = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ to: z.string().min(1) }))
  .handler(async ({ data }) => {
    try {
      const { requireAuth } = await import('../auth/server-middleware')
      await requireAuth()
      const { sendSMS } = await import('./sms')
      return await sendSMS({
        to: data.to,
        message: 'LivestockAI: Your SMS integration is working!',
      })
    } catch (error) {
      if (error instanceof AppError) throw error
      throw new AppError('INTERNAL_ERROR', {
        message: 'Failed to send test SMS',
        cause: error,
      })
    }
  })

/**
 * Server function to retrieve the status of integrations.
 *
 * @returns A promise that resolves to the integration status configuration.
 */
export const getIntegrationStatusFn = createServerFn({ method: 'GET' })
  .inputValidator(z.object({}))
  .handler(async () => {
    try {
      const { requireAuth } = await import('../auth/server-middleware')
      await requireAuth()
      const { getIntegrationStatus } = await import('./config')
      return await getIntegrationStatus()
    } catch (error) {
      if (error instanceof AppError) throw error
      throw new AppError('INTERNAL_ERROR', {
        message: 'Failed to retrieve integration status',
        cause: error,
      })
    }
  })
