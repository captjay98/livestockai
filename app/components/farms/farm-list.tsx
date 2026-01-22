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
        <Card key={farm.id} className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-xl">{farm.name}</CardTitle>
                <CardDescription className="flex items-center mt-1">
                  <MapPin className="h-4 w-4 mr-1" />
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
              >
                {t(`farms:types.${farm.type}`)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Users className="h-4 w-4" />
                <span className="font-medium text-foreground">
                  {farm.activeBatches}
                </span>
                <span>
                  {t('farms:stats.batches', { count: farm.activeBatches })}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                {farm.type === 'aquaculture' ? (
                  <Fish className="h-4 w-4" />
                ) : (
                  <Bird className="h-4 w-4" />
                )}
                <span className="font-medium text-foreground">
                  {farm.totalLivestock.toLocaleString()}
                </span>
                <span>{t('farms:stats.livestock')}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <Link
                to="/farms/$farmId"
                params={{ farmId: farm.id }}
                className={buttonVariants({
                  variant: 'default',
                  size: 'sm',
                  className: 'flex-1',
                })}
              >
                {t('farms:detail.view', { defaultValue: 'View Details' })}
              </Link>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
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
