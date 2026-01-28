import { useCallback, useState } from 'react'
import { AlertTriangle, HardDrive, RefreshCw } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import { Button } from '~/components/ui/button'
import { Progress } from '~/components/ui/progress'
import { formatBytes, useStorageMonitor } from '~/lib/storage-monitor'
import { useDeduplicatedSync } from '~/lib/use-deduplicated-sync'

interface StorageFullModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Modal shown when storage is at 95% capacity.
 * Blocks new mutations until user syncs data.
 *
 * **Validates: Requirements 13.4**
 */
export function StorageFullModal({
  open,
  onOpenChange,
}: StorageFullModalProps) {
  const { quota, usageFormatted, quotaFormatted, refresh } = useStorageMonitor()
  const { syncWithDeduplication, isDeduplicating, pendingCount } =
    useDeduplicatedSync()

  const handleSync = async () => {
    await syncWithDeduplication()
    await refresh()

    // Close modal if storage is now below threshold
    if (quota && quota.percentage < 95) {
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Storage Full
          </DialogTitle>
          <DialogDescription>
            Your device storage is almost full. Please sync your data to free up
            space before making more changes.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Storage usage bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <HardDrive className="h-4 w-4" />
                Storage Usage
              </span>
              <span className="font-medium">
                {usageFormatted} / {quotaFormatted}
              </span>
            </div>
            <Progress value={quota?.percentage ?? 0} className="h-2" />
            <p className="text-xs text-muted-foreground text-right">
              {quota?.percentage.toFixed(1)}% used
            </p>
          </div>

          {/* Pending changes info */}
          {pendingCount > 0 && (
            <div className="rounded-lg bg-muted p-3">
              <p className="text-sm">
                <span className="font-medium">{pendingCount}</span> pending
                change{pendingCount !== 1 ? 's' : ''} waiting to sync
              </p>
            </div>
          )}

          {/* Explanation */}
          <p className="text-sm text-muted-foreground">
            Syncing will upload your pending changes to the server and free up
            local storage space.
          </p>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeduplicating}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSync}
            disabled={isDeduplicating}
            className="gap-2"
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Hook to check storage before mutations and show modal if needed.
 *
 * @returns Object with checkStorage function and modal state
 */
export function useStorageCheck() {
  const { canQueue, status, quota } = useStorageMonitor()
  const [showModal, setShowModal] = useState(false)

  const checkStorage = useCallback((): boolean => {
    if (!canQueue) {
      setShowModal(true)
      return false
    }
    return true
  }, [canQueue])

  return {
    checkStorage,
    showModal,
    setShowModal,
    canQueue,
    status,
    quota,
  }
}
