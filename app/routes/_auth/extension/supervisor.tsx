import { Link, createFileRoute } from '@tanstack/react-router'
import { AlertTriangle, Shield, TrendingUp, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { getSupervisorDashboardFn } from '~/features/extension/server'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { PageHeader } from '~/components/page-header'
import { DataTableSkeleton } from '~/components/ui/data-table-skeleton'
import { ErrorPage } from '~/components/error-page'

export const Route = createFileRoute('/_auth/extension/supervisor')({
  loader: async () => {
    return getSupervisorDashboardFn({ data: undefined })
  },
  pendingComponent: () => <DataTableSkeleton />,
  errorComponent: ({ error, reset }) => (
    <ErrorPage error={error} reset={reset} />
  ),
  component: SupervisorDashboard,
})

function SupervisorDashboard() {
  const { t } = useTranslation(['extension', 'common'])
  const { districts, totalDistricts } = Route.useLoaderData()

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('extension:supervisor', {
          defaultValue: 'Extension Supervisor',
        })}
        description={t('extension:supervisorDescription', {
          defaultValue: 'Managing {{count}} assigned {{districts}}',
          count: totalDistricts,
          districts: totalDistricts === 1 ? 'district' : 'districts',
        })}
        icon={Shield}
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {districts.map((district: any) => (
          <Card
            key={district.id}
            className="bg-white/30 dark:bg-black/80 backdrop-blur-2xl border-white/20 dark:border-white/10 shadow-2xl rounded-3xl overflow-hidden hover:bg-white/40 dark:hover:bg-white/5 transition-all group relative border"
          >
            {/* Decorative Orb */}
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl pointer-events-none group-hover:scale-110 transition-transform" />

            <CardHeader className="pb-4 relative z-10">
              <div className="flex items-center justify-between mb-1">
                <CardTitle className="text-xl font-black tracking-tight">
                  {district.name}
                </CardTitle>
                {district.outbreakCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-black shadow-lg shadow-red-500/20 animate-pulse text-[10px] uppercase tracking-widest"
                  >
                    <AlertTriangle className="h-3.5 w-3.5" />
                    {district.outbreakCount} ALERT
                  </Badge>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em]">
                {district.lga} • {district.state}
              </p>
            </CardHeader>

            <CardContent className="space-y-6 relative z-10">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/40 dark:bg-white/5 border border-white/20 shadow-sm">
                  <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 shadow-inner">
                    <Users className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-lg font-black tracking-tight leading-none mb-1">
                      {district.farmCount}
                    </p>
                    <p className="text-[9px] text-muted-foreground uppercase font-black tracking-widest">
                      Farms
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/40 dark:bg-white/5 border border-white/20 shadow-sm">
                  <div className="p-2 rounded-xl bg-green-500/10 text-green-600 shadow-inner">
                    <Shield className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-lg font-black tracking-tight leading-none mb-1">
                      {district.livestockCount.toLocaleString()}
                    </p>
                    <p className="text-[9px] text-muted-foreground uppercase font-black tracking-widest">
                      Lives
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white/40 dark:bg-white/5 border border-white/20 shadow-inner">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="h-3.5 w-3.5 text-orange-600" />
                  <p className="text-[10px] font-black text-muted-foreground/80 uppercase tracking-widest">
                    Health Network
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge
                    variant="outline"
                    className="text-[10px] font-black uppercase tracking-tighter text-emerald-600 border-emerald-500/20 bg-emerald-500/5 px-2 py-0.5 rounded-lg"
                  >
                    {district.healthStats.healthy} Healthy
                  </Badge>
                  <Badge
                    variant="outline"
                    className="text-[10px] font-black uppercase tracking-tighter text-amber-600 border-amber-500/20 bg-amber-500/5 px-2 py-0.5 rounded-lg"
                  >
                    {district.healthStats.warning} Warning
                  </Badge>
                  <Badge
                    variant="outline"
                    className="text-[10px] font-black uppercase tracking-tighter text-red-600 border-red-500/20 bg-red-500/5 px-2 py-0.5 rounded-lg"
                  >
                    {district.healthStats.critical} Critical
                  </Badge>
                </div>
              </div>

              <Button
                asChild
                variant="outline"
                className="w-full rounded-2xl h-11 font-black bg-white/50 dark:bg-white/10 border-white/20 hover:bg-white/80 dark:hover:bg-white/20 shadow-sm hover:border-white/40 transition-all group/btn"
              >
                <Link
                  to="/extension/district/$districtId"
                  params={{ districtId: district.id }}
                  search={{ page: 1, pageSize: 20 }}
                  className="flex items-center justify-center gap-2"
                >
                  {t('extension:districtDetails', {
                    defaultValue: 'District Details',
                  })}
                  <TrendingUp className="h-4 w-4 opacity-40 group-hover/btn:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </CardContent>
            {/* Background Accent */}
            <div className="absolute -top-12 -left-12 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl" />
          </Card>
        ))}
      </div>

      {districts.length === 0 && (
        <Card className="bg-white/30 dark:bg-black/80 backdrop-blur-2xl border-white/20 dark:border-white/10 rounded-3xl shadow-xl border overflow-hidden py-12">
          <CardContent className="flex flex-col items-center justify-center">
            <div className="p-4 rounded-full bg-white/40 dark:bg-white/10 mb-6 shadow-inner border border-white/20">
              <Shield className="h-12 w-12 text-muted-foreground/40" />
            </div>
            <h3 className="text-2xl font-black mb-2 tracking-tight">
              {t('extension:noDistrictsAssigned', {
                defaultValue: 'No Districts Assigned',
              })}
            </h3>
            <p className="text-muted-foreground font-medium text-center max-w-sm">
              {t('extension:noDistrictsDescription', {
                defaultValue:
                  'You are not currently assigned as a supervisor for any districts in the network.',
              })}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
