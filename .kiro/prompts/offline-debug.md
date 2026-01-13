---
description: 'Debug offline functionality and sync issues'
---

# Offline Debug

Diagnose and fix offline functionality and data synchronization issues.

## Context

**Project**: OpenLivestock Manager - Livestock management for poultry and aquaculture farms
**State**: TanStack Query + IndexedDB persistence
**PWA**: Vite PWA plugin with service worker

## Common Issues

### 1. Data Not Persisting Offline

**Symptoms**:

- Data lost after closing app
- Changes not saved when offline

**Check**:

```typescript
// Verify TanStack Query persistence is configured
// app/lib/query-client.ts
import { persistQueryClient } from '@tanstack/react-query-persist-client'
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'
```

**Debug Steps**:

1. Open DevTools → Application → IndexedDB
2. Check if `tanstack-query` database exists
3. Verify data is being stored

### 2. Sync Conflicts

**Symptoms**:

- Duplicate records after sync
- Data overwritten unexpectedly

**Check**:

- Timestamp-based conflict resolution
- Server vs client data priority
- Unique constraint handling

**Debug**:

```typescript
// Check mutation handlers for conflict resolution
const mutation = useMutation({
  mutationFn: createBatch,
  onSuccess: (data, variables) => {
    // Verify optimistic update handling
  },
  onError: (error, variables, context) => {
    // Check rollback logic
  },
})
```

### 3. Service Worker Issues

**Symptoms**:

- App not loading offline
- Stale content served

**Check**:

```bash
# Verify service worker registration
# Check vite.config.ts for PWA plugin config
```

**Debug Steps**:

1. DevTools → Application → Service Workers
2. Check registration status
3. Verify cache storage contents
4. Test "Offline" mode in DevTools

### 4. Network Detection

**Symptoms**:

- App doesn't detect offline state
- Sync attempts when offline

**Check**:

```typescript
// Verify online/offline detection
const isOnline = navigator.onLine

window.addEventListener('online', () => {
  // Trigger sync
})

window.addEventListener('offline', () => {
  // Switch to offline mode
})
```

## Debugging Tools

### Browser DevTools

1. **Network tab**: Throttle to offline
2. **Application tab**:
   - Service Workers status
   - IndexedDB contents
   - Cache Storage
3. **Console**: Check for sync errors

### Code Inspection

```bash
# Search for offline-related code
grep -r "navigator.onLine" app/
grep -r "IndexedDB" app/
grep -r "persistQueryClient" app/
```

## Testing Offline Mode

### Manual Testing

1. Load app with network
2. Create/edit some data
3. Go offline (DevTools or airplane mode)
4. Verify data is accessible
5. Make changes offline
6. Go online
7. Verify sync completes

### Automated Testing

```typescript
// Playwright offline test
test('works offline', async ({ page, context }) => {
  await page.goto('/batches')
  await context.setOffline(true)
  // Verify app still works
  await expect(page.locator('text=Batches')).toBeVisible()
})
```

## Common Fixes

### Fix 1: Enable Query Persistence

```typescript
// app/lib/query-client.ts
const persister = createSyncStoragePersister({
  storage: window.localStorage,
})

persistQueryClient({
  queryClient,
  persister,
  maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
})
```

### Fix 2: Handle Offline Mutations

```typescript
const mutation = useMutation({
  mutationFn: createBatch,
  // Queue mutations when offline
  networkMode: 'offlineFirst',
  retry: 3,
  retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
})
```

### Fix 3: Service Worker Caching

```typescript
// vite.config.ts
VitePWA({
  workbox: {
    globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/api\./,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'api-cache',
          networkTimeoutSeconds: 10,
        },
      },
    ],
  },
})
```

## Checklist

| Check                  | How to Verify                      | Status |
| ---------------------- | ---------------------------------- | ------ |
| IndexedDB storing data | DevTools → Application → IndexedDB | ✅/❌  |
| Service worker active  | DevTools → Application → SW        | ✅/❌  |
| Offline detection      | `navigator.onLine` in console      | ✅/❌  |
| Mutations queued       | Check mutation queue in state      | ✅/❌  |
| Sync on reconnect      | Go online, check network tab       | ✅/❌  |
| Conflict resolution    | Edit same record offline/online    | ✅/❌  |
| Cache invalidation     | Check stale data after sync        | ✅/❌  |

## Agent Delegation

- `@frontend-engineer` - React Query and state management issues
- `@qa-engineer` - Offline testing scenarios

## Related Prompts

- `@pwa-optimize` - PWA performance optimization
- `@test-coverage` - Add offline tests
