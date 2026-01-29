import type { EmailProvider, ProviderResult } from '../../contracts'

export class SMTPProvider implements EmailProvider {
  readonly name = 'smtp'

  async send(
    to: string,
    subject: string,
    html: string,
  ): Promise<ProviderResult> {
    const host = process.env.SMTP_HOST
    if (!host) {
      return { success: false, error: 'SMTP_HOST not configured' }
    }

    try {
      const nodemailer = await import('nodemailer')
      const port = process.env.SMTP_PORT
      const user = process.env.SMTP_USER
      const pass = process.env.SMTP_PASS

      const transporter = nodemailer.createTransport({
        host,
        port: port ? parseInt(port) : 587,
        secure: port === '465',
        auth: user && pass ? { user, pass } : undefined,
      })

      const result = await transporter.sendMail({
        from: process.env.EMAIL_FROM || 'OpenLivestock <noreply@localhost>',
        to,
        subject,
        html,
      })

      return { success: true, messageId: result.messageId }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }
}
