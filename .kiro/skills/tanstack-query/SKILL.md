---
name: TanStack Query
description: Client-side data fetching, caching, and mutations in OpenLivestock
---

# TanStack Query

OpenLivestock uses [TanStack Query](https://tanstack.com/query) for client-side data management, primarily for mutations and cache invalidation.

## Key Principle

**Route loaders handle data fetching. TanStack Query handles mutations.**

```typescript
// ✅ Data fetching - use route loaders
export const Route = createFileRoute('/_auth/batches/')({
  loader: async ({ deps }) => getBatchesForFarmFn({ data: deps }),
})

// ✅ Mutations - use TanStack Query
const mutation = useMutation({
  mutationFn: (data) => createBatchFn({ data: { batch: data } }),
})
```

## Mutation Pattern

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createBatchFn } from '~/features/batches/server'

function BatchForm() {
  const queryClient = useQueryClient()

  const createBatch = useMutation({
    mutationFn: (data: CreateBatchData) =>
      createBatchFn({ data: { batch: data } }),
    onSuccess: () => {
      // Invalidate related queries to refetch
      queryClient.invalidateQueries({ queryKey: ['batches'] })
      toast.success('Batch created successfully')
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const handleSubmit = (formData: CreateBatchData) => {
    createBatch.mutate(formData)
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <Button
        type="submit"
        disabled={createBatch.isPending}
      >
        {createBatch.isPending ? 'Creating...' : 'Create Batch'}
      </Button>
    </form>
  )
}
```

## Query Client Configuration

The query client is configured in `app/lib/query-client.ts`:

```typescript
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000, // 30 seconds
      gcTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
})
```

## Cache Invalidation

After mutations, invalidate related queries:

```typescript
const deleteBatch = useMutation({
  mutationFn: (batchId: string) => deleteBatchFn({ data: { batchId } }),
  onSuccess: () => {
    // Invalidate batch list
    queryClient.invalidateQueries({ queryKey: ['batches'] })
    // Invalidate dashboard stats
    queryClient.invalidateQueries({ queryKey: ['dashboard'] })
  },
})
```

## Optimistic Updates

For better UX, update the cache optimistically:

```typescript
const updateBatch = useMutation({
  mutationFn: (data) => updateBatchFn({ data }),
  onMutate: async (newData) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: ['batches', newData.batchId] })

    // Snapshot previous value
    const previousBatch = queryClient.getQueryData(['batches', newData.batchId])

    // Optimistically update
    queryClient.setQueryData(['batches', newData.batchId], (old) => ({
      ...old,
      ...newData,
    }))

    return { previousBatch }
  },
  onError: (err, newData, context) => {
    // Rollback on error
    queryClient.setQueryData(
      ['batches', newData.batchId],
      context?.previousBatch,
    )
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ['batches'] })
  },
})
```

## Custom Hooks Pattern

Encapsulate mutations in custom hooks:

```typescript
// app/features/batches/use-batch-mutations.ts
export function useBatchMutations() {
  const queryClient = useQueryClient()

  const createBatch = useMutation({
    mutationFn: (data: CreateBatchData) =>
      createBatchFn({ data: { batch: data } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batches'] })
    },
  })

  const updateBatch = useMutation({
    mutationFn: (data: { batchId: string; batch: UpdateBatchData }) =>
      updateBatchFn({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batches'] })
    },
  })

  const deleteBatch = useMutation({
    mutationFn: (batchId: string) => deleteBatchFn({ data: { batchId } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batches'] })
    },
  })

  return { createBatch, updateBatch, deleteBatch }
}
```

## When NOT to Use TanStack Query

Don't use `useQuery` for initial data - use route loaders instead:

```typescript
// ❌ Wrong - use route loader instead
const { data, isLoading } = useQuery({
  queryKey: ['batches'],
  queryFn: () => getBatchesFn({ data: {} }),
})

// ✅ Correct - route loader
export const Route = createFileRoute('/_auth/batches/')({
  loader: async () => getBatchesFn({ data: {} }),
})
```

## Related Skills

- `tanstack-router` - Route loaders for data fetching
- `tanstack-start` - Server functions
- `error-handling` - Error handling in mutations
