# Offline Support Guide

LivestockAI is designed as an **offline-first** application, enabling farmers to continue working even in areas with unreliable internet connectivity. This document outlines which features work offline and which require an internet connection.

## Feature Availability Matrix

### ✅ Full Offline Support (Works Without Internet)

| Feature               | Create | Read | Update | Delete | Notes                              |
| --------------------- | ------ | ---- | ------ | ------ | ---------------------------------- |
| **Batch Management**  | ✅     | ✅   | ✅     | ✅     | All batch operations queue offline |
| **Feed Records**      | ✅     | ✅   | ✅     | ✅     | Daily feed logging works offline   |
| **Mortality Records** | ✅     | ✅   | ✅     | ✅     | Death tracking works offline       |
| **Weight Samples**    | ✅     | ✅   | ✅     | ✅     | Growth tracking works offline      |
| **Water Quality**     | ✅     | ✅   | ✅     | ✅     | For aquaculture batches            |
| **Egg Production**    | ✅     | ✅   | ✅     | ✅     | For layer operations               |
| **Vaccinations**      | ✅     | ✅   | ✅     | ✅     | Health records work offline        |
| **Sales**             | ✅     | ✅   | ✅     | ✅     | Revenue tracking works offline     |
| **Expenses**          | ✅     | ✅   | ✅     | ✅     | Cost tracking works offline        |
| **Invoices**          | ✅     | ✅   | ✅     | ✅     | Invoice management works offline   |
| **Customers**         | ✅     | ✅   | ✅     | ✅     | Customer records work offline      |
| **Suppliers**         | ✅     | ✅   | ✅     | ✅     | Supplier records work offline      |
| **Farm Structures**   | ✅     | ✅   | ✅     | ✅     | Pens, ponds, coops, etc.           |
| **Tasks**             | ✅     | ✅   | ✅     | ✅     | Task management works offline      |
| **Dashboard**         | —      | ✅   | —      | —      | Cached data displayed              |
| **Settings**          | —      | ✅   | ✅     | —      | Preferences cached locally         |

### ⚠️ Partial Offline Support (Read-Only When Offline)

| Feature                 | Online | Offline     | Notes                               |
| ----------------------- | ------ | ----------- | ----------------------------------- |
| **Reports**             | Full   | Cached only | Complex aggregations require server |
| **Growth Charts**       | Full   | Cached only | Historical data cached              |
| **Financial Summaries** | Full   | Cached only | Calculations cached                 |
| **Inventory Levels**    | Full   | Cached only | Last known state shown              |

### ❌ Online Required (Blocked When Offline)

| Feature                 | Reason                                    | Offline Behavior                |
| ----------------------- | ----------------------------------------- | ------------------------------- |
| **Login / Register**    | Authentication requires server validation | Shows "Online Required" message |
| **Credit Passport**     | PDF generation runs on server             | Shows "Online Required" message |
| **IoT Sensors**         | Real-time data from external devices      | Shows "Online Required" message |
| **Shared Formulations** | Public links require server lookup        | Shows "Online Required" message |
| **User Management**     | Adding/removing users needs auth server   | Feature disabled                |
| **Farm Invitations**    | Email/notification service required       | Feature disabled                |
| **Breed Requests**      | Admin approval workflow                   | Feature disabled                |
| **AI Recommendations**  | Gemini API requires internet              | Feature disabled                |
| **Initial App Load**    | First visit downloads app bundle          | Cannot access app               |

## How Offline Mode Works

### Optimistic Updates

When you make changes offline, they appear immediately in the UI. The app uses **optimistic updates** to show your changes instantly while queuing them for sync.

### Mutation Queue

All offline changes are stored in a **mutation queue** that persists across browser sessions. When connectivity returns, changes sync automatically in the order they were made.

### Sync Status Indicator

The sync status indicator in the header shows:

- 🟢 **Synced** - All changes saved to server
- 🔄 **Syncing** - Currently uploading changes
- ⏸️ **Pending (N)** - N changes waiting for network
- 🔴 **Offline (N)** - No connection, N changes queued
- ⚠️ **Failed (N)** - N changes failed, tap to retry

### Conflict Resolution

If the same record is edited on multiple devices:

1. **Last-write-wins** - Most recent change takes precedence
2. **Automatic merge** - Non-conflicting fields are merged
3. **User notification** - You're informed when server version differs

### Storage Management

The app monitors device storage:

- **70%** - Warning shown in settings
- **85%** - Critical alert, sync recommended
- **95%** - New changes blocked until sync

## Best Practices for Offline Use

1. **Sync before going offline** - Ensure latest data is cached
2. **Check pending count** - Verify changes synced before logging out
3. **Monitor storage** - Clear cache if storage gets full
4. **Avoid bulk operations offline** - Large imports may exceed storage
5. **Test connectivity** - Sync status shows real-time connection state

## Technical Implementation

### Key Files

- `app/lib/optimistic-utils.ts` - Optimistic update helpers
- `app/lib/temp-id-resolver.ts` - Temporary ID management
- `app/lib/mutation-deduplicator.ts` - Queue optimization
- `app/lib/storage-monitor.ts` - Storage quota tracking
- `app/lib/conflict-resolution.ts` - Conflict handling
- `app/components/sync-status.tsx` - Sync indicator
- `app/components/online-required.tsx` - Online guard

### Query Configuration

```typescript
// Mutations use offline-first mode
defaultOptions: {
  mutations: {
    networkMode: 'offlineFirst',
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  },
}
```

### PWA Caching

Static assets and API responses are cached via Workbox service worker for offline access.

## Troubleshooting

| Issue                | Solution                                       |
| -------------------- | ---------------------------------------------- |
| Changes not syncing  | Check sync status, tap retry if failed         |
| "Storage Full" error | Go to Settings > Storage > Sync Now            |
| Stale data showing   | Pull to refresh when online                    |
| Duplicate records    | Deduplication runs automatically on sync       |
| Missing offline data | Ensure you visited the page while online first |
