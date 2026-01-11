import { useRegisterSW } from 'virtual:pwa-register/react'
import { useEffect } from 'react'
import { Button } from './ui/button'

export function PWAPrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered: ' + r)
    },
    onRegisterError(error) {
      console.log('SW Registration error', error)
    },
  })

  // Close prompt automatically?
  // No, let user decide when to reload to avoid interrupting their work

  if (!needRefresh) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 p-4 bg-background border rounded-lg shadow-lg flex items-center gap-4 animate-in slide-in-from-bottom-2">
      <div className="text-sm font-medium">
        New content available, click on reload button to update.
      </div>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setNeedRefresh(false)}
        >
          Close
        </Button>
        <Button size="sm" onClick={() => updateServiceWorker(true)}>
          Reload
        </Button>
      </div>
    </div>
  )
}
