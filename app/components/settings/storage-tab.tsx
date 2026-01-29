import { HardDrive, RefreshCw, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '~/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'
import { Progress } from '~/components/ui/progress'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '~/components/ui/alert-dialog'
import { STORAGE_THRESHOLDS, useStorageMonitor } from '~/lib/storage-monitor'
import { useDeduplicatedSync } from '~/lib/use-deduplicated-sync'
import { useSyncStatus } from '~/components/sync-status'

/**
 * Storage management tab for settings page.
 *
 * Displays:
 * - Current storage usage / quota
 * - Storage status (ok, warning, critical, blocked)
 * - Pending changes count
 * - Sync Now button
 * - Clear Cache option
 *
 * **Validates: Requirements 13.5**
 */
export function StorageTab() {
  const [isClearing, setIsClearing] = useState(false)

  const {
    quota,
    status,
    isAvailable,
    usageFormatted,
    quotaFormatted,
    availableFormatted,
    refresh,
  } = useStorageMonitor()

  const { syncWithDeduplication, isDeduplicating, pendingCount, lastResult } =
    useDeduplicatedSync()
  const { pausedCount, failedCount } = useSyncStatus()

  const handleSync = async () => {
    try {
      await syncWithDeduplication()
      await refresh()
      toast.success('Sync completed successfully')
    } catch (error) {
      toast.error('Sync failed. Please try again.')
    }
  }

  const handleClearCache = async () => {
    setIsClearing(true)
    try {
      // Clear non-essential caches
      if ('caches' in window) {
        const cacheNames = await caches.keys()
        // Only clear runtime caches, not precache
        const runtimeCaches = cacheNames.filter(
          (name) => !name.includes('precache') && !name.includes('workbox'),
        )
        await Promise.all(runtimeCaches.map((name) => caches.delete(name)))
      }

      await refresh()
      toast.success('Cache cleared successfully')
    } catch (error) {
      toast.error('Failed to clear cache')
    } finally {
      setIsClearing(false)
    }
  }

  // Status colors
  const statusColors = {
    ok: 'text-success',
    warning: 'text-warning',
    critical: 'text-destructive',
    blocked: 'text-destructive',
  }

  const statusLabels = {
    ok: 'Good',
    warning: 'Warning',
    critical: 'Critical',
    blocked: 'Full',
  }

  return (
    <div className="space-y-6">
      {/* Storage Usage Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            Storage Usage
          </CardTitle>
          <CardDescription>
            Monitor your device's storage usage for offline data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isAvailable && quota ? (
            <>
              {/* Progress bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Used: {usageFormatted}</span>
                  <span>Total: {quotaFormatted}</span>
                </div>
                <Progress value={quota.percentage} className="h-3" />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span className={statusColors[status]}>
                    Status: {statusLabels[status]}
                  </span>
                  <span>{quota.percentage.toFixed(1)}% used</span>
                </div>
              </div>

              {/* Thresholds info */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                <div className="text-center">
                  <div className="text-2xl font-bold">{availableFormatted}</div>
                  <div className="text-xs text-muted-foreground">Available</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {STORAGE_THRESHOLDS.warning}%
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Warning at
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {STORAGE_THRESHOLDS.blocked}%
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Blocked at
                  </div>
                </div>
              </div>

              {/* Status messages */}
              {status === 'warning' && (
                <div className="bg-warning/10 text-warning px-4 py-3 rounded-md text-sm">
                  Storage is getting full. Consider syncing your data soon.
                </div>
              )}
              {status === 'critical' && (
                <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md text-sm">
                  Storage is almost full! Please sync your data to free up
                  space.
                </div>
              )}
              {status === 'blocked' && (
                <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md text-sm">
                  Storage is full. You must sync your data before making more
                  changes.
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Storage API not available on this device
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sync Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Sync Status
          </CardTitle>
          <CardDescription>
            Manage pending changes and sync with the server
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Pending changes */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold">{pendingCount}</div>
              <div className="text-xs text-muted-foreground">Pending</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold">{pausedCount}</div>
              <div className="text-xs text-muted-foreground">Queued</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-destructive">
                {failedCount}
              </div>
              <div className="text-xs text-muted-foreground">Failed</div>
            </div>
          </div>

          {/* Last deduplication result */}
          {lastResult && lastResult.actions.length > 0 && (
            <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
              <strong>Last optimization:</strong>{' '}
              {lastResult.actions.join(', ')}
            </div>
          )}

          {/* Sync button */}
          <Button
            onClick={handleSync}
            disabled={
              isDeduplicating || (pendingCount === 0 && pausedCount === 0)
            }
            className="w-full gap-2"
          >
            {isDeduplicating ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                Sync Now
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Clear Cache Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5" />
            Clear Cache
          </CardTitle>
          <CardDescription>
            Remove cached data to free up storage space
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger>
              <Button
                variant="outline"
                className="w-full gap-2"
                disabled={isClearing}
              >
                {isClearing ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Clearing...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    Clear Cache
                  </>
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Clear Cache?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will remove cached data to free up storage space. Your
                  pending changes will NOT be affected. You may need to reload
                  some data when you next access it.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleClearCache}>
                  Clear Cache
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  )
}
