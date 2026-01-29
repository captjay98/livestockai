import { get, set } from 'idb-keyval'
import { TEMP_ID_PREFIX } from './optimistic-utils'
import type { QueryClient } from '@tanstack/react-query'

/**
 * Storage key for persisting temp ID mappings to IndexedDB
 */
const TEMP_ID_STORAGE_KEY = 'openlivestock-temp-id-mappings'
const BLOCKED_MUTATIONS_KEY = 'openlivestock-blocked-mutations'

/**
 * Entity types that can have temp IDs
 */
export type EntityType =
  | 'batch'
  | 'feed'
  | 'mortality'
  | 'weight'
  | 'water-quality'
  | 'egg'
  | 'vaccination'
  | 'sale'
  | 'expense'
  | 'invoice'
  | 'customer'
  | 'supplier'
  | 'structure'
  | 'task'

/**
 * Mapping of temp ID to server ID
 */
export interface TempIdMapping {
  tempId: string
  serverId: string
  entityType: string
  createdAt: number
}

/**
 * Blocked mutation info
 */
export interface BlockedMutation {
  mutationKey: string
  unresolvedTempId: string
  description: string
  blockedAt: number
}

/**
 * TempIdResolver manages the mapping between temporary IDs (used for optimistic updates)
 * and server-assigned IDs (returned after successful sync).
 *
 * This enables dependent mutations to be updated with real IDs before execution.
 * For example, if a batch is created offline with temp-batch-123, and a feed record
 * references that batch, when the batch syncs and gets server ID abc-456, the feed
 * record's batchId will be updated from temp-batch-123 to abc-456.
 *
 * **Validates: Requirements 11.1, 11.2, 11.3**
 */
class TempIdResolverClass {
  private mappings: Map<string, TempIdMapping> = new Map()
  private blockedMutations: Map<string, BlockedMutation> = new Map()
  private initialized = false
  private blockedChangeListeners: Set<
    (blocked: Array<BlockedMutation>) => void
  > = new Set()

  /**
   * Initialize the resolver by loading persisted mappings from IndexedDB
   */
  async init(): Promise<void> {
    if (this.initialized || typeof window === 'undefined') return

    try {
      const stored = await get<Array<TempIdMapping>>(TEMP_ID_STORAGE_KEY)
      if (stored) {
        for (const mapping of stored) {
          this.mappings.set(mapping.tempId, mapping)
        }
      }

      const blockedStored = await get<Array<BlockedMutation>>(
        BLOCKED_MUTATIONS_KEY,
      )
      if (blockedStored) {
        for (const blocked of blockedStored) {
          this.blockedMutations.set(blocked.mutationKey, blocked)
        }
      }

      this.initialized = true
    } catch {
      // IndexedDB not available, continue with in-memory only
      this.initialized = true
    }
  }

  /**
   * Alias for init() for consistency with hook naming
   */
  async initialize(): Promise<void> {
    return this.init()
  }

  /**
   * Register a mapping from temp ID to server ID
   *
   * @param tempId - The temporary ID used for optimistic update
   * @param serverId - The server-assigned ID after successful sync
   * @param entityType - The type of entity (batch, sale, feed, etc.)
   */
  async register(
    tempId: string,
    serverId: string,
    entityType: string,
  ): Promise<void> {
    const mapping: TempIdMapping = {
      tempId,
      serverId,
      entityType,
      createdAt: Date.now(),
    }

    this.mappings.set(tempId, mapping)
    await this.persist()
  }

  /**
   * Resolve a temp ID to its server ID
   *
   * @param tempId - The temporary ID to resolve
   * @returns The server ID if found, or the original ID if not a temp ID or not found
   */
  resolve(tempId: string): string {
    if (!isTempId(tempId)) return tempId

    const mapping = this.mappings.get(tempId)
    return mapping?.serverId ?? tempId
  }

  /**
   * Check if a temp ID has been resolved
   *
   * @param tempId - The temporary ID to check
   * @returns True if the temp ID has a server ID mapping
   */
  isResolved(tempId: string): boolean {
    return this.mappings.has(tempId)
  }

