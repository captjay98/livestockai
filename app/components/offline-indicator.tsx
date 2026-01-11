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
    <div className="fixed bottom-4 left-4 z-50 bg-slate-900/90 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm font-medium animate-in slide-in-from-bottom-2 backdrop-blur-sm border border-slate-700">
      <WifiOff className="h-4 w-4 text-red-400" />
      <span>You are offline. Changes will save when reconnected.</span>
    </div>
  )
}
