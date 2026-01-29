// Mock AWS SDK for example purposes - in real usage, install @aws-sdk/client-ses
// @ts-ignore - explicitly used
import type {
  EmailProvider,
  ProviderResult,
} from '../../app/features/integrations/contracts'

const SESClient = class {
  constructor(_config: {
    region: string
    credentials: { accessKeyId: string; secretAccessKey: string }
  }) {}
  send(_command: unknown) {
    return Promise.resolve({ MessageId: 'mock-message-id' })
  }
}

// @ts-ignore - explicitly used
const SendEmailCommand = class {
  constructor(params: any) {
    return params
  }
}

/**
 * AWS SES Email Provider Implementation
 *
 * Amazon Simple Email Service (SES) is a cost-effective, flexible,
 * and scalable email service that enables developers to send mail
 * from within any application.
 *
 * This example demonstrates:
 * 1. Interface implementation (EmailProvider)
 * 2. Using the AWS SDK v3 (Modular approach)
 * 3. Environment variable validation for cloud services
 * 4. Structuring a complex email payload
 * 5. SDK-specific error handling
 *
 * @see https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/ses/
 */
export class AwsSesProvider implements EmailProvider {
  /**
   * Unique name for this provider.
   */
  readonly name = 'aws-ses'

  /**
   * Sends an email using AWS SES SDK v3
   *
   * @param to Recipient email address
   * @param subject Email subject line
   * @param html HTML body content
   * @returns A promise resolving to a ProviderResult
   */
  async send(
    to: string,
    subject: string,
    html: string,
  ): Promise<ProviderResult> {
    // 1. Validate Environment Variables
    // AWS SDK can automatically pick up credentials from env vars:
    // AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION
    const region = process.env.AWS_SES_REGION || 'us-east-1'
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY

    // We explicitly check to provide a helpful error message if they are missing
    if (!accessKeyId || !secretAccessKey) {
      return {
        success: false,
        error:
          'Missing AWS credentials (AWS_ACCESS_KEY_ID or AWS_SECRET_ACCESS_KEY)',
      }
    }

    try {
      // 2. Initialize the SES Client
      // In a production app, you might want to instantiate this once
      // and reuse it (Singleton pattern) to save resources.
      const client = new SESClient({
        region,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      })

      // 3. Prepare the SendEmailCommand
      // The v3 SDK uses a "Command" pattern which is great for tree-shaking
      // and type safety.
      const command = new SendEmailCommand({
        Destination: {
          ToAddresses: [to],
        },
        Message: {
          Body: {
            Html: {
              Charset: 'UTF-8',
              Data: html,
            },
          },
          Subject: {
            Charset: 'UTF-8',
            Data: subject,
          },
        },
        // IMPORTANT: The 'Source' email must be verified in your AWS SES console
        Source:
          process.env.EMAIL_FROM_ADDRESS || 'notifications@openlivestock.org',
      })

      // 4. Execute the Command
      const response = await client.send(command)

      // 5. Handle Success
      // AWS returns a MessageId if the email was accepted for delivery
      return {
        success: true,
        messageId: response.MessageId,
      }
    } catch (error) {
      // 6. Handle SDK Errors
      // AWS SDK errors often include a 'name' or 'code' that helps identify
      // the specific issue (e.g., MessageRejected, LimitExceededException).
      let errorMessage = 'AWS SES Error'

      if (error instanceof Error) {
        // Handle common AWS SES error cases specifically if desired
        if (error.name === 'MessageRejected') {
          errorMessage = 'Email address not verified or spam filters triggered'
        } else {
          errorMessage = error.message
        }
      }

      return {
        success: false,
        error: errorMessage,
      }
    }
  }
}
