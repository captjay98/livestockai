import { Link, createFileRoute } from '@tanstack/react-router'
import { AlertTriangle, MapPin, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Badge } from '~/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { PageHeader } from '~/components/page-header'
import { cn } from '~/lib/utils'
import { getOutbreakAlertsFn } from '~/features/extension/server'
import { DataTableSkeleton } from '~/components/ui/data-table-skeleton'
import { ErrorPage } from '~/components/error-page'

export const Route = createFileRoute('/_auth/extension/alerts')({
  loader: async () => {
    return getOutbreakAlertsFn()
  },
  pendingComponent: () => <DataTableSkeleton />,
  errorComponent: ({ error, reset }) => (
    <ErrorPage error={error} reset={reset} />
  ),
  component: ExtensionAlertsPage,
})

function ExtensionAlertsPage() {
  const { t } = useTranslation(['common'])
  const alerts = Route.useLoaderData()

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'destructive'
      case 'warning':
        return 'secondary'
      default:
        return 'default'
    }
  }

  const getSpeciesIcon = (species: string) => {
    switch (species) {
      case 'poultry':
        return '🐔'
      case 'fish':
        return '🐟'
      case 'cattle':
        return '🐄'
      default:
        return '🐾'
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('extension:outbreakAlerts', {
          defaultValue: 'Outbreak Alerts',
        })}
        description={t('extension:alertsDescription', {
          defaultValue:
            'Active health alerts and critical outbreaks for your assigned districts.',
        })}
        icon={AlertTriangle}
      />

      {alerts.length === 0 ? (
        <Card className="bg-white/30 dark:bg-black/80 backdrop-blur-2xl border-white/20 dark:border-white/10 rounded-3xl shadow-xl border overflow-hidden py-12">
          <CardContent className="flex flex-col items-center justify-center">
            <div className="p-4 rounded-full bg-white/40 dark:bg-white/10 mb-6 shadow-inner border border-white/20">
              <AlertTriangle className="h-12 w-12 text-muted-foreground/40" />
            </div>
            <h3 className="text-2xl font-black mb-2 tracking-tight">
              {t('extension:noActiveAlerts', {
                defaultValue: 'No Active Alerts',
              })}
            </h3>
            <p className="text-muted-foreground font-medium text-center max-w-sm">
              {t('extension:noAlertsDescription', {
                defaultValue:
                  'All farms in your assigned districts are currently healthy and monitoring is stable.',
              })}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {alerts.map((alert: any) => (
            <Card
              key={alert.id}
              className="bg-white/30 dark:bg-black/80 backdrop-blur-xl border-white/20 dark:border-white/10 shadow-2xl rounded-3xl overflow-hidden hover:bg-white/40 dark:hover:bg-white/5 transition-all group relative border"
            >
              <CardHeader className="pb-4 relative z-10">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-3xl h-14 w-14 flex items-center justify-center bg-white/50 dark:bg-white/10 rounded-2xl border border-white/20 shadow-xl group-hover:scale-110 transition-transform">
                      {getSpeciesIcon(alert.livestockType)}
                    </div>
                    <div>
                      <CardTitle className="text-xl font-black tracking-tight">
                        {alert.livestockType} Outbreak
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <MapPin className="h-4 w-4 text-primary" />
                        <span className="text-sm text-muted-foreground font-bold uppercase tracking-widest">
                          {alert.districtName || 'Unknown District'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Badge
                    variant={getSeverityColor(alert.severity)}
                    className={cn(
                      'rounded-lg px-3 py-1 font-black uppercase tracking-widest text-[10px] shadow-lg',
                      alert.severity === 'critical'
                        ? 'bg-red-500 shadow-red-500/20'
                        : 'bg-orange-500 shadow-orange-500/20',
                    )}
                  >
                    {alert.severity}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0 relative z-10">
                <p className="text-sm text-muted-foreground/80 mb-6 font-medium leading-relaxed max-w-2xl">
                  {alert.notes ||
                    'Monitoring active. No critical notes provided at this time.'}
                </p>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-white/10">
                  <div className="flex items-center gap-2 text-[11px] font-black text-primary/80 uppercase tracking-tighter">
                    <div className="p-1 rounded-md bg-primary/10">
                      <Users className="h-3.5 w-3.5" />
                    </div>
                    <span>
                      {alert.affectedFarmCount || 0} farm
                      {alert.affectedFarmCount !== 1 ? 's' : ''} affected
                    </span>
                  </div>
                  <Link
                    to="/extension/alerts/$alertId"
                    params={{ alertId: alert.id }}
                  >
                    <Button
                      variant="outline"
                      className="rounded-xl font-bold bg-white/50 dark:bg-white/5 border-white/10 hover:bg-white/80 dark:hover:bg-white/10 hover:border-white/20 shadow-sm px-6 h-10 group/btn"
                    >
                      {t('extension:analyzeData', {
                        defaultValue: 'Analyze Data',
                      })}
                      <div className="ml-2 w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
              {/* Decorative Orb */}
              <div
                className={cn(
                  'absolute -bottom-16 -right-16 w-48 h-48 rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-opacity',
                  alert.severity === 'critical'
                    ? 'bg-red-600'
                    : 'bg-orange-500',
                )}
              />
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
