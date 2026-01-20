---
name: Offline Debug
description: Debug offline functionality issues
---

# Offline Debug

Troubleshoot offline functionality in OpenLivestock.

## Common Issues

### Service Worker Not Registering

1. Check HTTPS (required except localhost)
2. Verify sw.js exists in public/
3. Check browser console for errors

### Data Not Persisting Offline

1. Check IndexedDB in DevTools
2. Verify data is being saved locally
3. Check offline storage hooks

### Sync Not Working

1. Verify online status detection
2. Check sync queue in IndexedDB
3. Review sync logic in `app/lib/offline/`

## Debugging Steps

1. **Open DevTools > Application**
   - Service Workers tab
   - IndexedDB tab

2. **Simulate Offline**
   - Network tab > Offline checkbox
   - Test read operations

3. **Check Data**
   - IndexedDB > View stored data
   - Verify sync queue

## Key Code Locations

- `app/lib/offline/db.ts` - IndexedDB setup
- `app/lib/offline/sync.ts` - Sync logic
- `app/hooks/useOffline.ts` - Offline status
