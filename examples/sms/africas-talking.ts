import type { ProviderResult, SMSProvider } from 'contracts'

/**
 * Africa's Talking SMS Provider Implementation
 *
 * Africa's Talking is a popular communication platform in Africa,
 * particularly strong in Kenya, Nigeria, and South Africa.
 *
 * This example demonstrates:
 * 1. Interface implementation (SMSProvider)
 * 2. Environment variable validation
 * 3. Fetch API usage with form-encoded data
 * 4. Comprehensive error handling
 * 5. ProviderResult return pattern
 *
 * @see https://developers.africastalking.com/docs/sms/overview
 */
export class AfricasTalkingProvider implements SMSProvider {
  /**
   * Unique name for this provider.
   * This should match the configuration key used in config.ts
   */
  readonly name = 'africas-talking'

  /**
   * Sends an SMS using Africa's Talking API
   *
   * @param to The recipient's phone number in international format (e.g., +254...)
   * @param message The text content of the SMS
   * @returns A promise resolving to a ProviderResult
   */
  async send(to: string, message: string): Promise<ProviderResult> {
    // 1. Validate Environment Variables
    // We check for required credentials before making the API call.
    // In a production app, these would likely be validated at startup
    // or through a centralized configuration service.
    const username = process.env.AFRICAS_TALKING_USERNAME
    const apiKey = process.env.AFRICAS_TALKING_API_KEY

    if (!username || !apiKey) {
      return {
        success: false,
        error: "Missing Africa's Talking credentials (USERNAME or API_KEY)",
      }
    }

    try {
      // 2. Prepare the API Request
      // Africa's Talking expects data to be sent as x-www-form-urlencoded.
      const url = 'https://api.africastalking.com/version1/messaging'

      const body = new URLSearchParams({
        username: username,
        to: to,
        message: message,
        // Optional: Add bulkSMSMode if needed
        // bulkSMSMode: '1'
      })

      // 3. Execute the API Call
      // We use the native fetch API available in modern Node.js/Bun environments.
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          apiKey: apiKey,
          Accept: 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      })

      // 4. Handle HTTP Errors
      // Even if the request executes, the API might return an error status code.
      if (!response.ok) {
        const errorText = await response.text()
        return {
          success: false,
          error: `Africa's Talking API Error (${response.status}): ${errorText}`,
        }
      }

      // 5. Parse and Validate Response
      // Africa's Talking returns a 'SMSMessageData' object containing recipients.
      const data = (await response.json())

      const recipients = data.SMSMessageData?.Recipients

      if (recipients && recipients.length > 0) {
        const firstRecipient = recipients[0]

        // Check if the status is one of the success states (Success, Sent, etc.)
        if (['Success', 'Sent', 'Buffered'].includes(firstRecipient.status)) {
          return {
            success: true,
            messageId: firstRecipient.messageId,
          }
        }

        return {
          success: false,
          error: `SMS Failed with status: ${firstRecipient.status}`,
        }
      }

      return {
        success: false,
        error: "Invalid response format from Africa's Talking",
      }
    } catch (error) {
      // 6. Catch Network/System Errors
      // This handles cases like DNS failure, timeouts, or JSON parsing errors.
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Unknown communication error',
      }
    }
  }
}
