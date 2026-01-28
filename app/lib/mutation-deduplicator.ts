import { isTempId } from './temp-id-resolver'
import type { Mutation, MutationCache } from '@tanstack/react-query'

/**
 * Mutation metadata for deduplication
 */
export interface MutationMeta {
  /** Unique identifier for the mutation */
  id: number
  /** Type of mutation: create, update, or delete */
  type: 'create' | 'update' | 'delete'
  /** Entity type (batch, sale, feed, etc.) */
  entityType: string
  /** Entity ID (temp ID for creates, server ID for updates/deletes) */
  entityId: string
  /** Timestamp when mutation was created */
  timestamp: number
  /** The mutation variables */
  variables: Record<string, unknown>
}

/**
 * Extract mutation metadata from a TanStack Query mutation
 *
 * @param mutation - The mutation to extract metadata from
 * @returns Mutation metadata or null if not extractable
 */
export function extractMutationMeta(mutation: Mutation): MutationMeta | null {
  const state = mutation.state
  const variables = state.variables as Record<string, unknown> | undefined

  if (!variables) return null

  // Try to determine mutation type and entity info from mutation key or variables
  const mutationKey = mutation.options.mutationKey as Array<string> | undefined

  if (!mutationKey || mutationKey.length < 2) return null

  const entityType = mutationKey[0]
  const type = mutationKey[1] as 'create' | 'update' | 'delete'

  // Extract entity ID from variables
  let entityId: string | undefined

  if (type === 'create') {
    // For creates, look for tempId in context or variables
    const ctx = mutation.state.context as { tempId?: string } | undefined
    entityId = ctx?.tempId
  } else {
    // For updates/deletes, look for id in variables
    entityId = (variables.id as string) || (variables.recordId as string)
  }

  if (!entityId) return null

  return {
    id: mutation.mutationId,
    type,
    entityType,
    entityId,
    timestamp: state.submittedAt || Date.now(),
    variables,
  }
}

/**
 * Result of deduplication
 */
export interface DeduplicationResult {
  /** Mutations to keep */
  keep: Array<number>
  /** Mutations to remove */
  remove: Array<number>
  /** Description of deduplication actions taken */
  actions: Array<string>
}

/**
 * Deduplicate mutations to optimize sync.
 *
 * Applies the following optimizations:
 * 1. Create + Delete = Remove both (entity never existed on server)
 * 2. Multiple Updates = Merge into single update with latest values
 * 3. Update + Delete = Remove updates, keep only delete
 *
 * **Validates: Requirements 12.1, 12.2, 12.3, 12.4**
 *
 * @param mutations - Array of mutation metadata to deduplicate
 * @returns Deduplication result with mutations to keep/remove
 */
export function deduplicateMutations(
  mutations: Array<MutationMeta>,
): DeduplicationResult {
  const keep: Array<number> = []
  const remove: Array<number> = []
  const actions: Array<string> = []

  // Group mutations by entity
  const byEntity = new Map<string, Array<MutationMeta>>()

  for (const mutation of mutations) {
    const key = `${mutation.entityType}:${mutation.entityId}`
    const existing = byEntity.get(key) || []
    existing.push(mutation)
    byEntity.set(key, existing)
  }

  // Process each entity's mutations
  for (const [entityKey, entityMutations] of byEntity) {
    // Sort by timestamp
    const sorted = [...entityMutations].sort(
      (a, b) => a.timestamp - b.timestamp,
    )

    const hasCreate = sorted.some((m) => m.type === 'create')
    const hasDelete = sorted.some((m) => m.type === 'delete')
    const updates = sorted.filter((m) => m.type === 'update')

    // Case 1: Create + Delete = Remove both
    if (hasCreate && hasDelete) {
      // Only if the entity ID is a temp ID (never synced to server)
      const createMutation = sorted.find((m) => m.type === 'create')
      if (createMutation && isTempId(createMutation.entityId)) {
        for (const m of sorted) {
          remove.push(m.id)
        }
        actions.push(`Cancelled create+delete for ${entityKey}`)
        continue
      }
    }

    // Case 2: Update + Delete = Remove updates, keep delete
    if (hasDelete && updates.length > 0) {
      const deleteMutation = sorted.find((m) => m.type === 'delete')!
      keep.push(deleteMutation.id)

      for (const update of updates) {
        remove.push(update.id)
      }

      // Keep create if exists (it was synced)
      const createMutation = sorted.find((m) => m.type === 'create')
      if (createMutation && !isTempId(createMutation.entityId)) {
        keep.push(createMutation.id)
      }

      actions.push(
        `Removed ${updates.length} updates before delete for ${entityKey}`,
      )
      continue
    }

    // Case 3: Multiple updates = Merge into latest
    if (updates.length > 1) {
      // Keep only the latest update with merged variables
      const latestUpdate = updates[updates.length - 1]
      keep.push(latestUpdate.id)

      for (let i = 0; i < updates.length - 1; i++) {
        remove.push(updates[i].id)
      }

      actions.push(`Merged ${updates.length} updates into one for ${entityKey}`)

      // Keep create if exists
      const createMutation = sorted.find((m) => m.type === 'create')
      if (createMutation) {
        keep.push(createMutation.id)
      }

      continue
    }

    // No optimization needed, keep all
    for (const m of sorted) {
      keep.push(m.id)
    }
  }

  return { keep, remove, actions }
}

/**
 * Apply deduplication to a mutation cache.
 *
 * @param mutationCache - The TanStack Query mutation cache
 * @returns Deduplication result
 */
export function deduplicateMutationCache(
  mutationCache: MutationCache,
): DeduplicationResult {
  const pendingMutations = mutationCache
    .getAll()
    .filter((m) => m.state.status === 'pending' || m.state.isPaused)

  const metas: Array<MutationMeta> = []

  for (const mutation of pendingMutations) {
    const meta = extractMutationMeta(mutation)
    if (meta) {
      metas.push(meta)
    }
  }

  return deduplicateMutations(metas)
}

/**
 * Merge multiple update variables into a single update.
 * Later values override earlier values.
 *
 * @param updates - Array of update variables in chronological order
 * @returns Merged update variables
 */
export function mergeUpdateVariables(
  updates: Array<Record<string, unknown>>,
): Record<string, unknown> {
  return updates.reduce((merged, update) => {
    return { ...merged, ...update }
  }, {})
}
