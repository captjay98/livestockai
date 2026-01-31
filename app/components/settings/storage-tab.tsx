import { HardDrive, RefreshCw, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation(['settings', 'common'])
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
      toast.success(t('storage.messages.syncSuccess'))
    } catch (error) {
      toast.error(t('storage.messages.syncFailed'))
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
      toast.success(t('storage.messages.cacheCleared'))
    } catch (error) {
      toast.error(t('storage.messages.cacheClearFailed'))
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
    ok: t('storage.statusLabels.ok'),
    warning: t('storage.statusLabels.warning'),
    critical: t('storage.statusLabels.critical'),
    blocked: t('storage.statusLabels.blocked'),
  }

  return (
    <div className="space-y-6">
      {/* Storage Usage Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            {t('storage.title')}
          </CardTitle>
          <CardDescription>{t('storage.desc')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isAvailable && quota ? (
            <>
              {/* Progress bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>
                    {t('storage.used')}: {usageFormatted}
                  </span>
                  <span>
                    {t('storage.total')}: {quotaFormatted}
                  </span>
                </div>
                <Progress value={quota.percentage} className="h-3" />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span className={statusColors[status]}>
                    {t('storage.status')}: {statusLabels[status]}
                  </span>
                  <span>
                    {t('storage.percentageUsed', {
                      percentage: quota.percentage.toFixed(1),
                    })}
                  </span>
                </div>
              </div>

              {/* Thresholds info */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                <div className="text-center">
                  <div className="text-2xl font-bold">{availableFormatted}</div>
                  <div className="text-xs text-muted-foreground">
                    {t('storage.available')}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {STORAGE_THRESHOLDS.warning}%
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {t('storage.warningAt')}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {STORAGE_THRESHOLDS.blocked}%
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {t('storage.blockedAt')}
                  </div>
                </div>
              </div>

              {/* Status messages */}
              {status === 'warning' && (
                <div className="bg-warning/10 text-warning px-4 py-3 rounded-md text-sm">
                  {t('storage.warningMsg')}
                </div>
              )}
              {status === 'critical' && (
                <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md text-sm">
                  {t('storage.criticalMsg')}
                </div>
              )}
              {status === 'blocked' && (
                <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md text-sm">
                  {t('storage.blockedMsg')}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {t('storage.notAvailable')}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sync Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            {t('storage.syncStatus')}
          </CardTitle>
          <CardDescription>{t('storage.syncDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Pending changes */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold">{pendingCount}</div>
              <div className="text-xs text-muted-foreground">
                {t('storage.pending')}
              </div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold">{pausedCount}</div>
              <div className="text-xs text-muted-foreground">
                {t('storage.queued')}
              </div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-destructive">
                {failedCount}
              </div>
              <div className="text-xs text-muted-foreground">
                {t('storage.failed')}
              </div>
            </div>
          </div>

          {/* Last deduplication result */}
          {lastResult && lastResult.actions.length > 0 && (
            <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
              <strong>{t('storage.lastOptimization')}:</strong>{' '}
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
                {t('storage.syncing')}
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                {t('storage.syncNow')}
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
            {t('storage.clearCache')}
          </CardTitle>
          <CardDescription>{t('storage.clearCacheDesc')}</CardDescription>
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
                    {t('storage.clearing')}
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    {t('storage.clearCache')}
                  </>
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {t('storage.clearCacheDialogTitle')}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {t('storage.clearCacheDialogDesc')}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('common:cancel')}</AlertDialogCancel>
                <AlertDialogAction onClick={handleClearCache}>
                  {t('storage.clearCache')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  )
}
