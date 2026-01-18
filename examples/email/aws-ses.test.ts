import { beforeEach, describe, expect, it, vi } from 'vitest'
// @ts-ignore - explicitly used in mock
import { SESClient } from '@aws-sdk/client-ses'
import { AwsSesProvider } from './aws-ses'

// Mock the AWS SES Client
vi.mock('@aws-sdk/client-ses', () => {
  return {
    SESClient: vi.fn().mockImplementation(() => ({
      send: vi.fn(),
    })),
    SendEmailCommand: vi.fn().mockImplementation((args) => args),
  }
})

describe('AwsSesProvider', () => {
  const provider = new AwsSesProvider()

  beforeEach(() => {
    process.env.AWS_SES_REGION = 'us-east-1'
    process.env.AWS_ACCESS_KEY_ID = 'test-access-key'
    process.env.AWS_SECRET_ACCESS_KEY = 'test-secret-key'
    process.env.EMAIL_FROM_ADDRESS = 'from@test.com'

    vi.clearAllMocks()
  })

  it('should send email successfully', async () => {
    const mockSend = vi.fn().mockResolvedValue({ MessageId: 'msg-123' })
    ;(SESClient as any).mockImplementation(() => ({
      send: mockSend,
    }))

    const result = await provider.send(
      'to@test.com',
      'Test Subject',
      '<p>Hello</p>',
    )

    expect(result.success).toBe(true)
    expect(result.messageId).toBe('msg-123')
    expect(mockSend).toHaveBeenCalled()
  })

  it('should handle missing credentials', async () => {
    process.env.AWS_ACCESS_KEY_ID = ''

    const result = await provider.send('to@test.com', 'Subject', 'html')

    expect(result.success).toBe(false)
    expect(result.error).toContain('Missing AWS credentials')
  })

  it('should handle SDK errors', async () => {
    const mockSend = vi.fn().mockRejectedValue(new Error('SES Limit Exceeded'))
    ;(SESClient as any).mockImplementation(() => ({
      send: mockSend,
    }))

    const result = await provider.send('to@test.com', 'Subject', 'html')

    expect(result.success).toBe(false)
    expect(result.error).toBe('SES Limit Exceeded')
  })

  it('should handle specific AWS error names', async () => {
    const error = new Error('Rejection')
    error.name = 'MessageRejected'

    const mockSend = vi.fn().mockRejectedValue(error)
    ;(SESClient as any).mockImplementation(() => ({
      send: mockSend,
    }))

    const result = await provider.send('to@test.com', 'Subject', 'html')

    expect(result.success).toBe(false)
    expect(result.error).toContain('Email address not verified')
  })
})
