import { useSyncExternalStore } from 'react'
import { WifiOff } from 'lucide-react'

// Simple hook to track online status
function useOnlineStatus() {
  const isOnline = useSyncExternalStore(
    (callback) => {
      window.addEventListener('online', callback)
      window.addEventListener('offline', callback)
      return () => {
        window.removeEventListener('online', callback)
        window.removeEventListener('offline', callback)
      }
    },
    () => navigator.onLine,
    () => true, // Default to online on server
  )
  return isOnline
}

export function OfflineIndicator() {
  const isOnline = useOnlineStatus()

  if (isOnline) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-foreground/90 text-background px-4 py-2 shadow-lg flex items-center justify-center gap-2 text-sm font-medium animate-in slide-in-from-top-2 backdrop-blur-sm border-b border-border">
      <WifiOff className="h-4 w-4 text-destructive-foreground" />
      <span>You are offline. Changes will save when reconnected.</span>
    </div>
  )
}
