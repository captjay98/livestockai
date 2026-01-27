import type { IntegrationStatus } from './types'

// Provider-based detection
const SMS_PROVIDERS = ['console', 'termii', 'twilio']
const EMAIL_PROVIDERS = ['resend', 'smtp']
const STORAGE_PROVIDERS = ['local', 'r2', 's3']

export const INTEGRATIONS = {
  email:
    !!process.env.EMAIL_PROVIDER &&
    EMAIL_PROVIDERS.includes(process.env.EMAIL_PROVIDER),
  sms:
    !!process.env.SMS_PROVIDER &&
    SMS_PROVIDERS.includes(process.env.SMS_PROVIDER),
  storage:
    !!process.env.STORAGE_PROVIDER &&
    STORAGE_PROVIDERS.includes(process.env.STORAGE_PROVIDER),
} as const

export function isStorageConfigured(): boolean {
  const provider = process.env.STORAGE_PROVIDER

  switch (provider) {
    case 'local':
      return true // No credentials needed
    case 'r2':
      return !!(process.env.R2_PUBLIC_CDN_URL || process.env.R2_PRIVATE_URL)
    case 's3':
      return !!(
        (process.env.S3_PUBLIC_BUCKET || process.env.S3_PRIVATE_BUCKET) &&
        process.env.AWS_REGION &&
        process.env.AWS_ACCESS_KEY_ID &&
        process.env.AWS_SECRET_ACCESS_KEY
      )
    default:
      return false
  }
}

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
    {
      type: 'storage',
      enabled: INTEGRATIONS.storage,
      configured: isStorageConfigured(),
      provider: process.env.STORAGE_PROVIDER || undefined,
    },
  ]
}
