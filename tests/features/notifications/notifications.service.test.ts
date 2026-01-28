import { describe, expect, it } from 'vitest'
import type { CreateNotificationData } from '~/features/notifications/types'
import {
    validateNotificationData,
    validateNotificationId,
    validateNotificationQuery,
} from '~/features/notifications/service'

describe('Notifications Service', () => {
    const createValidNotification = (
        overrides?: Partial<CreateNotificationData>,
    ): CreateNotificationData => ({
        userId: '123e4567-e89b-12d3-a456-426614174000',
        type: 'lowStock',
        title: 'Test Notification',
        message: 'This is a test notification message.',
        actionUrl: '/notifications',
        ...overrides,
    })

    describe('validateNotificationData', () => {
        it('should accept valid notification data', () => {
            const result = validateNotificationData(createValidNotification())
            expect(result).toBeNull()
        })

        it('should reject empty userId', () => {
            const result = validateNotificationData(
                createValidNotification({ userId: '' }),
            )
            expect(result).toBe('User ID is required')
        })

        it('should reject whitespace-only userId', () => {
            const result = validateNotificationData(
                createValidNotification({ userId: '   ' }),
            )
            expect(result).toBe('User ID is required')
        })

        it('should reject empty type', () => {
            const result = validateNotificationData(
                createValidNotification({ type: '' as any }),
            )
            expect(result).toBe('Notification type is required')
        })

        it('should reject whitespace-only type', () => {
            const result = validateNotificationData(
                createValidNotification({ type: '   ' as any }),
            )
            expect(result).toBe('Notification type is required')
        })

        it('should reject empty title', () => {
            const result = validateNotificationData(
                createValidNotification({ title: '' }),
            )
            expect(result).toBe('Notification title is required')
        })

        it('should reject whitespace-only title', () => {
            const result = validateNotificationData(
                createValidNotification({ title: '   ' }),
            )
            expect(result).toBe('Notification title is required')
        })

        it('should reject title exceeding 255 characters', () => {
            const result = validateNotificationData(
                createValidNotification({ title: 'a'.repeat(256) }),
            )
            expect(result).toBe('Title must be less than 255 characters')
        })

        it('should accept title at 255 characters', () => {
            const result = validateNotificationData(
                createValidNotification({ title: 'a'.repeat(255) }),
            )
            expect(result).toBeNull()
        })

        it('should reject empty message', () => {
            const result = validateNotificationData(
                createValidNotification({ message: '' }),
            )
            expect(result).toBe('Notification message is required')
        })

        it('should reject whitespace-only message', () => {
            const result = validateNotificationData(
                createValidNotification({ message: '   ' }),
            )
            expect(result).toBe('Notification message is required')
        })

        it('should reject message exceeding 2000 characters', () => {
            const result = validateNotificationData(
                createValidNotification({ message: 'a'.repeat(2001) }),
            )
            expect(result).toBe('Message must be less than 2000 characters')
        })

        it('should accept message at 2000 characters', () => {
            const result = validateNotificationData(
                createValidNotification({ message: 'a'.repeat(2000) }),
            )
            expect(result).toBeNull()
        })

        it('should accept valid actionUrl', () => {
            const result = validateNotificationData(
                createValidNotification({
                    actionUrl: 'https://example.com/path',
                }),
            )
            expect(result).toBeNull()
        })

        it('should accept actionUrl as undefined', () => {
            const result = validateNotificationData(
                createValidNotification({ actionUrl: undefined }),
            )
            expect(result).toBeNull()
        })

        it('should reject actionUrl exceeding 500 characters', () => {
            const result = validateNotificationData(
                createValidNotification({ actionUrl: 'a'.repeat(501) }),
            )
            expect(result).toBe('Action URL must be less than 500 characters')
        })

        it('should accept actionUrl at 500 characters', () => {
            const result = validateNotificationData(
                createValidNotification({ actionUrl: 'a'.repeat(500) }),
            )
            expect(result).toBeNull()
        })
    })

    describe('validateNotificationQuery', () => {
        it('should accept default query options', () => {
            const result = validateNotificationQuery()
            expect(result).toEqual({ unreadOnly: false, limit: 50 })
        })

        it('should accept empty options object', () => {
            const result = validateNotificationQuery({})
            expect(result).toEqual({ unreadOnly: false, limit: 50 })
        })

        it('should accept unreadOnly as true', () => {
            const result = validateNotificationQuery({ unreadOnly: true })
            expect(result).toEqual({ unreadOnly: true, limit: 50 })
        })

        it('should accept unreadOnly as false', () => {
            const result = validateNotificationQuery({ unreadOnly: false })
            expect(result).toEqual({ unreadOnly: false, limit: 50 })
        })

        it('should accept custom limit', () => {
            const result = validateNotificationQuery({ limit: 25 })
            expect(result).toEqual({ unreadOnly: false, limit: 25 })
        })

        it('should accept limit at maximum (100)', () => {
            const result = validateNotificationQuery({ limit: 100 })
            expect(result).toEqual({ unreadOnly: false, limit: 100 })
        })

        it('should reject limit less than 1', () => {
            const result = validateNotificationQuery({ limit: 0 })
            expect(result).toBeNull()
        })

        it('should reject limit greater than 100', () => {
            const result = validateNotificationQuery({ limit: 101 })
            expect(result).toBeNull()
        })

        it('should reject negative limit', () => {
            const result = validateNotificationQuery({ limit: -10 })
            expect(result).toBeNull()
        })

        it('should combine unreadOnly with custom limit', () => {
            const result = validateNotificationQuery({
                unreadOnly: true,
                limit: 30,
            })
            expect(result).toEqual({ unreadOnly: true, limit: 30 })
        })
    })

    describe('validateNotificationId', () => {
        const validUuid = '123e4567-e89b-12d3-a456-426614174000'

        it('should accept valid UUID', () => {
            const result = validateNotificationId(validUuid)
            expect(result).toBeNull()
        })

        it('should reject empty string', () => {
            const result = validateNotificationId('')
            expect(result).toBe('Notification ID is required')
        })

        it('should reject whitespace-only string', () => {
            const result = validateNotificationId('   ')
            expect(result).toBe('Notification ID is required')
        })

        it('should reject invalid UUID format', () => {
            const result = validateNotificationId('not-a-uuid')
            expect(result).toBe('Invalid notification ID format')
        })

        it('should reject UUID without dashes', () => {
            const result = validateNotificationId(
                '123e4567e89b12d3a456426614174000',
            )
            expect(result).toBe('Invalid notification ID format')
        })

        it('should reject partial UUID', () => {
            const result = validateNotificationId('123e4567-e89b-12d3')
            expect(result).toBe('Invalid notification ID format')
        })

        it('should accept uppercase UUID', () => {
            const result = validateNotificationId(
                '123E4567-E89B-12D3-A456-426614174000',
            )
            expect(result).toBeNull()
        })

        it('should accept UUID with mixed case', () => {
            const result = validateNotificationId(
                '123e4567-E89b-12d3-A456-426614174000',
            )
            expect(result).toBeNull()
        })
    })
})
