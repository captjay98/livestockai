import { TrendingDown, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from './card'
import type { LucideIcon } from 'lucide-react'
import { cn } from '~/lib/utils'

interface SummaryCardProps {
  title: string
  value: React.ReactNode
  icon?: LucideIcon | React.ElementType
  trend?: {
    value: number
    isPositive: boolean
  }
  loading?: boolean
  description?: React.ReactNode
  className?: string
  iconClassName?: string
  valueClassName?: string
}

export function SummaryCard({
  title,
  value,
  icon: Icon,
  trend,
  loading,
  description,
  className,
  iconClassName,
  valueClassName,
}: SummaryCardProps) {
  if (loading) {
    return (
      <Card className={cn('relative overflow-hidden', className)}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-3">
          <div className="h-3 w-20 bg-muted/50 animate-pulse rounded" />
          <div className="h-4 w-4 bg-muted/50 animate-pulse rounded-full" />
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <div className="h-8 w-24 bg-muted/50 animate-pulse rounded mt-1" />
          {description && (
            <div className="h-3 w-32 bg-muted/30 animate-pulse rounded mt-2" />
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card
      className={cn(
        'bg-white/30 dark:bg-black/30 backdrop-blur-md border-white/20 dark:border-white/10 shadow-sm rounded-2xl overflow-hidden group hover:bg-white/40 dark:hover:bg-black/40 transition-all relative',
        className,
      )}
    >
      {/* Background Orb */}
      <div className="absolute top-0 right-0 p-12 opacity-10 rounded-full blur-2xl transform translate-x-4 -translate-y-4 pointer-events-none bg-primary/40 group-hover:opacity-20 transition-opacity" />

      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0.5 p-3 relative z-10">
        <CardTitle className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider">
          {title}
        </CardTitle>
        {Icon && (
          <div
            className={cn(
              'h-6 w-6 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 text-primary',
              iconClassName,
            )}
          >
            <Icon className="h-3.5 w-3.5" />
          </div>
        )}
      </CardHeader>
      <CardContent className="p-3 pt-0 relative z-10">
        <div
          className={cn(
            'text-xl sm:text-2xl font-black tracking-tight text-foreground',
            valueClassName,
          )}
        >
          {value}
        </div>
        {(trend || description) && (
          <div className="flex items-center gap-2 text-[10px] sm:text-xs text-muted-foreground mt-0.5 font-medium flex-wrap">
            {trend && (
              <div
                className={cn(
                  'flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-opacity-10',
                  trend.isPositive
                    ? 'text-green-600 bg-green-500'
                    : 'text-red-600 bg-red-500',
                )}
              >
                {trend.isPositive ? (
                  <TrendingUp className="h-2.5 w-2.5" />
                ) : (
                  <TrendingDown className="h-2.5 w-2.5" />
                )}
                {Math.abs(trend.value)}%
              </div>
            )}
            {description && (
              <span className="truncate opacity-80">{description}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
