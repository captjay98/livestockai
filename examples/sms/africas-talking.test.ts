import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AfricasTalkingProvider } from './africas-talking'

describe('AfricasTalkingProvider', () => {
    const provider = new AfricasTalkingProvider()

    beforeEach(() => {
        // Reset environment mapping
        process.env.AFRICAS_TALKING_USERNAME = 'test-user'
        process.env.AFRICAS_TALKING_API_KEY = 'test-key'

        // Clear mocks
        vi.restoreAllMocks()
        vi.clearAllMocks()
    })

    it('should send SMS successfully', async () => {
        // Mock successful fetch response
        const mockResponse = {
            SMSMessageData: {
                Recipients: [
                    {
                        status: 'Success',
                        messageId: 'ATid_12345',
                        number: '+254712345678',
                    },
                ],
            },
        }

        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve(mockResponse),
        })

        const result = await provider.send('+254712345678', 'Hello World')

        expect(result.success).toBe(true)
        expect(result.messageId).toBe('ATid_12345')
        expect(fetch).toHaveBeenCalledWith(
            expect.stringContaining('africastalking.com'),
            expect.objectContaining({
                method: 'POST',
                headers: expect.objectContaining({
                    apiKey: 'test-key',
                }),
            }),
        )
    })

    it('should handle missing credentials', async () => {
        process.env.AFRICAS_TALKING_API_KEY = ''

        const result = await provider.send('+123', 'Test')

        expect(result.success).toBe(false)
        expect(result.error).toContain("Missing Africa's Talking credentials")
    })

    it('should handle API errors (non-200 response)', async () => {
        global.fetch = vi.fn().mockResolvedValue({
            ok: false,
            status: 401,
            text: () => Promise.resolve('Unauthorized access'),
        })

        const result = await provider.send('+123', 'Test')

        expect(result.success).toBe(false)
        expect(result.error).toContain("Africa's Talking API Error (401)")
    })

    it('should handle provider-side failure status', async () => {
        const mockResponse = {
            SMSMessageData: {
                Recipients: [
                    {
                        status: 'InvalidPhoneNumber',
                        number: '+123',
                    },
                ],
            },
        }

        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve(mockResponse),
        })

        const result = await provider.send('+123', 'Test')

        expect(result.success).toBe(false)
        expect(result.error).toContain(
            'SMS Failed with status: InvalidPhoneNumber',
        )
    })

    it('should catch network exceptions', async () => {
        global.fetch = vi.fn().mockRejectedValue(new Error('Network failure'))

        const result = await provider.send('+123', 'Test')

        expect(result.success).toBe(false)
        expect(result.error).toBe('Network failure')
    })
})
