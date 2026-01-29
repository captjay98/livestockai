import type { EmailProvider, ProviderResult } from '../../contracts'

export class ResendProvider implements EmailProvider {
  readonly name = 'resend'

  async send(
    to: string,
    subject: string,
    html: string,
  ): Promise<ProviderResult> {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      return { success: false, error: 'RESEND_API_KEY not configured' }
    }

    try {
      const { Resend } = await import('resend')
      const resend = new Resend(apiKey)

      const result = await resend.emails.send({
        from: process.env.EMAIL_FROM || 'LivestockAI <noreply@livestockai.app>',
        to,
        subject,
        html,
      })

      if (result.error) {
        return { success: false, error: result.error.message }
      }

      return { success: true, messageId: result.data.id }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }
}
