import { beforeEach, describe, expect, it, vi } from 'vitest'
import { BulkSmsProvider } from '../sms/bulksms'
import { MailgunProvider } from './mailgun'

describe('BulkSmsProvider', () => {
  const provider = new BulkSmsProvider()

  beforeEach(() => {
    process.env.BULK_SMS_TOKEN_ID = 'id-123'
    process.env.BULK_SMS_TOKEN_SECRET = 'secret-123'
    vi.clearAllMocks()
  })

  it('should send SMS successfully', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve([{ id: 'bulk-123', status: { type: 'ACCEPTED' } }]),
    })

    const result = await provider.send('+27112223333', 'Farm Alert')

    expect(result.success).toBe(true)
    expect(result.messageId).toBe('bulk-123')
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('bulksms.com'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: expect.stringContaining('Basic'),
        }),
      }),
    )
  })
})

describe('MailgunProvider', () => {
  const provider = new MailgunProvider()

  beforeEach(() => {
    process.env.MAILGUN_API_KEY = 'mg-123'
    process.env.MAILGUN_DOMAIN = 'test.com'
    process.env.EMAIL_FROM = 'from@test.com'
    vi.clearAllMocks()
  })

  it('should send email successfully', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({ id: '<msg-123@test.com>', message: 'Queued' }),
    })

    const result = await provider.send('to@test.com', 'Subject', 'html')

    expect(result.success).toBe(true)
    expect(result.messageId).toBe('<msg-123@test.com>')
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('mailgun.net'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: expect.stringContaining('Basic'),
        }),
      }),
    )
  })
})
