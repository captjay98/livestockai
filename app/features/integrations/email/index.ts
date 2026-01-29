import type { EmailProvider } from '../contracts'
import type { IntegrationResult, SendEmailOptions } from '../types'

type ProviderFactory = () => Promise<EmailProvider>

const providers = new Map<string, ProviderFactory>([
  [
    'resend',
    async () => new (await import('./providers/resend')).ResendProvider(),
  ],
  ['smtp', async () => new (await import('./providers/smtp')).SMTPProvider()],
])

async function getProvider(): Promise<EmailProvider | null> {
  const name = process.env.EMAIL_PROVIDER
  if (!name) return null
  const factory = providers.get(name)
  if (!factory) return null
  return factory()
}

export async function sendEmail(
  options: SendEmailOptions,
): Promise<IntegrationResult> {
  const provider = await getProvider()
  if (!provider) {
    return { success: false, error: 'Email provider not configured' }
  }
  return provider.send(options.to, options.subject, options.html)
}

export function getEmailProviderName(): string | null {
  return process.env.EMAIL_PROVIDER || null
}

export function isEmailConfigured(): boolean {
  const name = process.env.EMAIL_PROVIDER
  return !!name && providers.has(name)
}

export { emailTemplates } from './templates'
