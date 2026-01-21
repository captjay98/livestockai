import { describe, expect, it, vi } from 'vitest'
import type { EmailProvider, ProviderResult, SMSProvider } from '~/features/integrations/contracts'
import { INTEGRATIONS, getIntegrationStatus } from '~/features/integrations/config'
import { emailTemplates } from '~/features/integrations/email/templates'

describe('integrations/contracts', () => {
    describe('ProviderResult interface', () => {
        it('should accept success result', () => {
            const result: ProviderResult = {
                success: true,
                messageId: 'msg-123',
            }
            expect(result.success).toBe(true)
            expect(result.messageId).toBe('msg-123')
        })

        it('should accept failure result', () => {
            const result: ProviderResult = {
                success: false,
                error: 'Failed to send',
            }
            expect(result.success).toBe(false)
            expect(result.error).toBe('Failed to send')
        })
    })

    describe('SMSProvider contract', () => {
        it('should define required properties', () => {
            const mockProvider: SMSProvider = {
                name: 'TestSMS',
                send: async (to, message) => ({ success: true, messageId: '123' }),
            }

            expect(mockProvider.name).toBe('TestSMS')
            expect(typeof mockProvider.send).toBe('function')
        })
    })

    describe('EmailProvider contract', () => {
        it('should define required properties', () => {
            const mockProvider: EmailProvider = {
                name: 'TestEmail',
                send: async (to, subject, html) => ({ success: true, messageId: '456' }),
            }

            expect(mockProvider.name).toBe('TestEmail')
            expect(typeof mockProvider.send).toBe('function')
        })
    })
})

describe('integrations/config', () => {
    describe('INTEGRATIONS', () => {
        it('should have sms and email integrations', () => {
            expect(INTEGRATIONS).toHaveProperty('sms')
            expect(INTEGRATIONS).toHaveProperty('email')
        })
    })

    describe('getIntegrationStatus', () => {
        it('should return array of integration statuses', () => {
            const statuses = getIntegrationStatus()
            expect(Array.isArray(statuses)).toBe(true)
            statuses.forEach((status) => {
                expect(status).toHaveProperty('type')
                expect(status).toHaveProperty('enabled')
                expect(status).toHaveProperty('configured')
                expect(typeof status.configured).toBe('boolean')
            })
        })
    })
})

describe('integrations/email/templates', () => {
    describe('emailTemplates', () => {
        it('should have required template functions', () => {
            expect(typeof emailTemplates).toBe('object')
            expect(emailTemplates).toHaveProperty('highMortality')
            expect(emailTemplates).toHaveProperty('lowStock')
            expect(emailTemplates).toHaveProperty('test')
        })

        it('should generate valid subject and html for highMortality', () => {
            const template = emailTemplates.highMortality('10 birds died', 'Poultry')
            expect(template.subject).toContain('High Mortality Alert')
            expect(template.subject).toContain('Poultry')
            expect(template.html).toContain('10 birds died')
        })

        it('should generate valid subject and html for lowStock', () => {
            const template = emailTemplates.lowStock('Starter Feed', 5)
            expect(template.subject).toContain('Low Stock Alert')
            expect(template.subject).toContain('Starter Feed')
            expect(template.html).toContain('Starter Feed')
            expect(template.html).toContain('5.0')
        })

        it('should generate valid subject and html for test', () => {
            const template = emailTemplates.test()
            expect(template.subject).toContain('Test')
            expect(template.html).toContain('correctly')
            expect(template.html).toContain('notifications')
        })
    })
})
