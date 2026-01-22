import { useSyncExternalStore } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Check, CloudOff, Loader2, RefreshCw } from 'lucide-react'
import { cn } from '~/lib/utils'

export type SyncState = 'synced' | 'syncing' | 'pending' | 'offline'

function useOnlineStatus() {
  return useSyncExternalStore(
    (callback) => {
      window.addEventListener('online', callback)
      window.addEventListener('offline', callback)
      return () => {
        window.removeEventListener('online', callback)
        window.removeEventListener('offline', callback)
      }
    },
    () => navigator.onLine,
    () => true,
  )
}

interface SyncStatusProps {
  className?: string
  showLabel?: boolean
  size?: 'sm' | 'default'
}

export function SyncStatus({
  className,
  showLabel = true,
  size = 'default',
}: SyncStatusProps) {
  const isOnline = useOnlineStatus()
  const queryClient = useQueryClient()

  // Get pending mutations count
  const mutationCache = queryClient.getMutationCache()
  const pendingMutations = mutationCache
    .getAll()
    .filter((m) => m.state.status === 'pending')
  const pendingCount = pendingMutations.length

  // Determine state
  let state: SyncState
  if (!isOnline) {
    state = 'offline'
  } else if (pendingCount > 0) {
    state = 'syncing'
  } else {
    state = 'synced'
  }

  const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm'

  const config = {
    synced: {
      icon: Check,
      label: 'Synced',
      dotColor: 'bg-success',
      textColor: 'text-success',
    },
    syncing: {
      icon: Loader2,
      label: `Syncing${pendingCount > 0 ? ` (${pendingCount})` : '...'}`,
      dotColor: 'bg-primary animate-pulse',
      textColor: 'text-primary',
    },
    pending: {
      icon: RefreshCw,
      label: `Pending (${pendingCount})`,
      dotColor: 'bg-muted-foreground',
      textColor: 'text-muted-foreground',
    },
    offline: {
      icon: CloudOff,
      label: 'Offline',
      dotColor: 'bg-destructive',
      textColor: 'text-destructive',
    },
  }

  const { icon: Icon, label, dotColor, textColor } = config[state]

  return (
    <div
      className={cn(
        'flex items-center gap-1.5',
        textColor,
        textSize,
        className,
      )}
    >
      <span className={cn('h-2 w-2 rounded-full shrink-0', dotColor)} />
      {state === 'syncing' ? (
        <Icon className={cn(iconSize, 'animate-spin')} />
      ) : (
        showLabel && <span className="font-medium">{label}</span>
      )}
      {state === 'syncing' && showLabel && (
        <span className="font-medium">{label}</span>
      )}
    </div>
  )
}
