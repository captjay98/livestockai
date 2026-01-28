import type {
    EmailProvider,
    ProviderResult,
} from '../../app/features/integrations/contracts'

/**
 * SMTP Email Provider Implementation (Core Service - Local Testing)
 *
 * SMTP is the legacy standard for email, useable with any mail server.
 * In OpenLivestock, this is primarily used for local testing with Mailpit.
 *
 * This example demonstrates:
 * 1. Configuring Nodemailer for various ports and security levels
 * 2. Handling optional authentication
 * 3. Legacy protocol integration in a modern TypeScript environment
 *
 * @see https://nodemailer.com/about/
 */
export class SMTPProvider implements EmailProvider {
    readonly name = 'smtp'

    async send(
        to: string,
        subject: string,
        html: string,
    ): Promise<ProviderResult> {
        const host = process.env.SMTP_HOST
        const port = process.env.SMTP_PORT
        const user = process.env.SMTP_USER
        const pass = process.env.SMTP_PASS

        if (!host) {
            return {
                success: false,
                error: 'SMTP_HOST not configured',
            }
        }

        try {
            const nodemailer = await import('nodemailer')

            // Create a transport object using standard SMTP configuration
            const transporter = nodemailer.createTransport({
                host: host,
                port: port ? parseInt(port) : 587,
                secure: port === '465', // true for 465, false for other ports
                auth: user && pass ? { user, pass } : undefined,
            })

            const result = await transporter.sendMail({
                from:
                    process.env.EMAIL_FROM ||
                    'OpenLivestock <noreply@localhost>',
                to: to,
                subject: subject,
                html: html,
            })

            return {
                success: true,
                messageId: result.messageId,
            }
        } catch (error) {
            return {
                success: false,
                error:
                    error instanceof Error
                        ? error.message
                        : 'Unknown SMTP communication error',
            }
        }
    }
}
