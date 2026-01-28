import { useCallback, useEffect, useState } from 'react'
import { Download, RefreshCw, Wifi, WifiOff, X } from 'lucide-react'
import { Button } from './ui/button'
import { cn } from '~/lib/utils'

/**
 * PWA registration state
 */
interface PWAState {
    registration: ServiceWorkerRegistration | null
    needRefresh: boolean
    offlineReady: boolean
    error: Error | null
    isUpdating: boolean
}

/**
 * Hook to manage PWA service worker registration.
 * **Validates: Requirements 9.1, 9.2, 9.3**
 */
export function useRegisterSW() {
    const [state, setState] = useState<PWAState>({
        registration: null,
        needRefresh: false,
        offlineReady: false,
        error: null,
        isUpdating: false,
    })

    const updateServiceWorker = useCallback(
        async (reloadPage = true) => {
            if (!state.registration?.waiting) return
            setState((prev) => ({ ...prev, isUpdating: true }))
            try {
                state.registration.waiting.postMessage({ type: 'SKIP_WAITING' })
                if (reloadPage) {
                    await new Promise((resolve) => setTimeout(resolve, 100))
                    window.location.reload()
                }
            } catch (error) {
                setState((prev) => ({
                    ...prev,
                    isUpdating: false,
                    error:
                        error instanceof Error
                            ? error
                            : new Error('Update failed'),
                }))
            }
        },
        [state.registration],
    )

    const dismissRefresh = useCallback(() => {
        setState((prev) => ({ ...prev, needRefresh: false }))
    }, [])

    const dismissOfflineReady = useCallback(() => {
        setState((prev) => ({ ...prev, offlineReady: false }))
    }, [])

    useEffect(() => {
        if (typeof window === 'undefined' || !('serviceWorker' in navigator))
            return

        const registerSW = async () => {
            try {
                // Try vite-plugin-pwa virtual module first
                const pwaModule = await import('virtual:pwa-register').catch(
                    () => null,
                )
                if (pwaModule?.registerSW) {
                    pwaModule.registerSW({
                        immediate: true,
                        onRegistered(r: ServiceWorkerRegistration | undefined) {
                            setState((prev) => ({
                                ...prev,
                                registration: r || null,
                            }))
                            if (r)
                                setInterval(
                                    () => r.update().catch(() => {}),
                                    3600000,
                                )
                        },
                        onRegisterError(e: Error) {
                            setState((prev) => ({ ...prev, error: e }))
                        },
                        onNeedRefresh() {
                            setState((prev) => ({ ...prev, needRefresh: true }))
                        },
                        onOfflineReady() {
                            setState((prev) => ({
                                ...prev,
                                offlineReady: true,
                            }))
                        },
                    })
                    return
                }
            } catch {
                /* fallback below */
            }

            // Manual registration fallback
            try {
                const registration = await navigator.serviceWorker.register(
                    '/sw.js',
                    {
                        scope: '/',
                    },
                )
                setState((prev) => ({ ...prev, registration }))
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing
                    if (newWorker) {
                        newWorker.addEventListener('statechange', () => {
                            if (
                                newWorker.state === 'installed' &&
                                navigator.serviceWorker.controller
                            ) {
                                setState((prev) => ({
                                    ...prev,
                                    needRefresh: true,
                                }))
                            } else if (newWorker.state === 'activated') {
                                setState((prev) => ({
                                    ...prev,
                                    offlineReady: true,
                                }))
                            }
                        })
                    }
                })
                setInterval(
                    () => registration.update().catch(() => {}),
                    3600000,
                )
            } catch (e) {
                setState((prev) => ({
                    ...prev,
                    error:
                        e instanceof Error
                            ? e
                            : new Error('Registration failed'),
                }))
            }
        }

        registerSW()
        const handleControllerChange = () => window.location.reload()
        navigator.serviceWorker.addEventListener(
            'controllerchange',
            handleControllerChange,
        )
        return () =>
            navigator.serviceWorker.removeEventListener(
                'controllerchange',
                handleControllerChange,
            )
    }, [])

    return {
        ...state,
        updateServiceWorker,
        dismissRefresh,
        dismissOfflineReady,
    }
}

/**
 * PWA prompt component. **Validates: Requirements 9.1, 9.2, 9.3**
 */
export function PWAPrompt() {
    const {
        needRefresh,
        offlineReady,
        error,
        isUpdating,
        updateServiceWorker,
        dismissRefresh,
        dismissOfflineReady,
    } = useRegisterSW()

    useEffect(() => {
        if (offlineReady) {
            const timer = setTimeout(dismissOfflineReady, 5000)
            return () => clearTimeout(timer)
        }
    }, [offlineReady, dismissOfflineReady])

    if (needRefresh) {
        return (
            <div className="fixed bottom-4 right-4 z-50 p-4 bg-background border rounded-lg shadow-lg max-w-sm animate-in slide-in-from-bottom-2">
                <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary/10 rounded-full">
                        <Download className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                        <h4 className="font-medium text-sm">
                            Update Available
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1">
                            A new version is available. Reload to update.
                        </p>
                        <div className="flex gap-2 mt-3">
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={dismissRefresh}
                                disabled={isUpdating}
                            >
                                Later
                            </Button>
                            <Button
                                size="sm"
                                onClick={() => updateServiceWorker(true)}
                                disabled={isUpdating}
                            >
                                {isUpdating ? (
                                    <>
                                        <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                                        Updating...
                                    </>
                                ) : (
                                    'Reload'
                                )}
                            </Button>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 -mt-1 -mr-1"
                        onClick={dismissRefresh}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        )
    }

    if (offlineReady) {
        return (
            <div className="fixed bottom-4 right-4 z-50 p-4 bg-background border rounded-lg shadow-lg max-w-sm animate-in slide-in-from-bottom-2">
                <div className="flex items-start gap-3">
                    <div className="p-2 bg-success/10 rounded-full">
                        <WifiOff className="h-5 w-5 text-success" />
                    </div>
                    <div className="flex-1">
                        <h4 className="font-medium text-sm">
                            Ready for Offline
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1">
                            App has been cached and can work offline.
                        </p>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 -mt-1 -mr-1"
                        onClick={dismissOfflineReady}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        )
    }

    if (error && process.env.NODE_ENV === 'development') {
        return (
            <div className="fixed bottom-4 right-4 z-50 p-4 bg-destructive/10 border border-destructive/20 rounded-lg shadow-lg max-w-sm animate-in slide-in-from-bottom-2">
                <div className="flex items-start gap-3">
                    <div className="p-2 bg-destructive/10 rounded-full">
                        <Wifi className="h-5 w-5 text-destructive" />
                    </div>
                    <div className="flex-1">
                        <h4 className="font-medium text-sm text-destructive">
                            PWA Error
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1">
                            {error.message}
                        </p>
                    </div>
                </div>
            </div>
        )
    }

    return null
}

export function PWAStatusIndicator({ className }: { className?: string }) {
    const { registration, offlineReady, needRefresh } = useRegisterSW()
    if (!registration) return null
    return (
        <div className={cn('flex items-center gap-1.5 text-xs', className)}>
            {needRefresh ? (
                <>
                    <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                    <span className="text-primary">Update available</span>
                </>
            ) : offlineReady ? (
                <>
                    <span className="h-2 w-2 rounded-full bg-success" />
                    <span className="text-success">Offline ready</span>
                </>
            ) : (
                <>
                    <span className="h-2 w-2 rounded-full bg-muted-foreground" />
                    <span className="text-muted-foreground">PWA active</span>
                </>
            )}
        </div>
    )
}
