import { Link } from '@tanstack/react-router'
import { ArrowRight, TrendingUp, Wheat } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { useFormatWeight } from '~/features/settings'

interface FeedConsumptionSummary {
  feedType: string
  totalQuantityKg: number
  recordCount: number
}

interface RecentFeedConsumptionProps {
  consumption: Array<FeedConsumptionSummary>
  days?: number
}

export function RecentFeedConsumption({
  consumption,
  days = 7,
}: RecentFeedConsumptionProps) {
  const { t } = useTranslation(['inventory', 'common'])
  const { format: formatWeight } = useFormatWeight()

  if (consumption.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            {t('inventory:recentConsumption.title', {
              defaultValue: 'Recent Feed Consumption',
              days,
            })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <Wheat className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">
              {t('inventory:recentConsumption.empty', {
                defaultValue: 'No feed consumption in the last {{days}} days',
                days,
              })}
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const totalConsumption = consumption.reduce(
    (sum, item) => sum + item.totalQuantityKg,
    0,
  )
  const totalRecords = consumption.reduce(
    (sum, item) => sum + item.recordCount,
    0,
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          {t('inventory:recentConsumption.title', {
            defaultValue: 'Feed Consumption (Last {{days}} Days)',
            days,
          })}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {consumption.map((item) => (
            <div
              key={item.feedType}
              className="flex items-center justify-between p-3 rounded-lg border bg-card"
            >
              <div>
                <p className="font-medium capitalize">
                  {item.feedType.replace(/_/g, ' ')}
                </p>
                <p className="text-sm text-muted-foreground">
                  {item.recordCount}{' '}
                  {t('inventory:recentConsumption.records', {
                    defaultValue: 'feeding{{s}}',
                    count: item.recordCount,
                    s: item.recordCount === 1 ? '' : 's',
                  })}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-lg">
                  {formatWeight(item.totalQuantityKg)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t('inventory:recentConsumption.consumed', {
                    defaultValue: 'consumed',
                  })}
                </p>
              </div>
            </div>
          ))}

          <div className="pt-3 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">
                {t('inventory:recentConsumption.total', {
                  defaultValue: 'Total',
                })}
              </span>
              <div className="text-right">
                <p className="font-bold text-lg">
                  {formatWeight(totalConsumption)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {totalRecords}{' '}
                  {t('inventory:recentConsumption.records', {
                    defaultValue: 'feeding{{s}}',
                    count: totalRecords,
                    s: totalRecords === 1 ? '' : 's',
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>

        <Button asChild variant="outline" className="w-full mt-4">
          <Link to="/feed">
            {t('inventory:recentConsumption.viewAll', {
              defaultValue: 'View All Feed Records',
            })}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
