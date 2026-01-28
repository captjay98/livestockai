/**
 * STEP 1: Import the base contracts.
 * These ensure your provider follows the standard required by OpenLivestock.
 */
import type {
    ProviderResult,
    SMSProvider,
} from '../../app/features/integrations/contracts'

/**
 * STEP 2: Name and Define your Provider.
 * Replace 'MyCustomSms' with the name of the service you are integrating.
 */
export class MyCustomSmsProvider implements SMSProvider {
    /**
     * The unique identifier for this provider.
     * This is generally used in logs and for matching configuration.
     */
    readonly name = 'my-custom-sms'

    /**
     * STEP 3: Implement the 'send' method.
     * This is the core logic that the application will call.
     */
    async send(to: string, message: string): Promise<ProviderResult> {
        /**
         * SECTION A: Validate Environment Variables.
         * Ensure you have the credentials needed from your .env file.
         */
        const apiKey = process.env.MY_CUSTOM_SMS_API_KEY
        if (!apiKey) {
            return {
                success: false,
                error: 'Missing API Key for MyCustomSms service',
            }
        }

        try {
            /**
             * SECTION B: Make the API call.
             *
             * Most modern SMS providers use a simple JSON POST request.
             * Replace 'YOUR_API_URL' with the actual endpoint of your service.
             */
            const response = await fetch(
                'https://api.yourprovider.com/v1/send',
                {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${apiKey}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        recipient: to,
                        body: message,
                        // You might need to add other fields like 'sender_id' or 'priority'
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
             *
             * Inspect the 'data' returned by your provider to find the Message ID
             * or any provider-specific error status.
             */
            const data = (await response.json()) as {
                status?: string
                id?: string
                errorMessage?: string
            }

            /**
             * SECTION E: Return the Result.
             *
             * success: set to true/false based on the provider response.
             * messageId: (optional) but highly recommended for tracking.
             */
            return {
                success: data.status === 'success',
                messageId: data.id,
                error: data.errorMessage, // Provide detail if success is false
            }
        } catch (err) {
            /**
             * SECTION F: Catch network or unexpected code failures.
             */
            return {
                success: false,
                error:
                    err instanceof Error
                        ? err.message
                        : 'Unknown integration error',
            }
        }
    }
}
