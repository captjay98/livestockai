/**
 * STEP 1: Import the base contracts.
 * These ensure your provider follows the standard required by Livestock AI.
 */
import type {
  EmailProvider,
  ProviderResult,
} from '../../app/features/integrations/contracts'

/**
 * STEP 2: Name and Define your Provider.
 * Replace 'MyCustomEmail' with the name of the service you are integrating.
 */
export class MyCustomEmailProvider implements EmailProvider {
  /**
   * The unique identifier for this provider.
   * This is generally used in logs and for matching configuration.
   */
  readonly name = 'my-custom-email'

  /**
   * STEP 3: Implement the 'send' method.
   * This is the core logic that the application will call.
   */
  async send(
    to: string,
    subject: string,
    html: string,
  ): Promise<ProviderResult> {
    /**
     * SECTION A: Validate Environment Variables.
     * Ensure you have the credentials needed from your .env file.
     */
    const apiKey = process.env.MY_CUSTOM_EMAIL_API_KEY
    if (!apiKey) {
      return {
        success: false,
        error: 'Missing API Key for MyCustomEmail service',
      }
    }

    try {
      /**
       * SECTION B: Make the API call.
       *
       * Most email services use a JSON POST request or a proprietary SDK.
       * Replace 'YOUR_API_URL' with the actual endpoint of your service.
       */
      const response = await fetch(
        'https://api.yourprovider.com/v1/send-email',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'notifications@yourfarm.com',
            to: to,
            subject: subject,
            htmlContent: html,
            // You might need to add 'plainTextContent' as well
          }),
        },
      )

      /**
       * SECTION C: Handle HTTP Errors.
       */
      if (!response.ok) {
        return {
          success: false,
          error: `Service Error: ${response.status} ${response.statusText}`,
        }
      }

      /**
       * SECTION D: Parse the Response.
       */
      const data = (await response.json()) as {
        status?: string
        success?: boolean
        messageId?: string
        error_description?: string
      }

      /**
       * SECTION E: Return the Result.
       *
       * success: set to true/false based on the provider response.
       * messageId: (optional) but highly recommended for tracking.
       */
      return {
        success: data.status === 'accepted' || data.success,
        messageId: data.messageId,
        error: data.error_description,
      }
    } catch (err) {
      /**
       * SECTION F: Catch network or unexpected code failures.
       */
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown integration error',
      }
    }
  }
}
