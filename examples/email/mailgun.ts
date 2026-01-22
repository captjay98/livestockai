import type {
  EmailProvider,
  ProviderResult,
} from '../../app/features/integrations/contracts'

/**
 * Mailgun Email Provider Implementation (Global)
 *
 * Mailgun is highly popular among developers for its advanced
 * logging, searchability, and flexible email APIs.
 *
 * This example demonstrates:
 * 1. Using standard fetch for Mailgun (avoiding bulky SDKs)
 * 2. Multi-region handling (US vs EU)
 * 3. FormData-based API payload
 *
 * @see https://documentation.mailgun.com/en/latest/api-sending.html
 */
export class MailgunProvider implements EmailProvider {
  readonly name = 'mailgun'

  async send(
    to: string,
    subject: string,
    html: string,
  ): Promise<ProviderResult> {
    const apiKey = process.env.MAILGUN_API_KEY
    const domain = process.env.MAILGUN_DOMAIN
    const region = process.env.MAILGUN_REGION || 'us' // 'us' or 'eu'

    if (!apiKey || !domain) {
      return {
        success: false,
        error: 'Missing Mailgun API key or Domain',
      }
    }

    try {
      // Mailgun has different endpoints for different regions
      const baseUrl =
        region === 'eu'
          ? 'https://api.eu.mailgun.net/v3'
          : 'https://api.mailgun.net/v3'

      const url = `${baseUrl}/${domain}/messages`

      // Mailgun API requires Basic Auth (api:YOUR_KEY)
      const auth = btoa(`api:${apiKey}`)

      // Mailgun expects multipart/form-data or x-www-form-urlencoded
      const formData = new URLSearchParams()
      formData.append(
        'from',
        process.env.EMAIL_FROM || `OpenLivestock <notifications@${domain}>`,
      )
      formData.append('to', to)
      formData.append('subject', subject)
      formData.append('html', html)

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      })

      if (!response.ok) {
        const errorData = (await response.json()) as { message?: string }
        return {
          success: false,
          error: `Mailgun API Error (${response.status}): ${errorData.message || response.statusText}`,
        }
      }

      const data = (await response.json()) as { id?: string }

      return {
        success: true,
        messageId: data.id,
      }
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Unknown Mailgun communication error',
      }
    }
  }
}
