import { useCallback, useEffect, useState } from 'react'

/**
 * Storage quota information
 */
export interface StorageQuota {
    usage: number
    quota: number
    percentage: number
    available: number
}

/**
 * Storage status levels
 */
export type StorageStatus = 'ok' | 'warning' | 'critical' | 'blocked'

/**
 * Storage thresholds (percentage of quota)
 */
export const STORAGE_THRESHOLDS = {
    warning: 70, // Show warning at 70%
    critical: 85, // Show critical alert at 85%
    blocked: 95, // Block new mutations at 95%
} as const

/**
 * Format bytes to human-readable string
 *
 * @param bytes - Number of bytes
 * @returns Formatted string (e.g., "1.5 MB", "256 KB")
 */
export function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B'

    const units = ['B', 'KB', 'MB', 'GB', 'TB']
    const k = 1024
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${units[i]}`
}

/**
 * Get storage status based on percentage
 *
 * @param percentage - Storage usage percentage
 * @returns Storage status level
 */
export function getStorageStatus(percentage: number): StorageStatus {
    if (percentage >= STORAGE_THRESHOLDS.blocked) return 'blocked'
    if (percentage >= STORAGE_THRESHOLDS.critical) return 'critical'
    if (percentage >= STORAGE_THRESHOLDS.warning) return 'warning'
    return 'ok'
}

/**
 * Check if storage is available for new mutations
 *
 * @param percentage - Storage usage percentage
 * @returns True if storage is available
 */
export function canQueueMutation(percentage: number): boolean {
    return percentage < STORAGE_THRESHOLDS.blocked
}

/**
 * Get current storage quota information
 *
 * @returns Storage quota info or null if API unavailable
 */
export async function getStorageQuota(): Promise<StorageQuota | null> {
    // Check for browser environment and Storage API availability
    if (typeof window === 'undefined') {
        return null
    }

    try {
        // Use optional chaining with type assertion to handle environments where storage may not exist
        const storageManager = (navigator as { storage?: StorageManager })
            .storage
        if (!storageManager) {
            return null
        }

        const estimate = await storageManager.estimate()
        const usage = estimate.usage
        const quota = estimate.quota
        const percentage = quota > 0 ? (usage / quota) * 100 : 0
        const available = quota - usage

        return {
            usage,
            quota,
            percentage,
            available,
        }
    } catch {
        return null
    }
}

/**
 * Hook result for storage monitoring
 */
export interface UseStorageMonitorResult {
    /** Current storage quota info */
    quota: StorageQuota | null
    /** Current storage status */
    status: StorageStatus
    /** Whether storage API is available */
    isAvailable: boolean
    /** Whether new mutations can be queued */
    canQueue: boolean
    /** Refresh storage info */
    refresh: () => Promise<void>
    /** Formatted usage string */
    usageFormatted: string
    /** Formatted quota string */
    quotaFormatted: string
    /** Formatted available string */
    availableFormatted: string
}

/**
 * Hook to monitor storage quota and usage.
 *
 * Provides real-time storage information with automatic refresh.
 * Gracefully degrades when Storage API is unavailable.
 *
 * **Validates: Requirements 13.1, 13.6**
 *
 * @param refreshInterval - Interval in ms to refresh storage info (default: 30s)
 * @returns Storage monitoring state and utilities
 */
export function useStorageMonitor(
    refreshInterval = 30000,
): UseStorageMonitorResult {
    const [quota, setQuota] = useState<StorageQuota | null>(null)
    const [isAvailable, setIsAvailable] = useState(true)

    const refresh = useCallback(async () => {
        const result = await getStorageQuota()
        if (result === null) {
            setIsAvailable(false)
        } else {
            setQuota(result)
            setIsAvailable(true)
        }
    }, [])

    useEffect(() => {
        refresh()

        const interval = setInterval(refresh, refreshInterval)
        return () => clearInterval(interval)
    }, [refresh, refreshInterval])

    const status = quota ? getStorageStatus(quota.percentage) : 'ok'
    const canQueue = quota ? canQueueMutation(quota.percentage) : true

    return {
        quota,
        status,
        isAvailable,
        canQueue,
        refresh,
        usageFormatted: quota ? formatBytes(quota.usage) : 'Unknown',
        quotaFormatted: quota ? formatBytes(quota.quota) : 'Unknown',
        availableFormatted: quota ? formatBytes(quota.available) : 'Unknown',
    }
}

/**
 * Check storage before queuing a mutation.
 *
 * @returns Object with canQueue boolean and optional error message
 */
export async function checkStorageBeforeMutation(): Promise<{
    canQueue: boolean
    message?: string
    status: StorageStatus
}> {
    const quota = await getStorageQuota()

    if (!quota) {
        // API unavailable, allow mutation
        return { canQueue: true, status: 'ok' }
    }

    const status = getStorageStatus(quota.percentage)

    if (status === 'blocked') {
        return {
            canQueue: false,
            status,
            message: `Storage is ${quota.percentage.toFixed(0)}% full. Please sync your data to free up space before making more changes.`,
        }
    }

    if (status === 'critical') {
        return {
            canQueue: true,
            status,
            message: `Storage is ${quota.percentage.toFixed(0)}% full. Consider syncing soon.`,
        }
    }

    return { canQueue: true, status }
}
