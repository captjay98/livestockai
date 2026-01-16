import type { ProviderResult, SMSProvider } from 'contracts'

/**
 * Termii SMS Provider Implementation (Core Service - Nigeria)
 *
 * Termii is a powerful platform for delivering messages across Africa,
 * with deep local routing in Nigeria.
 *
 * This example demonstrates:
 * 1. Simple JSON API integration
 * 2. Handling DND (Do Not Disturb) channels popular in Nigeria
 * 3. Using Sender IDs for brand recognition
 *
 * @see https://developers.termii.com/sms
 */
export class TermiiProvider implements SMSProvider {
  readonly name = 'termii'

  async send(to: string, message: string): Promise<ProviderResult> {
    const apiKey = process.env.TERMII_API_KEY
    const senderId = process.env.TERMII_SENDER_ID || 'OpenLvstck'

    if (!apiKey) {
      return {
        success: false,
        error: 'TERMII_API_KEY not configured',
      }
    }

    try {
      const response = await fetch('https://v3.api.termii.com/api/sms/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          api_key: apiKey,
          to: to,
          from: senderId,
          sms: message,
          type: 'plain',
          channel: 'dnd', // Uses 'dnd' channel to ensure delivery to restricted numbers
        }),
      })

      const data = (await response.json()) as {
        code?: string
        message_id?: string
        message?: string
      }

      // Termii returns 'ok' code on successful delivery
      if (data.code === 'ok') {
        return {
          success: true,
          messageId: data.message_id,
        }
      }

      return {
        success: false,
        error: data.message || 'Termii failed to send message',
      }
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Unknown Termii communication error',
      }
    }
  }
}
