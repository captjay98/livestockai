import type {
  EmailProvider,
  ProviderResult,
} from '../../app/features/integrations/contracts'

/**
 * Resend Email Provider Implementation (Core Service)
 *
 * Resend is a modern email API built for developers,
 * emphasizing speed and a clean API design.
 *
 * This example demonstrates:
 * 1. Dynamic imports of SDKs (optional, but clean)
 * 2. Standardizing SDK results to ProviderResult
 * 3. Configuration fallback patterns
 *
 * @see https://resend.com/docs/api-reference/emails/send-email
 */
export class ResendProvider implements EmailProvider {
  readonly name = 'resend'

  async send(
    to: string,
    subject: string,
    html: string,
  ): Promise<ProviderResult> {
    const apiKey = process.env.RESEND_API_KEY
    const fromAddress =
      process.env.EMAIL_FROM || 'LivestockAI <noreply@livestockai.app>'

    if (!apiKey) {
      return {
        success: false,
        error: 'RESEND_API_KEY not configured',
      }
    }

    try {
      /**
       * In the core app, we import the SDK dynamically.
       * This keeps the bundle size small if Resend isn't being used.
       */
      const { Resend } = await import('resend')
      const resend = new Resend(apiKey)

      const result = await resend.emails.send({
        from: fromAddress,
        to: to,
        subject: subject,
        html: html,
      })

      if (result.error) {
        return {
          success: false,
          error: result.error.message,
        }
      }

      return {
        success: true,
        messageId: result.data.id,
      }
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Unknown Resend communication error',
      }
    }
  }
}
