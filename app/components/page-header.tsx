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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="space-y-1">
                <div className="flex items-center gap-3">
                    {Icon && (
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <Icon className="h-5 w-5 text-primary" />
                        </div>
                    )}
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                        {title}
                    </h1>
                </div>
                {description && (
                    <p className="text-muted-foreground text-sm sm:text-base max-w-2xl">
                        {description}
                    </p>
                )}
            </div>
            {actions && (
                <div className="flex items-center gap-2">{actions}</div>
            )}
        </div>
    )
}
