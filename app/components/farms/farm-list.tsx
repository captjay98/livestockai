import { Link } from '@tanstack/react-router'
import { Bird, Edit, Fish, MapPin, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { FarmWithStats } from '~/features/farms/types'
import { Button, buttonVariants } from '~/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'

interface FarmListProps {
  farms: Array<FarmWithStats>
  onEdit: (farm: FarmWithStats) => void
}

export function FarmList({ farms, onEdit }: FarmListProps) {
  const { t } = useTranslation(['farms', 'common'])

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {farms.map((farm) => (
        <Card
          key={farm.id}
          className="bg-white/30 dark:bg-black/30 backdrop-blur-md border-white/20 dark:border-white/10 shadow-sm rounded-2xl overflow-hidden hover:bg-white/40 dark:hover:bg-black/40 transition-all hover:scale-[1.01] group relative"
        >
          <div className="absolute top-0 right-0 p-12 opacity-0 group-hover:opacity-10 rounded-full blur-2xl transform translate-x-4 -translate-y-4 pointer-events-none bg-primary transition-opacity" />
          <CardHeader className="relative z-10">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-xl font-bold">{farm.name}</CardTitle>
                <CardDescription className="flex items-center mt-1 text-xs font-medium">
                  <MapPin className="h-3.5 w-3.5 mr-1" />
                  {farm.location}
                </CardDescription>
              </div>
              <Badge
                variant={
                  farm.type === 'poultry'
                    ? 'default'
                    : farm.type === 'aquaculture'
                      ? 'secondary'
                      : 'outline'
                }
                className="rounded-full px-3"
              >
                {t(`farms:types.${farm.type}`)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 relative z-10">
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <div className="p-1.5 rounded-full bg-primary/10 text-primary">
                  <Users className="h-3.5 w-3.5" />
                </div>
                <span className="font-medium text-foreground">
                  {farm.activeBatches}
                </span>
                <span className="text-xs">
                  {t('farms:stats.batches', {
                    count: farm.activeBatches,
                  })}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <div className="p-1.5 rounded-full bg-blue-500/10 text-blue-500">
                  {farm.type === 'aquaculture' ? (
                    <Fish className="h-3.5 w-3.5" />
                  ) : (
                    <Bird className="h-3.5 w-3.5" />
                  )}
                </div>
                <span className="font-medium text-foreground">
                  {farm.totalLivestock.toLocaleString()}
                </span>
                <span className="text-xs">{t('farms:stats.livestock')}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <Link
                to="/farms/$farmId"
                params={{ farmId: farm.id }}
                className={buttonVariants({
                  variant: 'default',
                  size: 'sm',
                  className: 'flex-1 rounded-xl',
                })}
              >
                {t('farms:detail.view', {
                  defaultValue: 'View Details',
                })}
              </Link>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 rounded-xl border-white/20"
                onClick={() => onEdit(farm)}
              >
                <Edit className="h-4 w-4 mr-2" />
                {t('common:edit')}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
