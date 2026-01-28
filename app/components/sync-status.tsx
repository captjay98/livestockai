import { useCallback, useSyncExternalStore } from 'react'
import { useMutationState, useQueryClient } from '@tanstack/react-query'
import {
    AlertTriangle,
    Check,
    CloudOff,
    HardDrive,
    Loader2,
    RefreshCw,
} from 'lucide-react'
import type { StorageStatus } from '~/lib/storage-monitor'
import { cn } from '~/lib/utils'
import { Button } from '~/components/ui/button'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '~/components/ui/tooltip'
import { useStorageMonitor } from '~/lib/storage-monitor'

export type SyncState = 'synced' | 'syncing' | 'pending' | 'offline' | 'failed'

function useOnlineStatus() {
    return useSyncExternalStore(
        (callback) => {
            window.addEventListener('online', callback)
            window.addEventListener('offline', callback)
            return () => {
                window.removeEventListener('online', callback)
                window.removeEventListener('offline', callback)
            }
        },
        () => navigator.onLine,
        () => true,
    )
}

interface SyncStatusProps {
    className?: string
    showLabel?: boolean
    size?: 'sm' | 'default'
    showRetryButton?: boolean
    showStorage?: boolean
}

/**
 * SyncStatus component displays the current synchronization state.
 *
 * Uses TanStack Query's useMutationState() to accurately track:
 * - Pending mutations (queued for sync)
 * - Paused mutations (waiting for network)
 * - Failed mutations (need retry)
 * - Storage usage (optional)
 *
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 13.2, 13.3, 13.5**
 */
export function SyncStatus({
    className,
    showLabel = true,
    size = 'default',
    showRetryButton = true,
    showStorage = false,
}: SyncStatusProps) {
    const isOnline = useOnlineStatus()
    const queryClient = useQueryClient()
    const {
        quota,
        status: storageStatus,
        usageFormatted,
        quotaFormatted,
    } = useStorageMonitor()

    // Use useMutationState for reactive updates to mutation status
    // This subscribes to mutation cache changes automatically
    const pendingMutations = useMutationState({
        filters: { status: 'pending' },
        select: (mutation) => mutation.state.status,
    })

    // Track paused mutations (offline-queued)
    const pausedMutations = useMutationState({
        filters: { status: 'pending' },
        select: (mutation) => mutation.state.isPaused,
    })

    // Track failed mutations
    const failedMutations = useMutationState({
        filters: { status: 'error' },
        select: (mutation) => mutation.state.status,
    })

    const pendingCount = pendingMutations.length
    const pausedCount = pausedMutations.filter(Boolean).length
    const failedCount = failedMutations.length

    // Retry all failed mutations
    const handleRetry = useCallback(() => {
        const mutationCache = queryClient.getMutationCache()
        const failedMutationsList = mutationCache
            .getAll()
            .filter((m) => m.state.status === 'error')

        failedMutationsList.forEach((mutation) => {
            // Reset the mutation state and retry
            mutation.reset()
        })

        // Trigger a refetch of all queries to sync state
        queryClient.invalidateQueries()
    }, [queryClient])

    // Determine state based on mutation status
    let state: SyncState
    if (!isOnline) {
        state = 'offline'
    } else if (failedCount > 0) {
        state = 'failed'
    } else if (pendingCount > 0 && pausedCount === 0) {
        state = 'syncing'
    } else if (pausedCount > 0) {
        state = 'pending'
    } else {
        state = 'synced'
    }

    const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'
    const textSize = size === 'sm' ? 'text-xs' : 'text-sm'
    const buttonSize = size === 'sm' ? 'h-5 px-1.5 text-xs' : 'h-6 px-2 text-xs'

    const config = {
        synced: {
            icon: Check,
            label: 'Synced',
            dotColor: 'bg-success',
            textColor: 'text-success',
            tooltip: 'All changes saved',
        },
        syncing: {
            icon: Loader2,
            label: `Syncing${pendingCount > 0 ? ` (${pendingCount})` : '...'}`,
            dotColor: 'bg-primary animate-pulse',
            textColor: 'text-primary',
            tooltip: `Syncing ${pendingCount} change${pendingCount !== 1 ? 's' : ''}`,
        },
        pending: {
            icon: RefreshCw,
            label: `Pending (${pausedCount})`,
            dotColor: 'bg-muted-foreground',
            textColor: 'text-muted-foreground',
            tooltip: `${pausedCount} change${pausedCount !== 1 ? 's' : ''} waiting for network`,
        },
        offline: {
            icon: CloudOff,
            label: pausedCount > 0 ? `Offline (${pausedCount})` : 'Offline',
            dotColor: 'bg-destructive',
            textColor: 'text-destructive',
            tooltip:
                pausedCount > 0
                    ? `Offline - ${pausedCount} change${pausedCount !== 1 ? 's' : ''} will sync when online`
                    : 'No internet connection',
        },
        failed: {
            icon: AlertTriangle,
            label: `Failed (${failedCount})`,
            dotColor: 'bg-destructive',
            textColor: 'text-destructive',
            tooltip: `${failedCount} change${failedCount !== 1 ? 's' : ''} failed to sync`,
        },
    }

    const { icon: Icon, label, dotColor, textColor, tooltip } = config[state]

    // Storage status colors
    const storageColors: Record<StorageStatus, string> = {
        ok: 'text-muted-foreground',
        warning: 'text-warning',
        critical: 'text-destructive',
        blocked: 'text-destructive',
    }

    return (
        <TooltipProvider>
            <div className={cn('flex items-center gap-3', className)}>
                {/* Sync Status */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div
                            className={cn(
                                'flex items-center gap-1.5',
                                textColor,
                                textSize,
                            )}
                        >
                            <span
                                className={cn(
                                    'h-2 w-2 rounded-full shrink-0',
                                    dotColor,
                                )}
                            />
                            {state === 'syncing' ? (
                                <Icon
                                    className={cn(iconSize, 'animate-spin')}
                                />
                            ) : (
                                <Icon className={iconSize} />
                            )}
                            {showLabel && (
                                <span className="font-medium">{label}</span>
                            )}

                            {/* Retry button for failed mutations */}
                            {state === 'failed' && showRetryButton && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className={cn(buttonSize, 'ml-1')}
                                    onClick={handleRetry}
                                >
                                    Retry
                                </Button>
                            )}
                        </div>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{tooltip}</p>
                    </TooltipContent>
                </Tooltip>

                {/* Storage Status */}
                {showStorage && quota && (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div
                                className={cn(
                                    'flex items-center gap-1',
                                    storageColors[storageStatus],
                                    textSize,
                                )}
                            >
                                <HardDrive className={iconSize} />
                                {showLabel && (
                                    <span className="font-medium">
                                        {quota.percentage.toFixed(0)}%
                                    </span>
                                )}
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>
                                Storage: {usageFormatted} / {quotaFormatted}
                                {storageStatus === 'warning' &&
                                    ' - Consider syncing soon'}
                                {storageStatus === 'critical' &&
                                    ' - Storage almost full!'}
                                {storageStatus === 'blocked' &&
                                    ' - Sync required to continue'}
                            </p>
                        </TooltipContent>
                    </Tooltip>
                )}
            </div>
        </TooltipProvider>
    )
}

