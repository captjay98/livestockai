import { useSyncExternalStore } from 'react'
import { CloudOff, CreditCard, Lock, Radio, Share2, Wifi } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '~/components/ui/button'
import { cn } from '~/lib/utils'

/**
 * Features that require online connectivity
 */
export type OnlineRequiredFeature =
    | 'auth'
    | 'shared-formulation'
    | 'credit-passport'
    | 'iot-sensors'
    | 'reports-export'
    | 'data-sync'

/**
 * Feature-specific configuration for offline messages
 */
const FEATURE_CONFIG: Record<
    OnlineRequiredFeature,
    {
        icon: typeof CloudOff
        title: string
        description: string
        suggestion: string
    }
> = {
    auth: {
        icon: Lock,
        title: 'Login Requires Internet',
        description:
            'Authentication needs a secure connection to verify your credentials.',
        suggestion:
            'Please connect to the internet to sign in or create an account.',
    },
    'shared-formulation': {
        icon: Share2,
        title: 'Shared Formulations Unavailable Offline',
        description:
            'Viewing shared feed formulations requires an internet connection to fetch the latest data.',
        suggestion:
            'Connect to the internet to access shared formulations from other farmers.',
    },
    'credit-passport': {
        icon: CreditCard,
        title: 'Credit Passport Generation Unavailable',
        description:
            'Generating your Credit Passport requires real-time data verification.',
        suggestion:
            'Connect to the internet to generate and download your Credit Passport PDF.',
    },
    'iot-sensors': {
        icon: Radio,
        title: 'Sensor Data Unavailable Offline',
        description:
            'Live sensor readings require an active internet connection.',
        suggestion:
            'Connect to the internet to view real-time sensor data from your farm.',
    },
    'reports-export': {
        icon: CloudOff,
        title: 'Report Export Unavailable',
        description: 'Exporting reports requires server-side processing.',
        suggestion: 'Connect to the internet to export your farm reports.',
    },
    'data-sync': {
        icon: Wifi,
        title: 'Sync Required',
        description: 'This action requires synchronizing with the server.',
        suggestion: 'Connect to the internet to sync your data.',
    },
}

/**
 * Hook to check online status
 */
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
        () => true, // SSR fallback - assume online
    )
}

interface OnlineRequiredProps {
    /** The feature that requires online connectivity */
    feature: OnlineRequiredFeature
    /** Content to render when online */
    children: ReactNode
    /** Optional custom offline message */
    customMessage?: string
    /** Optional callback when user clicks retry */
    onRetry?: () => void
    /** Whether to show a compact version */
    compact?: boolean
    /** Additional CSS classes */
    className?: string
}

/**
 * OnlineRequired wrapper component.
 *
 * Wraps content that requires internet connectivity and shows
 * a feature-specific offline message when the user is offline.
 *
 * **Validates: Requirements 10.1, 10.2, 10.3, 10.4, 10.5**
 *
 * @example
 * ```tsx
 * <OnlineRequired feature="auth">
 *   <LoginForm />
 * </OnlineRequired>
 * ```
 */
export function OnlineRequired({
    feature,
    children,
    customMessage,
    onRetry,
    compact = false,
    className,
}: OnlineRequiredProps) {
    const isOnline = useOnlineStatus()

    if (isOnline) {
        return <>{children}</>
    }

    return (
        <OfflineFeatureMessage
            feature={feature}
            customMessage={customMessage}
            onRetry={onRetry}
            compact={compact}
            className={className}
        />
    )
}

interface OfflineFeatureMessageProps {
    /** The feature that requires online connectivity */
    feature: OnlineRequiredFeature
    /** Optional custom offline message */
    customMessage?: string
    /** Optional callback when user clicks retry */
    onRetry?: () => void
    /** Whether to show a compact version */
    compact?: boolean
    /** Additional CSS classes */
    className?: string
}

/**
 * Standalone offline message component for specific features.
 *
 * Can be used independently when you need to show an offline
 * message without the wrapper behavior.
 */
export function OfflineFeatureMessage({
    feature,
    customMessage,
    onRetry,
    compact = false,
    className,
}: OfflineFeatureMessageProps) {
    const config = FEATURE_CONFIG[feature]
    const Icon = config.icon

    if (compact) {
        return (
            <div
                className={cn(
                    'flex items-center gap-2 p-3 bg-muted/50 rounded-lg border border-dashed',
                    className,
                )}
            >
                <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-sm text-muted-foreground">
                    {customMessage || config.title}
                </span>
                {onRetry && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="ml-auto h-7 px-2"
                        onClick={onRetry}
                    >
                        Retry
                    </Button>
                )}
            </div>
        )
    }

    return (
        <div
            className={cn(
                'flex flex-col items-center justify-center p-8 text-center',
                className,
            )}
        >
            <div className="p-4 bg-muted rounded-full mb-4">
                <Icon className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">{config.title}</h3>
            <p className="text-muted-foreground max-w-md mb-2">
                {customMessage || config.description}
            </p>
            <p className="text-sm text-muted-foreground max-w-md mb-4">
                {config.suggestion}
            </p>
            {onRetry && (
                <Button variant="outline" onClick={onRetry}>
                    <Wifi className="h-4 w-4 mr-2" />
                    Check Connection
                </Button>
            )}
        </div>
    )
}

/**
 * Hook to check if a feature is available (online).
 *
 * @param feature - The feature to check
 * @returns Whether the feature is available
 *
 * @example
 * ```tsx
 * const canGeneratePassport = useFeatureAvailable('credit-passport')
 * ```
 */
export function useFeatureAvailable(): boolean {
    const isOnline = useOnlineStatus()
    // All features in FEATURE_CONFIG require online connectivity
    return isOnline
}

/**
 * Higher-order component to wrap a component with online requirement.
 *
 * @param WrappedComponent - Component to wrap
 * @param feature - Feature that requires online connectivity
 * @returns Wrapped component that shows offline message when offline
 *
 * @example
 * ```tsx
 * const OnlineLoginForm = withOnlineRequired(LoginForm, 'auth')
 * ```
 */
export function withOnlineRequired<TProps extends object>(
    WrappedComponent: React.ComponentType<TProps>,
    feature: OnlineRequiredFeature,
) {
    return function OnlineRequiredWrapper(props: TProps) {
        return (
            <OnlineRequired feature={feature}>
                <WrappedComponent {...props} />
            </OnlineRequired>
        )
    }
}
