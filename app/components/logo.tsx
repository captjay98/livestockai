import { useTheme } from './theme-provider'

interface LogoProps {
    className?: string
    variant?: 'wordmark' | 'icon'
}

export function Logo({ className = 'h-8', variant = 'wordmark' }: LogoProps) {
    const { theme } = useTheme()

    // Determine effective theme (handle 'system' preference)
    const isDark = theme === 'dark' ||
        (theme === 'system' && typeof window !== 'undefined' &&
            window.matchMedia('(prefers-color-scheme: dark)').matches)

    const src = variant === 'icon'
        ? '/logo-icon.svg'
        : isDark
            ? '/logo-wordmark-dark.svg'
            : '/logo-wordmark.svg'

    return (
        <img
            src={src}
            alt="OpenLivestock"
            className={className}
        />
    )
}
