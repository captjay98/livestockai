import type {
    ProviderResult,
    SMSProvider,
} from '../../app/features/integrations/contracts'

/**
 * Twilio SMS Provider Implementation (Core Service)
 *
 * Twilio is the global standard for cloud communications.
 * It's already the primary SMS provider for OpenLivestock.
 *
 * This example demonstrates:
 * 1. POST request to Twilio's versioned REST API
 * 2. Basic Authentication using Account SID and Auth Token
 * 3. Using URLSearchParams for 'x-www-form-urlencoded' payloads
 *
 * @see https://www.twilio.com/docs/sms/api/message-resource
 */
export class TwilioProvider implements SMSProvider {
    readonly name = 'twilio'

    async send(to: string, message: string): Promise<ProviderResult> {
        const accountSid = process.env.TWILIO_ACCOUNT_SID
        const authToken = process.env.TWILIO_AUTH_TOKEN
        const fromNumber = process.env.TWILIO_PHONE_NUMBER

        if (!accountSid || !authToken || !fromNumber) {
            return {
                success: false,
                error: 'Twilio credentials (SID, TOKEN, or PHONE_NUMBER) not configured',
            }
        }

        try {
            // Twilio API URL includes the Account SID
            const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`

            const auth = btoa(`${accountSid}:${authToken}`)

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    Authorization: `Basic ${auth}`,
                },
                body: new URLSearchParams({
                    To: to,
                    From: fromNumber,
                    Body: message,
                }),
            })

            const data = (await response.json()) as {
                sid?: string
                message?: string
            }

            if (response.ok && data.sid) {
                return {
                    success: true,
                    messageId: data.sid,
                }
            }

            return {
                success: false,
                error: data.message || 'Twilio failed to send message',
            }
        } catch (error) {
            return {
                success: false,
                error:
                    error instanceof Error
                        ? error.message
                        : 'Unknown Twilio communication error',
            }
        }
    }
}
