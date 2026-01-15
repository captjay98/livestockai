import { createServerFn } from '@tanstack/react-start'

export const testEmailFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { to: string }) => data)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('../auth/server-middleware')
    await requireAuth()
    const { sendEmail } = await import('./email/service')
    const { emailTemplates } = await import('./email/templates')
    const template = emailTemplates.test()
    return sendEmail({ to: data.to, ...template })
  })

export const testSMSFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { to: string }) => data)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('../auth/server-middleware')
    await requireAuth()
    const { sendSMS } = await import('./sms/service')
    return sendSMS({
      to: data.to,
      message: 'OpenLivestock: Your SMS integration is working!',
    })
  })

export const getIntegrationStatusFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    const { requireAuth } = await import('../auth/server-middleware')
    await requireAuth()
    const { getIntegrationStatus } = await import('./config')
    return getIntegrationStatus()
  },
)
