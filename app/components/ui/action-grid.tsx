import { Link } from '@tanstack/react-router'
import type { LucideIcon } from 'lucide-react'
import { cn } from '~/lib/utils'

export interface ActionGridAction {
  icon: LucideIcon
  label: string
  onClick?: () => void
  href?: string
  disabled?: boolean
  variant?: 'default' | 'success' | 'warning' | 'destructive'
}

interface ActionGridProps {
  actions: Array<ActionGridAction>
  columns?: 2 | 3 | 4 | 6
  className?: string
}

const variantStyles = {
  default: 'text-foreground',
  success: 'text-success',
  warning: 'text-warning',
  destructive: 'text-destructive',
}

export function ActionGrid({
  actions,
  columns = 3,
  className,
}: ActionGridProps) {
  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-3 sm:grid-cols-4 md:grid-cols-6',
    4: 'grid-cols-2 sm:grid-cols-4',
    6: 'grid-cols-3 sm:grid-cols-6',
  }

  return (
    <div className={cn('grid gap-2', gridCols[columns], className)}>
      {actions.map((action, index) => {
        const Icon = action.icon
        const variant = action.variant || 'default'

        const content = (
          <>
            <Icon className={cn('h-6 w-6', variantStyles[variant])} />
            <span className="text-xs font-medium">{action.label}</span>
          </>
        )

        const baseStyles = cn(
          'flex flex-col items-center justify-center gap-1.5 p-3 min-h-[64px] min-w-[64px]',
          'rounded-lg bg-muted hover:bg-muted/80 transition-colors text-center',
          'disabled:opacity-50 disabled:cursor-not-allowed',
        )

        if (action.href) {
          return (
            <Link key={index} to={action.href as any} className={baseStyles}>
              {content}
            </Link>
          )
        }

        return (
          <button
            key={index}
            onClick={action.onClick}
            disabled={action.disabled}
            className={baseStyles}
          >
            {content}
          </button>
        )
      })}
    </div>
  )
}
