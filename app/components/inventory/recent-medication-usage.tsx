import { Link } from '@tanstack/react-router'
import { Activity, ArrowRight, Syringe } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Button } from '~/components/ui/button'

interface MedicationUsageSummary {
  medicationName: string
  totalDoses: number
  recordCount: number
}

interface RecentMedicationUsageProps {
  usage: Array<MedicationUsageSummary>
  days?: number
}

export function RecentMedicationUsage({
  usage,
  days = 7,
}: RecentMedicationUsageProps) {
  const { t } = useTranslation(['inventory', 'common'])

  if (usage.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            {t('inventory:recentUsage.title', {
              defaultValue: 'Recent Medication Usage',
              days,
            })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <Syringe className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">
              {t('inventory:recentUsage.empty', {
                defaultValue: 'No medication usage in the last {{days}} days',
                days,
              })}
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const totalDoses = usage.reduce((sum, item) => sum + item.totalDoses, 0)
  const totalRecords = usage.reduce((sum, item) => sum + item.recordCount, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          {t('inventory:recentUsage.title', {
            defaultValue: 'Medication Usage (Last {{days}} Days)',
            days,
          })}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {usage.map((item) => (
            <div
              key={item.medicationName}
              className="flex items-center justify-between p-3 rounded-lg border bg-card"
            >
              <div>
                <p className="font-medium">{item.medicationName}</p>
                <p className="text-sm text-muted-foreground">
                  {item.recordCount}{' '}
                  {t('inventory:recentUsage.administrations', {
                    defaultValue: 'administration{{s}}',
                    count: item.recordCount,
                    s: item.recordCount === 1 ? '' : 's',
                  })}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-lg">{item.totalDoses}</p>
                <p className="text-xs text-muted-foreground">
                  {t('inventory:recentUsage.doses', { defaultValue: 'doses' })}
                </p>
              </div>
            </div>
          ))}

          <div className="pt-3 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">
                {t('inventory:recentUsage.total', { defaultValue: 'Total' })}
              </span>
              <div className="text-right">
                <p className="font-bold text-lg">{totalDoses}</p>
                <p className="text-xs text-muted-foreground">
                  {totalRecords}{' '}
                  {t('inventory:recentUsage.administrations', {
                    defaultValue: 'administration{{s}}',
                    count: totalRecords,
                    s: totalRecords === 1 ? '' : 's',
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>

        <Button asChild variant="outline" className="w-full mt-4">
          <Link to="/vaccinations">
            {t('inventory:recentUsage.viewAll', {
              defaultValue: 'View All Health Records',
            })}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
