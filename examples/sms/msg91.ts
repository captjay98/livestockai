import type {
  ProviderResult,
  SMSProvider,
} from '../../app/features/integrations/contracts'

/**
 * MSG91 SMS Provider Implementation (India)
 *
 * MSG91 is one of India's most popular and developer-friendly
 * SMS gateways, widely used for transactional and OTP messages.
 *
 * This example demonstrates:
 * 1. Header-based authentication (authkey)
 * 2. Using template-based messaging (required by many Indian regulations)
 * 3. Handling MSG91's response structure
 *
 * @see https://docs.msg91.com/collection/msg91-api-reference/5/send-sms/24
 */
export class Msg91Provider implements SMSProvider {
  readonly name = 'msg91'

  async send(to: string, message: string): Promise<ProviderResult> {
    const authKey = process.env.MSG91_AUTH_KEY
    const templateId = process.env.MSG91_TEMPLATE_ID // Often required in India

    if (!authKey) {
      return {
        success: false,
        error: 'Missing MSG91_AUTH_KEY',
      }
    }

    try {
      const url = 'https://api.msg91.com/api/v5/flow/'

      // MSG91 uses "Flows" for transactional messages.
      // You define a template in their dashboard and trigger it here.
      const body = {
        template_id: templateId,
        short_url: '1', // 1 for 'on', 0 for 'off'
        recipients: [
          {
            mobiles: to.replace(/\+/g, ''), // MSG91 prefers numbers without +
            // If your template has variables like ##message##, you map them here:
            message: message,
          },
        ],
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          authkey: authKey,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(body),
      })

      const data = await response.json()

      if (data.type === 'success') {
        return {
          success: true,
          messageId: data.request_id,
        }
      }

      return {
        success: false,
        error: `MSG91 Error: ${data.message || 'Unknown error'}`,
      }
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Unknown MSG91 communication error',
      }
    }
  }
}
