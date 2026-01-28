import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TwilioProvider } from './sms/twilio'
import { TermiiProvider } from './sms/termii'
import { ResendProvider } from './email/resend'
import { SMTPProvider } from './email/smtp'

describe('TwilioProvider (Core)', () => {
    const provider = new TwilioProvider()

    beforeEach(() => {
        process.env.TWILIO_ACCOUNT_SID = 'sid-123'
        process.env.TWILIO_AUTH_TOKEN = 'token-123'
        process.env.TWILIO_PHONE_NUMBER = '+1234567890'
        vi.clearAllMocks()
    })

    it('should send SMS successfully', async () => {
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({ sid: 'twilio-sid-123' }),
        })

        const result = await provider.send('+1987654321', 'Core Message')

        expect(result.success).toBe(true)
        expect(result.messageId).toBe('twilio-sid-123')
    })
})

describe('TermiiProvider (Core)', () => {
    const provider = new TermiiProvider()

    beforeEach(() => {
        process.env.TERMII_API_KEY = 'termii-key'
        vi.clearAllMocks()
    })

    it('should send SMS successfully', async () => {
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: () =>
                Promise.resolve({ code: 'ok', message_id: 'termii-msg-123' }),
        })

        const result = await provider.send('+2348000000000', 'Termii Message')

        expect(result.success).toBe(true)
        expect(result.messageId).toBe('termii-msg-123')
    })
})

describe('ResendProvider (Core)', () => {
    const provider = new ResendProvider()

    beforeEach(() => {
        process.env.RESEND_API_KEY = 'resend-key'
        vi.clearAllMocks()
    })

    it('should send email successfully', async () => {
        // Mock the dynamic import of resend
        vi.mock('resend', () => ({
            Resend: vi.fn().mockReturnValue({
                emails: {
                    send: vi
                        .fn()
                        .mockResolvedValue({ data: { id: 'res-123' } }),
                },
            }),
        }))

        const result = await provider.send('to@test.com', 'Sub', 'html')
        expect(result.success).toBe(true)
        expect(result.messageId).toBe('res-123')
    })
})

describe('SMTPProvider (Core)', () => {
    const provider = new SMTPProvider()

    beforeEach(() => {
        process.env.SMTP_HOST = 'localhost'
        vi.clearAllMocks()
    })

    it('should send email successfully', async () => {
        // Mock the dynamic import of nodemailer
        vi.mock('nodemailer', () => ({
            createTransport: vi.fn().mockReturnValue({
                sendMail: vi.fn().mockResolvedValue({ messageId: 'smtp-123' }),
            }),
        }))

        const result = await provider.send('to@test.com', 'Sub', 'html')
        expect(result.success).toBe(true)
        expect(result.messageId).toBe('smtp-123')
    })
})