/**
 * Hook to get the current sync status programmatically.
 * Useful for conditional rendering or logic based on sync state.
 */
export function useSyncStatus() {
    const isOnline = useOnlineStatus()
    const queryClient = useQueryClient()

    const pendingMutations = useMutationState({
        filters: { status: 'pending' },
        select: (mutation) => mutation.state.status,
    })

    const pausedMutations = useMutationState({
        filters: { status: 'pending' },
        select: (mutation) => mutation.state.isPaused,
    })

    const failedMutations = useMutationState({
        filters: { status: 'error' },
        select: (mutation) => mutation.state.status,
    })

    const pendingCount = pendingMutations.length
    const pausedCount = pausedMutations.filter(Boolean).length
    const failedCount = failedMutations.length

    let state: SyncState
    if (!isOnline) {
        state = 'offline'
    } else if (failedCount > 0) {
        state = 'failed'
    } else if (pendingCount > 0 && pausedCount === 0) {
        state = 'syncing'
    } else if (pausedCount > 0) {
        state = 'pending'
    } else {
        state = 'synced'
    }

    return {
        state,
        isOnline,
        pendingCount,
        pausedCount,
        failedCount,
        hasPendingChanges: pendingCount > 0 || pausedCount > 0,
        hasFailedChanges: failedCount > 0,
        retryFailed: () => {
            const mutationCache = queryClient.getMutationCache()
            const failedMutationsList = mutationCache
                .getAll()
                .filter((m) => m.state.status === 'error')

            failedMutationsList.forEach((mutation) => {
                mutation.reset()
            })

            queryClient.invalidateQueries()
        },
    }
}
