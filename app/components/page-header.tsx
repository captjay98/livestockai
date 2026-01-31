import type { LucideIcon } from 'lucide-react'

interface PageHeaderProps {
  title: string
  description?: string
  icon?: LucideIcon
  actions?: React.ReactNode
}

export function PageHeader({
  title,
  description,
  icon: Icon,
  actions,
}: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6 mb-10 group">
      <div className="space-y-2">
        <div className="flex items-center gap-4">
          {Icon && (
            <div className="h-12 w-12 rounded-2xl bg-white/40 dark:bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center shrink-0 shadow-lg group-hover:scale-110 transition-transform">
              <Icon className="h-6 w-6 text-primary" />
            </div>
          )}
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
              {title}
            </h1>
            {description && (
              <p className="text-muted-foreground text-xs sm:text-sm font-medium max-w-2xl leading-relaxed mt-1">
                {description}
              </p>
            )}
          </div>
        </div>
      </div>
      {actions && (
        <div className="flex items-center gap-3 pt-2 sm:pt-0">{actions}</div>
      )}
    </div>
  )
}
