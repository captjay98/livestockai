import type {
  ProviderResult,
  SMSProvider,
} from '../../app/features/integrations/contracts'

/**
 * BulkSMS SMS Provider Implementation (South Africa)
 *
 * BulkSMS is a leading provider in South Africa (Cape Town based)
 * with direct connections to South African networks.
 *
 * This example demonstrates:
 * 1. Handling Basic Authentication (Token-based)
 * 2. Sending simple plain-text messages
 * 3. Robust error mapping for South African carriers
 *
 * @see https://www.bulksms.com/developer/json/v1/
 */
export class BulkSmsProvider implements SMSProvider {
  readonly name = 'bulksms'

  async send(to: string, message: string): Promise<ProviderResult> {
    const tokenId = process.env.BULK_SMS_TOKEN_ID
    const tokenSecret = process.env.BULK_SMS_TOKEN_SECRET

    if (!tokenId || !tokenSecret) {
      return {
        success: false,
        error: 'Missing BULK_SMS_TOKEN_ID or BULK_SMS_TOKEN_SECRET',
      }
    }

    try {
      const url = 'https://api.bulksms.com/v1/messages'

      const body = [
        {
          to: to,
          body: message,
        },
      ]

      // BulkSMS uses a token-based Basic Auth header:
      // Authorization: Basic base64(tokenId:tokenSecret)
      const auth = btoa(`${tokenId}:${tokenSecret}`)

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const errorText = await response.text()
        return {
          success: false,
          error: `BulkSMS API Error (${response.status}): ${errorText}`,
        }
      }

      // BulkSMS returns an array of message status objects
      const data = (await response.json()) as Array<{
        status?: { type?: string }
        id?: string
      }>

      if (data.length > 0 && data[0].status.type === 'ACCEPTED') {
        return {
          success: true,
          messageId: data[0].id,
        }
      }

      return {
        success: false,
        error: `BulkSMS Failed: ${data[0]?.status.type || 'Unknown status'}`,
      }
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Unknown BulkSMS communication error',
      }
    }
  }
}
