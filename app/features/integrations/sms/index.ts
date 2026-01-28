import type { SMSProvider } from '../contracts'
import type { IntegrationResult, SendSMSOptions } from '../types'

type ProviderFactory = () => Promise<SMSProvider>

const providers = new Map<string, ProviderFactory>([
    [
        'console',
        async () => new (await import('./providers/console')).ConsoleProvider(),
    ],
    [
        'termii',
        async () => new (await import('./providers/termii')).TermiiProvider(),
    ],
    [
        'twilio',
        async () => new (await import('./providers/twilio')).TwilioProvider(),
    ],
])

async function getProvider(): Promise<SMSProvider | null> {
    const name = process.env.SMS_PROVIDER
    if (!name) return null
    const factory = providers.get(name)
    if (!factory) return null
    return factory()
}

export async function sendSMS(
    options: SendSMSOptions,
): Promise<IntegrationResult> {
    const provider = await getProvider()
    if (!provider) {
        return { success: false, error: 'SMS provider not configured' }
    }
    return provider.send(options.to, options.message)
}

export function getSMSProviderName(): string | null {
    return process.env.SMS_PROVIDER || null
}

export function isSMSConfigured(): boolean {
    const name = process.env.SMS_PROVIDER
    return !!name && providers.has(name)
}
