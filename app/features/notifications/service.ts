/**
 * Business logic for notification operations.
 * All functions are side-effect-free and easily unit testable.
 */

import type { CreateNotificationData } from './types'

/**
 * Validate notification input data.
 * Returns validation error message or null if valid.
 */
export function validateNotificationData(
    data: CreateNotificationData,
): string | null {
    if (!data.userId || data.userId.trim() === '') {
        return 'User ID is required'
    }

    if (data.type.trim() === '') {
        return 'Notification type is required'
    }

    if (!data.title || data.title.trim() === '') {
        return 'Notification title is required'
    }

    if (data.title.length > 255) {
        return 'Title must be less than 255 characters'
    }

    if (!data.message || data.message.trim() === '') {
        return 'Notification message is required'
    }

    if (data.message.length > 2000) {
        return 'Message must be less than 2000 characters'
    }

    if (data.actionUrl && data.actionUrl.length > 500) {
        return 'Action URL must be less than 500 characters'
    }

    return null
}

/**
 * Validate notification query options.
 */
export function validateNotificationQuery(options?: {
    unreadOnly?: boolean
    limit?: number
}): { unreadOnly: boolean; limit: number } | null {
    const unreadOnly = options?.unreadOnly ?? false
    const limit = options?.limit ?? 50

    if (limit < 1 || limit > 100) {
        return null
    }

    return { unreadOnly, limit }
}

/**
 * Validate notification ID format.
 */
export function validateNotificationId(id: string): string | null {
    if (id.trim() === '') {
        return 'Notification ID is required'
    }

    // UUID validation
    const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
        return 'Invalid notification ID format'
    }

    return null
}
