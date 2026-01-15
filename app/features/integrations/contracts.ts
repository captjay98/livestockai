/**
 * Result returned by all provider operations
 */
export interface ProviderResult {
  success: boolean
  messageId?: string
  error?: string
}

/**
 * SMS Provider Contract
 * Implement this interface to add a new SMS provider
 */
export interface SMSProvider {
  readonly name: string
  send: (to: string, message: string) => Promise<ProviderResult>
}

/**
 * Email Provider Contract
 * Implement this interface to add a new Email provider
 */
export interface EmailProvider {
  readonly name: string
  send: (to: string, subject: string, html: string) => Promise<ProviderResult>
}
