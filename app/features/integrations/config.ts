import type { IntegrationStatus } from './types'

// Provider-based detection
const SMS_PROVIDERS = ['termii', 'twilio']
const EMAIL_PROVIDERS = ['resend', 'smtp']

export const INTEGRATIONS = {
  email:
    !!process.env.EMAIL_PROVIDER &&
    EMAIL_PROVIDERS.includes(process.env.EMAIL_PROVIDER),
  sms:
    !!process.env.SMS_PROVIDER &&
    SMS_PROVIDERS.includes(process.env.SMS_PROVIDER),
} as const

export function getIntegrationStatus(): Array<IntegrationStatus> {
  return [
    {
      type: 'email',
      enabled: INTEGRATIONS.email,
      configured: INTEGRATIONS.email,
      provider: process.env.EMAIL_PROVIDER || undefined,
    },
    {
      type: 'sms',
      enabled: INTEGRATIONS.sms,
      configured: INTEGRATIONS.sms,
      provider: process.env.SMS_PROVIDER || undefined,
    },
  ]
}
