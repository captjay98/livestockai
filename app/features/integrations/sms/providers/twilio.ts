import type { ProviderResult, SMSProvider } from '../../contracts'

interface TwilioResponse {
  sid?: string
  message?: string
}

export class TwilioProvider implements SMSProvider {
  readonly name = 'twilio'

  async send(to: string, message: string): Promise<ProviderResult> {
    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN
    const fromNumber = process.env.TWILIO_PHONE_NUMBER

    if (!accountSid || !authToken || !fromNumber) {
      return {
        success: false,
        error: 'Twilio credentials not configured',
      }
    }

    try {
      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Basic ${btoa(`${accountSid}:${authToken}`)}`,
          },
          body: new URLSearchParams({
            To: to,
            From: fromNumber,
            Body: message,
          }),
        },
      )

      const data: TwilioResponse = await response.json()

      if (response.ok && data.sid) {
        return { success: true, messageId: data.sid }
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
