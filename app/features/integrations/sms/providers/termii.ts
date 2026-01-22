import type { ProviderResult, SMSProvider } from '../../contracts'

interface TermiiResponse {
  code?: string
  message_id?: string
  message?: string
}

export class TermiiProvider implements SMSProvider {
  readonly name = 'termii'

  async send(to: string, message: string): Promise<ProviderResult> {
    const apiKey = process.env.TERMII_API_KEY
    if (!apiKey) {
      return { success: false, error: 'TERMII_API_KEY not configured' }
    }

    try {
      const response = await fetch('https://v3.api.termii.com/api/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: apiKey,
          to,
          from: process.env.TERMII_SENDER_ID || 'OpenLvstck',
          sms: message,
          type: 'plain',
          channel: 'dnd',
        }),
      })

      const data: TermiiResponse = await response.json()

      if (data.code === 'ok') {
        return { success: true, messageId: data.message_id }
      }

      return { success: false, error: data.message || 'SMS send failed' }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }
}
