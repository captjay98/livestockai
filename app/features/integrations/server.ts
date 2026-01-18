import { createServerFn } from '@tanstack/react-start'

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
  .inputValidator((data: { to: string }) => data)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('../auth/server-middleware')
    await requireAuth()
    const { sendEmail, emailTemplates } = await import('./email')
    const template = emailTemplates.test()
    return sendEmail({ to: data.to, ...template })
  })

/**
 * Server function to send a test SMS.
 *
 * @param data.to - The recipient phone number.
 * @returns A promise that resolves to the result of sending the SMS.
 */
export const testSMSFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { to: string }) => data)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('../auth/server-middleware')
    await requireAuth()
    const { sendSMS } = await import('./sms')
    return sendSMS({
      to: data.to,
      message: 'OpenLivestock: Your SMS integration is working!',
    })
  })

/**
 * Server function to retrieve the status of integrations.
 *
 * @returns A promise that resolves to the integration status configuration.
 */
export const getIntegrationStatusFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    const { requireAuth } = await import('../auth/server-middleware')
    await requireAuth()
    const { getIntegrationStatus } = await import('./config')
    return getIntegrationStatus()
  },
)
