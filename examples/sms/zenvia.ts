import type {
  ProviderResult,
  SMSProvider,
} from '../../app/features/integrations/contracts'

/**
 * Zenvia SMS Provider Implementation (Brazil)
 *
 * Zenvia is the leading communication platform in Latin America,
 * particularly essential for integrations in the Brazilian market.
 *
 * This example demonstrates:
 * 1. Handling bearer token authentication
 * 2. Zenvia's specific JSON body structure
 * 3. Mapping Zenvia's status codes to ProviderResult
 *
 * @see https://zenvia.github.io/zenvia-openapi-spec/v2/
 */
export class ZenviaProvider implements SMSProvider {
  readonly name = 'zenvia'

  async send(to: string, message: string): Promise<ProviderResult> {
    const apiToken = process.env.ZENVIA_API_TOKEN

    if (!apiToken) {
      return {
        success: false,
        error: 'Missing ZENVIA_API_TOKEN',
      }
    }

    try {
      // Zenvia v2 API endpoint for SMS (and other channels)
      const url = 'https://api.zenvia.com/v2/channels/sms/messages'

      const body = {
        from: 'OpenLivestock', // This might need to be a specific number or ID provided by Zenvia
        to: to.replace(/\+/g, ''), // Zenvia often prefers numbers without the + sign
        contents: [
          {
            type: 'text',
            text: message,
          },
        ],
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'X-API-Token': apiToken,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const errorData = (await response.json()) as {
          message?: string
        }
        return {
          success: false,
          error: `Zenvia API Error (${response.status}): ${errorData.message || response.statusText}`,
        }
      }

      const data = (await response.json()) as { id?: string }

      // Zenvia returns a success status if the message is accepted
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
            : 'Unknown Zenvia communication error',
      }
    }
  }
}
