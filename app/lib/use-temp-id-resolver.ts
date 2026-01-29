/**
 * React Hook for Temp ID Resolution
 *
 * Provides a convenient hook interface for integrating the TempIdResolver
 * into mutation hooks. Handles initialization and provides helper functions
 * for registering mappings and updating pending mutations.
 *
 * @module use-temp-id-resolver
 *
 * **Validates: Requirements 11.1, 11.2**
 */

import { useCallback, useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { tempIdResolver } from './temp-id-resolver'
import type {
  BlockedMutation,
  EntityType,
  TempIdMapping,
} from './temp-id-resolver'

/**
 * Result type for the useTempIdResolver hook.
 */
export interface UseTempIdResolverResult {
  /** Whether the resolver has been initialized */
  isInitialized: boolean

  /** Register a temp ID → server ID mapping */
  register: (
    tempId: string,
    serverId: string,
    entityType: EntityType,
  ) => Promise<void>

  /** Resolve a temp ID to its server ID */
  resolve: (tempId: string) => string | undefined

  /** Update all pending mutations with resolved temp IDs */
  updatePendingMutations: () => number

  /** Get all blocked mutations */
  blockedMutations: Array<BlockedMutation>

  /** Get all current mappings */
  mappings: Array<TempIdMapping>

  /** Clear all mappings */
  clear: () => Promise<void>

  /** Mark a mutation as blocked */
  markBlocked: (
    mutationKey: string,
    unresolvedTempId: string,
    description: string,
  ) => Promise<void>

  /** Unblock a mutation */
  unblock: (mutationKey: string) => Promise<void>
}

/**
 * Hook for integrating temp ID resolution into React components.
 *
 * Initializes the TempIdResolver on mount and provides helper functions
 * for registering mappings and updating pending mutations.
 *
 * @returns Object with resolver functions and state
 *
 * @example
 * ```typescript
 * function MyComponent() {
 *   const { register, updatePendingMutations, blockedMutations } = useTempIdResolver()
 *
 *   // In mutation onSuccess:
 *   onSuccess: async (serverId, variables, context) => {
 *     if (context?.tempId) {
 *       await register(context.tempId, serverId, 'batch')
 *       updatePendingMutations()
 *     }
 *   }
 * }
 * ```
 *
 * **Validates: Requirements 11.1, 11.2**
 */
export function useTempIdResolver(): UseTempIdResolverResult {
  const queryClient = useQueryClient()
  const [isInitialized, setIsInitialized] = useState(false)
  const [blockedMutations, setBlockedMutations] = useState<
    Array<BlockedMutation>
  >([])
  const [mappings, setMappings] = useState<Array<TempIdMapping>>([])

  // Initialize the resolver on mount
  useEffect(() => {
    let mounted = true

    const init = async () => {
      await tempIdResolver.initialize()
      if (mounted) {
        setIsInitialized(true)
        setBlockedMutations(tempIdResolver.getBlockedMutations())
        setMappings(tempIdResolver.getAllMappings())
      }
    }

    init()

    // Subscribe to blocked mutation changes
    const unsubscribe = tempIdResolver.onBlockedChange((blocked) => {
      if (mounted) {
        setBlockedMutations(blocked)
      }
    })

    return () => {
      mounted = false
      unsubscribe()
    }
  }, [])

  /**
   * Register a temp ID → server ID mapping and update pending mutations.
   */
  const register = useCallback(
    async (tempId: string, serverId: string, entityType: EntityType) => {
      await tempIdResolver.register(tempId, serverId, entityType)
      setMappings(tempIdResolver.getAllMappings())

      // Automatically update pending mutations after registration
      tempIdResolver.updatePendingMutations(queryClient)
    },
    [queryClient],
  )

  /**
   * Resolve a temp ID to its server ID.
   */
  const resolve = useCallback((tempId: string) => {
    return tempIdResolver.resolve(tempId)
  }, [])

  /**
   * Update all pending mutations with resolved temp IDs.
   */
  const updatePendingMutations = useCallback(() => {
    return tempIdResolver.updatePendingMutations(queryClient)
  }, [queryClient])

  /**
   * Clear all mappings.
   */
  const clear = useCallback(async () => {
    await tempIdResolver.clearAll()
    setMappings([])
    setBlockedMutations([])
  }, [])

  /**
   * Mark a mutation as blocked.
   */
  const markBlocked = useCallback(
    async (
      mutationKey: string,
      unresolvedTempId: string,
      description: string,
    ) => {
      await tempIdResolver.markBlocked(
        mutationKey,
        unresolvedTempId,
        description,
      )
    },
    [],
  )

  /**
   * Unblock a mutation.
   */
  const unblock = useCallback(async (mutationKey: string) => {
    await tempIdResolver.unblock(mutationKey)
  }, [])

  return {
    isInitialized,
    register,
    resolve,
    updatePendingMutations,
    blockedMutations,
    mappings,
    clear,
    markBlocked,
    unblock,
  }
}

/**
 * Helper function to create an onSuccess handler that registers temp ID mappings.
 *
 * This is a convenience function for use in mutation hooks that creates
 * a standardized onSuccess handler pattern.
 *
 * @param entityType - The type of entity being created
 * @param onSuccessCallback - Optional additional callback to run after registration
 * @returns An onSuccess handler function
 *
 * @example
 * ```typescript
 * const createBatch = useMutation({
 *   mutationFn: createBatchFn,
 *   onSuccess: createTempIdRegistrationHandler('batch', (serverId) => {
 *     toast.success('Batch created!')
 *   }),
 * })
 * ```
 */
export function createTempIdRegistrationHandler<
  TData extends string,
  TVariables,
  TContext extends { tempId?: string },
>(
  entityType: EntityType,
  onSuccessCallback?: (
    serverId: TData,
    variables: TVariables,
    context: TContext | undefined,
  ) => void,
) {
  return async (
    serverId: TData,
    variables: TVariables,
    context: TContext | undefined,
  ) => {
    if (context?.tempId) {
      await tempIdResolver.register(context.tempId, serverId, entityType)
    }

    if (onSuccessCallback) {
      onSuccessCallback(serverId, variables, context)
    }
  }
}
