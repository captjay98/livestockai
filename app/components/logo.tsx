interface LogoProps {
  className?: string
  variant?: 'wordmark' | 'icon' | 'full'
}

export function Logo({ className = 'h-8', variant = 'wordmark' }: LogoProps) {
  if (variant === 'icon') {
    return (
      <div className={`relative ${className}`}>
        <img
          src="/logo-icon.svg"
          alt="LivestockAI"
          className="h-full w-auto object-contain dark:hidden"
        />
        <img
          src="/logo-icon-dark.svg"
          alt="LivestockAI"
          className="hidden h-full w-auto object-contain dark:block"
        />
      </div>
    )
  }

  if (variant === 'full') {
    return (
      <div className={`relative ${className}`}>
        <img
          src="/logo-full.svg"
          alt="LivestockAI"
          className="h-full w-auto object-contain dark:hidden"
        />
        <img
          src="/logo-full-dark.svg"
          alt="LivestockAI"
          className="hidden h-full w-auto object-contain dark:block"
        />
      </div>
    )
  }

  // Wordmark only
  return (
    <div className={`relative ${className}`}>
      <img
        src="/logo-wordmark.svg"
        alt="LivestockAI"
        className="h-full w-auto object-contain dark:hidden"
      />
      <img
        src="/logo-wordmark-dark.svg"
        alt="LivestockAI"
        className="hidden h-full w-auto object-contain dark:block"
      />
    </div>
  )
}