  /**
   * Get all mappings for a specific entity type
   *
   * @param entityType - The entity type to filter by
   * @returns Array of mappings for the entity type
   */
  getMappingsForType(entityType: string): Array<TempIdMapping> {
    return Array.from(this.mappings.values()).filter(
      (m) => m.entityType === entityType,
    )
  }

  /**
   * Get all current mappings
   */
  getAllMappings(): Array<TempIdMapping> {
    return Array.from(this.mappings.values())
  }

  /**
   * Clear a specific mapping
   *
   * @param tempId - The temp ID to clear
   */
  async clear(tempId: string): Promise<void> {
    this.mappings.delete(tempId)
    await this.persist()
  }

  /**
   * Clear all mappings
   */
  async clearAll(): Promise<void> {
    this.mappings.clear()
    await this.persist()
  }

  /**
   * Clear old mappings (older than specified age in milliseconds)
   * Default: 7 days
   *
   * @param maxAge - Maximum age in milliseconds
   */
  async clearOld(maxAge: number = 7 * 24 * 60 * 60 * 1000): Promise<void> {
    const now = Date.now()
    const toDelete: Array<string> = []

    for (const [tempId, mapping] of this.mappings) {
      if (now - mapping.createdAt > maxAge) {
        toDelete.push(tempId)
      }
    }

    for (const tempId of toDelete) {
      this.mappings.delete(tempId)
    }

    if (toDelete.length > 0) {
      await this.persist()
    }
  }

  /**
   * Update pending mutations in the query client with resolved temp IDs.
   * Scans all pending mutations and replaces temp IDs with server IDs.
   *
   * @param queryClient - The TanStack Query client
   * @returns Number of mutations updated
   *
   * **Validates: Requirements 11.2, 11.4**
   */
  updatePendingMutations(queryClient: QueryClient): number {
    const mutationCache = queryClient.getMutationCache()
    const pendingMutations = mutationCache
      .getAll()
      .filter((m) => m.state.status === 'pending' || m.state.isPaused)

    let updatedCount = 0

    for (const mutation of pendingMutations) {
      const variables = mutation.state.variables as
        | Record<string, unknown>
        | undefined
      if (!variables) continue

      // Check if this mutation has any temp IDs that can be resolved
      const unresolvedIds = findUnresolvedTempIds(variables)

      // Check if any of the unresolved IDs are now resolved
      let hasUpdates = false
      for (const tempId of unresolvedIds) {
        if (this.isResolved(tempId)) {
          hasUpdates = true
          break
        }
      }

      if (hasUpdates) {
        // Resolve all temp IDs in the mutation variables
        const resolvedVariables = resolveAllTempIds(variables)

        // Update the mutation's variables
        // Note: This is a workaround since TanStack Query doesn't expose a direct way to update variables
        // We update the state directly
        ;(mutation.state as { variables: unknown }).variables =
          resolvedVariables
        updatedCount++
      }
    }

    return updatedCount
  }

  /**
   * Mark a mutation as blocked due to unresolved parent temp ID
   *
   * @param mutationKey - Unique key for the mutation
   * @param unresolvedTempId - The temp ID that couldn't be resolved
   * @param description - Human-readable description of the blocked mutation
   *
   * **Validates: Requirement 11.5**
   */
  async markBlocked(
    mutationKey: string,
    unresolvedTempId: string,
    description: string,
  ): Promise<void> {
    const blocked: BlockedMutation = {
      mutationKey,
      unresolvedTempId,
      description,
      blockedAt: Date.now(),
    }

    this.blockedMutations.set(mutationKey, blocked)
    await this.persistBlocked()
    this.notifyBlockedChange()
  }

  /**
   * Unblock a mutation
   *
   * @param mutationKey - The mutation key to unblock
   */
  async unblock(mutationKey: string): Promise<void> {
    this.blockedMutations.delete(mutationKey)
    await this.persistBlocked()
    this.notifyBlockedChange()
  }

