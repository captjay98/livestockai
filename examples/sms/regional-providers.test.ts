import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ZenviaProvider } from './zenvia'
import { Msg91Provider } from './msg91'

describe('ZenviaProvider', () => {
    const provider = new ZenviaProvider()

    beforeEach(() => {
        process.env.ZENVIA_API_TOKEN = 'test-token'
        vi.clearAllMocks()
    })

    it('should send SMS successfully', async () => {
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({ id: 'zen-123' }),
        })

        const result = await provider.send('+5511988887777', 'Olá Fazenda')

        expect(result.success).toBe(true)
        expect(result.messageId).toBe('zen-123')
        expect(fetch).toHaveBeenCalledWith(
            expect.stringContaining('zenvia.com'),
            expect.objectContaining({
                headers: expect.objectContaining({
                    'X-API-Token': 'test-token',
                }),
            }),
        )
    })
})

describe('Msg91Provider', () => {
    const provider = new Msg91Provider()

    beforeEach(() => {
        process.env.MSG91_AUTH_KEY = 'test-key'
        process.env.MSG91_TEMPLATE_ID = 'template-123'
        vi.clearAllMocks()
    })

    it('should send SMS successfully via Flow API', async () => {
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: () =>
                Promise.resolve({ type: 'success', request_id: 'msg-123' }),
        })

        const result = await provider.send('+919876543210', 'Farm Alert')

        expect(result.success).toBe(true)
        expect(result.messageId).toBe('msg-123')
        expect(fetch).toHaveBeenCalledWith(
            expect.stringContaining('msg91.com'),
            expect.objectContaining({
                headers: expect.objectContaining({
                    authkey: 'test-key',
                }),
            }),
        )
    })
})
