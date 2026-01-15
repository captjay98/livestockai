export type IntegrationType = 'email' | 'sms'

export interface IntegrationStatus {
  type: IntegrationType
  enabled: boolean
  configured: boolean
  provider?: string
}

export interface SendEmailOptions {
  to: string
  subject: string
  html: string
}

export interface SendSMSOptions {
  to: string
  message: string
}

export interface IntegrationResult {
  success: boolean
  messageId?: string
  error?: string
}
