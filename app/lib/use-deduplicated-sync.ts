/**
 * Hook for Deduplicated Sync
 *
 * Provides a hook that runs mutation deduplication before executing
 * pending mutations during sync. This optimizes the sync process by
 * removing redundant mutations.
 *
 * @module use-deduplicated-sync
 *
 * **Validates: Requirements 12.4**
 */

import { useCallback, useState } from 'react'
import { useMutationState, useQueryClient } from '@tanstack/react-query'
import { deduplicateMutationCache } from './mutation-deduplicator'
import type { DeduplicationResult } from './mutation-deduplicator'

/**
 * Result type for the useDeduplicatedSync hook.
 */
export interface UseDeduplicatedSyncResult {
    /** Run deduplication on pending mutations */
    deduplicate: () => DeduplicationResult
    /** Last deduplication result */
    lastResult: DeduplicationResult | null
    /** Number of pending mutations */
    pendingCount: number
    /** Whether deduplication is in progress */
    isDeduplicating: boolean
    /** Trigger a sync with deduplication */
    syncWithDeduplication: () => void
}

/**
 * Hook for running deduplicated sync.
 *
 * Provides functions to deduplicate pending mutations before sync,
 * optimizing the sync process by removing redundant operations.
 *
 * @returns Object with deduplication functions and state
 *
 * @example
 * ```typescript
 * function SyncButton() {
 *   const { syncWithDeduplication, pendingCount, lastResult } = useDeduplicatedSync()
 *
 *   return (
 *     <button onClick={syncWithDeduplication}>
 *       Sync ({pendingCount} pending)
 *     </button>
 *   )
 * }
 * ```
 *
 * **Validates: Requirements 12.4**
 */
export function useDeduplicatedSync(): UseDeduplicatedSyncResult {
    const queryClient = useQueryClient()
    const [lastResult, setLastResult] = useState<DeduplicationResult | null>(
        null,
    )
    const [isDeduplicating, setIsDeduplicating] = useState(false)

    // Get pending mutation count
    const pendingMutations = useMutationState({
        filters: {
            status: 'pending',
        },
    })

    const pausedMutations = useMutationState({
        filters: {
            predicate: (mutation) => mutation.state.isPaused,
        },
    })

    const pendingCount = pendingMutations.length + pausedMutations.length

    /**
     * Run deduplication on pending mutations.
     */
    const deduplicate = useCallback((): DeduplicationResult => {
        const mutationCache = queryClient.getMutationCache()
        const result = deduplicateMutationCache(mutationCache)

        // Log deduplication actions
        if (result.actions.length > 0) {
            console.log('[Deduplication]', result.actions.join('; '))
        }

        // Remove deduplicated mutations from cache
        for (const mutationId of result.remove) {
            const mutation = mutationCache
                .getAll()
                .find((m) => m.mutationId === mutationId)
            if (mutation) {
                mutationCache.remove(mutation)
            }
        }

        setLastResult(result)
        return result
    }, [queryClient])

    /**
     * Trigger a sync with deduplication.
     * First deduplicates pending mutations, then resumes paused mutations.
     */
    const syncWithDeduplication = useCallback((): void => {
        setIsDeduplicating(true)

        try {
            // Step 1: Deduplicate pending mutations
            const result = deduplicate()

            // Step 2: Resume paused mutations
            const mutationCache = queryClient.getMutationCache()
            const paused = mutationCache
                .getAll()
                .filter((m) => m.state.isPaused)

            // Resume each paused mutation
            for (const mutation of paused) {
                // Only resume if not in the remove list
                if (!result.remove.includes(mutation.mutationId)) {
                    mutation.continue()
                }
            }
        } finally {
            setIsDeduplicating(false)
        }
    }, [deduplicate, queryClient])

    return {
        deduplicate,
        lastResult,
        pendingCount,
        isDeduplicating,
        syncWithDeduplication,
    }
}
