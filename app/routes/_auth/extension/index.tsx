import { Link, createFileRoute } from '@tanstack/react-router'
import { MapPin, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { getUserDistrictsFn } from '~/features/extension/server'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { PageHeader } from '~/components/page-header'
import { DataTableSkeleton } from '~/components/ui/data-table-skeleton'
import { ErrorPage } from '~/components/error-page'

export const Route = createFileRoute('/_auth/extension/')({
  loader: async () => {
    return getUserDistrictsFn()
  },
  pendingComponent: () => <DataTableSkeleton />,
  errorComponent: ({ error, reset }) => (
    <ErrorPage error={error} reset={reset} />
  ),
  component: ExtensionHomePage,
})

function ExtensionHomePage() {
  const { t } = useTranslation(['extension', 'common'])
  const districts = Route.useLoaderData()

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('extension:dashboard', {
          defaultValue: 'Extension Worker Dashboard',
        })}
        description={t('extension:dashboardDescription', {
          defaultValue:
            'Manage your assigned districts and monitor farm health',
        })}
        icon={Users}
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {districts.map((district: any) => (
          <Card
            key={district.id}
            className="bg-white/30 dark:bg-black/80 backdrop-blur-2xl border-white/20 dark:border-white/10 shadow-2xl rounded-3xl overflow-hidden hover:bg-white/40 dark:hover:bg-white/5 transition-all group relative border"
          >
            {/* Decorative Orb */}
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/10 rounded-full blur-3xl pointer-events-none group-hover:scale-110 transition-transform" />

            <CardHeader className="pb-3 relative z-10">
              <CardTitle className="flex items-center gap-3 text-xl font-black tracking-tight">
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-inner group-hover:scale-110 transition-transform">
                  <MapPin className="h-5 w-5" />
                </div>
                {district.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10 space-y-4">
              <p className="text-sm text-muted-foreground/80 font-bold uppercase tracking-widest flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                {district.farmCount}{' '}
                {district.farmCount === 1
                  ? t('extension:farm', { defaultValue: 'farm' })
                  : t('extension:farms', { defaultValue: 'farms' })}{' '}
                {t('extension:assigned', { defaultValue: 'assigned' })}
              </p>
              <Button
                asChild
                className="w-full rounded-2xl font-black bg-primary/90 hover:bg-primary shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
              >
                <Link
                  to="/extension"
                  className="flex items-center justify-center gap-2"
                >
                  {t('extension:openDashboard', {
                    defaultValue: 'Open Dashboard',
                  })}
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
