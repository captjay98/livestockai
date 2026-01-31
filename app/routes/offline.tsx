import { createFileRoute } from '@tanstack/react-router'
import { useEffect } from 'react'
import { WifiOff } from 'lucide-react'
import { Button } from '~/components/ui/button'

export const Route = createFileRoute('/offline')({
  component: OfflinePage,
})

function OfflinePage() {
  // Auto-redirect when back online
  useEffect(() => {
    const handleOnline = () => {
      // Small delay to ensure connection is stable
      setTimeout(() => {
        if (navigator.onLine) {
          window.location.href = '/dashboard'
        }
      }, 500)
    }

    window.addEventListener('online', handleOnline)
    return () => window.removeEventListener('online', handleOnline)
  }, [])

  const handleRetry = () => {
    if (navigator.onLine) {
      window.location.href = '/dashboard'
    } else {
      alert('Still offline. Please check your internet connection.')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="flex justify-center">
          <div className="rounded-full bg-muted p-6">
            <WifiOff className="h-12 w-12 text-muted-foreground" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold">You're Offline</h1>
          <p className="text-muted-foreground">
            Please check your internet connection and try again.
          </p>
        </div>

        <div className="space-y-3">
          <Button onClick={handleRetry} className="w-full">
            Retry Connection
          </Button>
          <p className="text-sm text-muted-foreground">
            Once you're back online, you'll be redirected automatically.
          </p>
        </div>
      </div>
    </div>
  )
}