  /**
   * Get all blocked mutations
   */
  getBlockedMutations(): Array<BlockedMutation> {
    return Array.from(this.blockedMutations.values())
  }

  /**
   * Subscribe to blocked mutation changes
   *
   * @param listener - Callback when blocked mutations change
   * @returns Unsubscribe function
   */
  onBlockedChange(
    listener: (blocked: Array<BlockedMutation>) => void,
  ): () => void {
    this.blockedChangeListeners.add(listener)
    return () => {
      this.blockedChangeListeners.delete(listener)
    }
  }

  /**
   * Notify all listeners of blocked mutation changes
   */
  private notifyBlockedChange(): void {
    const blocked = this.getBlockedMutations()
    for (const listener of this.blockedChangeListeners) {
      listener(blocked)
    }
  }

  /**
   * Persist blocked mutations to IndexedDB
   */
  private async persistBlocked(): Promise<void> {
    if (typeof window === 'undefined') return

    try {
      const blocked = Array.from(this.blockedMutations.values())
      await set(BLOCKED_MUTATIONS_KEY, blocked)
    } catch {
      // IndexedDB not available, continue with in-memory only
    }
  }

  /**
   * Persist mappings to IndexedDB
   */
  private async persist(): Promise<void> {
    if (typeof window === 'undefined') return

    try {
      const mappings = Array.from(this.mappings.values())
      await set(TEMP_ID_STORAGE_KEY, mappings)
    } catch {
      // IndexedDB not available, continue with in-memory only
    }
  }
}

/**
 * Singleton instance of TempIdResolver
 */
export const tempIdResolver = new TempIdResolverClass()

/**
 * Check if an ID is a temporary ID
 *
 * @param id - The ID to check
 * @returns True if the ID starts with the temp ID prefix
 */
export function isTempId(id: string): boolean {
  return id.startsWith(TEMP_ID_PREFIX)
}

/**
 * Resolve all temp IDs in an object recursively
 *
 * @param obj - The object to resolve temp IDs in
 * @returns A new object with all temp IDs resolved to server IDs
 */
export function resolveAllTempIds<T extends Record<string, unknown>>(
  obj: T,
): T {
  const resolved: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string' && isTempId(value)) {
      resolved[key] = tempIdResolver.resolve(value)
    } else if (Array.isArray(value)) {
      resolved[key] = value.map((item) =>
        typeof item === 'object' && item !== null
          ? resolveAllTempIds(item as Record<string, unknown>)
          : typeof item === 'string' && isTempId(item)
            ? tempIdResolver.resolve(item)
            : item,
      )
    } else if (typeof value === 'object' && value !== null) {
      resolved[key] = resolveAllTempIds(value as Record<string, unknown>)
    } else {
      resolved[key] = value
    }
  }

  return resolved as T
}

/**
 * Check if any temp IDs in an object are unresolved
 *
 * @param obj - The object to check
 * @returns Array of unresolved temp IDs found in the object
 */
export function findUnresolvedTempIds(
  obj: Record<string, unknown>,
): Array<string> {
  const unresolved: Array<string> = []

  function scan(value: unknown): void {
    if (
      typeof value === 'string' &&
      isTempId(value) &&
      !tempIdResolver.isResolved(value)
    ) {
      unresolved.push(value)
    } else if (Array.isArray(value)) {
      value.forEach(scan)
    } else if (typeof value === 'object' && value !== null) {
      Object.values(value).forEach(scan)
    }
  }

  scan(obj)
  return [...new Set(unresolved)] // Remove duplicates
}

/**
 * Extract entity type from a temp ID
 *
 * @param tempId - The temp ID to extract entity type from
 * @returns The entity type or undefined if not a valid temp ID
 */
export function extractEntityType(tempId: string): string | undefined {
  if (!isTempId(tempId)) return undefined

  // Format: temp-{entityType}-{uuid}
  const parts = tempId.slice(TEMP_ID_PREFIX.length).split('-')
  return parts[0]
}
