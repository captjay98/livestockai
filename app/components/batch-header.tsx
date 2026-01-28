import { Link } from '@tanstack/react-router'
import {
    ArrowLeft,
    Beef,
    Bird,
    Cloud,
    Fish,
    Hexagon,
    Rabbit,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '~/lib/utils'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { SyncStatus } from '~/components/sync-status'

const livestockIcons: Record<string, React.ElementType> = {
    poultry: Bird,
    fish: Fish,
    cattle: Beef,
    goats: Rabbit,
    sheep: Cloud,
    bees: Hexagon,
}

const livestockColors: Record<string, string> = {
    poultry: 'text-orange-600',
    fish: 'text-blue-600',
    cattle: 'text-amber-700',
    goats: 'text-green-600',
    sheep: 'text-purple-600',
    bees: 'text-yellow-600',
}

interface BatchHeaderProps {
    batch: {
        id: string
        batchName: string | null
        species: string
        livestockType: string
        status: string
        currentQuantity: number
        initialQuantity: number
        acquisitionDate: Date
    }
    farmName?: string
    backHref?: string
    actions?: React.ReactNode
    className?: string
}

export function BatchHeader({
    batch,
    farmName,
    backHref = '/batches',
    actions,
    className,
}: BatchHeaderProps) {
    const { t } = useTranslation(['batches', 'common'])

    const Icon = livestockIcons[batch.livestockType] ?? Bird
    const iconColor =
        livestockColors[batch.livestockType] ?? 'text-muted-foreground'

    const ageInDays = Math.floor(
        (new Date().getTime() - new Date(batch.acquisitionDate).getTime()) /
            (1000 * 60 * 60 * 24),
    )
    const ageInWeeks = Math.floor(ageInDays / 7)
    const ageDisplay = ageInWeeks > 0 ? `${ageInWeeks}w` : `${ageInDays}d`

    return (
        <div
            className={cn(
                'sticky top-0 z-20 -mx-3 -mt-4 sm:-mx-4 sm:-mt-6 px-3 py-3 sm:px-4',
                'bg-background/95 backdrop-blur-md border-b mb-4',
                className,
            )}
        >
            <div className="flex items-center gap-3">
                {/* Back button */}
                <Button variant="ghost" size="icon" asChild>
                    <Link to={backHref as any} preload="intent">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                </Button>

                {/* Batch info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <Icon className={cn('h-5 w-5 shrink-0', iconColor)} />
                        <h1 className="text-lg font-bold truncate">
                            {batch.batchName || batch.species}
                        </h1>
                        <Badge variant="secondary" className="shrink-0">
                            {ageDisplay}
                        </Badge>
                        <Badge
                            variant={
                                batch.status === 'active'
                                    ? 'default'
                                    : 'secondary'
                            }
                            className="shrink-0"
                        >
                            {t(`statuses.${batch.status}`, {
                                defaultValue: batch.status,
                            })}
                        </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                        {batch.currentQuantity.toLocaleString()}/
                        {batch.initialQuantity.toLocaleString()} {batch.species}
                        {farmName && ` • ${farmName}`}
                    </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                    <SyncStatus size="sm" showLabel={false} />
                    {actions}
                </div>
            </div>
        </div>
    )
}
