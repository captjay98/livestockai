import { Link, createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { AlertTriangle, Plus, TrendingUp, Users } from 'lucide-react'
import { format } from 'date-fns'
import { checkObserverAccess } from '~/auth/utils'
import { getVisitRecordsFn } from '~/features/visits/server'
import { getFarmHealthComparisonFn } from '~/features/farms/server'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Skeleton } from '~/components/ui/skeleton'
import { ErrorPage } from '~/components/error-page'

export const Route = createFileRoute('/_auth/extension/farm/$farmId')({
  loader: async ({ params }) => {
    const farmId = params.farmId

    // Verify observer access and get grant details
    await checkObserverAccess(farmId)

    // Get access grant to check financial visibility
    const { getDb } = await import('~/lib/db')
    const db = await getDb()
    const { requireAuth } = await import('~/features/auth/server-middleware')
    const session = await requireAuth()

    const { getActiveAccessGrant } =
      await import('~/features/extension/access-repository')
    const accessGrant = await getActiveAccessGrant(db, session.user.id, farmId)

    // Get visit records and health comparison for this farm
    const [visits, healthComparison] = await Promise.all([
      getVisitRecordsFn({ data: { farmId } }),
      getFarmHealthComparisonFn({ data: { farmId } }),
    ])

    return {
      farmId,
      visits,
      healthComparison,
      hasFinancialAccess: accessGrant?.financialVisibility ?? false,
    }
  },
  pendingComponent: () => <Skeleton className="h-96 w-full" />,
  errorComponent: ({ error, reset }) => (
    <ErrorPage error={error} reset={reset} />
  ),
  component: FarmHealthSummary,
})

function FarmHealthSummary() {
  const { t } = useTranslation(['extension', 'common'])
  const { farmId, visits, healthComparison, hasFinancialAccess } =
    Route.useLoaderData()

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {t('extension:farmHealth.title', {
              defaultValue: 'Farm Health Summary',
            })}
          </h1>
          <p className="text-muted-foreground">
            {t('extension:farmHealth.subtitle', {
              defaultValue: 'Extension worker view for farm monitoring',
            })}
          </p>
          {!hasFinancialAccess && (
            <p className="text-sm text-amber-600 mt-1">
              {t('extension:farmHealth.limitedAccess', {
                defaultValue: 'Financial data is not visible for this farm',
              })}
            </p>
          )}
        </div>
        <Button asChild>
          <Link to="/extension/visits/new/$farmId" params={{ farmId }}>
            <Plus className="h-4 w-4 mr-2" />
            {t('extension:newVisit', { defaultValue: 'New Visit' })}
          </Link>
        </Button>
      </div>

      {/* Farm Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('extension:overview.activeBatches', {
                defaultValue: 'Active Batches',
              })}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">
              {t('extension:overview.batchesDesc', {
                defaultValue: 'Currently active',
              })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('extension:overview.avgMortality', {
                defaultValue: 'Avg Mortality',
              })}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.3%</div>
            <p className="text-xs text-muted-foreground">
              {healthComparison.districtAvgMortality !== null ? (
                <>
                  {t('extension:districtAvg', { defaultValue: 'District avg' })}
                  : {healthComparison.districtAvgMortality}%
                </>
              ) : (
                t('extension:overview.mortalityDesc', {
                  defaultValue: 'Within normal range',
                })
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('extension:overview.districtRank', {
                defaultValue: 'District Ranking',
              })}
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {healthComparison.percentileRank !== null
                ? `${healthComparison.percentileRank}%`
                : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              {healthComparison.percentileRank !== null ? (
                <>
                  {t('extension:farmsHigherMortality', {
                    defaultValue: 'Farms with higher mortality',
                  })}
                </>
              ) : (
                'No district data'
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Visit History */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">
          {t('extension:visitHistory.title', {
            defaultValue: 'Visit History',
          })}
        </h2>

        {visits.length > 0 ? (
          visits.map((visit) => (
            <Card key={visit.id}>
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">
                      {format(new Date(visit.visitDate), 'PP')}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {visit.visitType.charAt(0).toUpperCase() +
                        visit.visitType.slice(1).replace('_', ' ')}
                    </p>
                  </div>
                </div>
                {/* visit.notes usage removed */}
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">
                {t('extension:visitHistory.empty', {
                  defaultValue: 'No visits recorded yet',
                })}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
