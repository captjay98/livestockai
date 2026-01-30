import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { Download, MapPin, Search } from 'lucide-react'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { getDistrictDashboardFn } from '~/features/extension/server'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { Input } from '~/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { PageHeader } from '~/components/page-header'
import { DataTableSkeleton } from '~/components/ui/data-table-skeleton'
import { ErrorPage } from '~/components/error-page'
// import { exportToCSV } from '~/lib/export/csv'

const validateSearch = z.object({
  page: z.number().min(1).catch(1),
  pageSize: z.number().min(1).max(100).catch(20),
  livestockType: z.string().optional(),
  healthStatus: z.enum(['healthy', 'warning', 'critical']).optional(),
  search: z.string().optional(),
})

export const Route = createFileRoute('/_auth/extension/district/$districtId')({
  validateSearch,
  loaderDeps: ({ search, params }: any) => ({
    page: search.page,
    pageSize: search.pageSize,
    livestockType: search.livestockType,
    healthStatus: search.healthStatus,
    search: search.search,
    districtId: params.districtId,
  }),
  loader: async ({ deps }) => {
    return getDistrictDashboardFn({
      data: deps,
    })
  },
  pendingComponent: () => <DataTableSkeleton />,
  errorComponent: ({ error, reset }) => (
    <ErrorPage error={error} reset={reset} />
  ),
  component: DistrictDashboardPage,
})

function DistrictDashboardPage() {
  const { t } = useTranslation(['extension', 'common'])
  const searchParams = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })
  const { district, stats, farms, pagination } = Route.useLoaderData()

  const updateSearch = (updates: Partial<typeof searchParams>) => {
    navigate({
      search: { ...searchParams, ...updates },
    })
  }

  /*
  const handleExportCSV = () => {
    // CSV export implementation pending
  }
  */

  const getHealthBadgeVariant = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'default'
      case 'warning':
        return 'secondary'
      case 'critical':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={district.name}
        description={t('extension:districtDashboardDescription', {
          defaultValue: 'District dashboard with {{count}} farms',
          count: stats.totalFarms,
        })}
        icon={MapPin}
        actions={
          <Button variant="outline" size="sm" disabled>
            <Download className="h-4 w-4 mr-2" />
            {t('extension:exportCSV', { defaultValue: 'Export CSV' })}
          </Button>
        }
      />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              {t('extension:totalFarms', { defaultValue: 'Total Farms' })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalFarms}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-600">
              Healthy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.healthyFarms}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-amber-600">
              Warning
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {stats.warningFarms}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-600">
              Critical
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats.criticalFarms}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-orange-600">
              Active Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {stats.activeAlerts || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('extension:searchFarms', {
              defaultValue: 'Search farms...',
            })}
            value={searchParams.search || ''}
            onChange={(e) => updateSearch({ search: e.target.value, page: 1 })}
            className="pl-10"
          />
        </div>
        <Select
          value={searchParams.livestockType || ''}
          onValueChange={(value) =>
            updateSearch({
              livestockType: value || undefined,
              page: 1,
            })
          }
        >
          <SelectTrigger className="w-48">
            <SelectValue
              placeholder={t('extension:allLivestock', {
                defaultValue: 'All Livestock',
              })}
            />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">
              {t('extension:allLivestock', { defaultValue: 'All Livestock' })}
            </SelectItem>
            <SelectItem value="poultry">
              {t('extension:poultry', { defaultValue: 'Poultry' })}
            </SelectItem>
            <SelectItem value="fish">
              {t('extension:fish', { defaultValue: 'Fish' })}
            </SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={searchParams.healthStatus || ''}
          onValueChange={(value) =>
            updateSearch({
              healthStatus:
                (value as 'warning' | 'critical' | 'healthy' | undefined) ||
                undefined,
              page: 1,
            })
          }
        >
          <SelectTrigger className="w-48">
            <SelectValue
              placeholder={t('extension:allStatus', {
                defaultValue: 'All Status',
              })}
            />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">
              {t('extension:allStatus', { defaultValue: 'All Status' })}
            </SelectItem>
            <SelectItem value="healthy">
              {t('extension:healthy', { defaultValue: 'Healthy' })}
            </SelectItem>
            <SelectItem value="warning">
              {t('extension:warning', { defaultValue: 'Warning' })}
            </SelectItem>
            <SelectItem value="critical">
              {t('extension:critical', { defaultValue: 'Critical' })}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Farm Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {farms.map((farm: any) => (
          <Link
            key={farm.id}
            to="/extension/farm/$farmId"
            params={{ farmId: farm.id }}
          >
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{farm.name}</CardTitle>
                  <Badge variant={getHealthBadgeVariant(farm.healthStatus)}>
                    {farm.healthStatus}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="font-medium">Owner:</span> {farm.ownerName}
                  </p>
                  <p>
                    <span className="font-medium">Location:</span>{' '}
                    {farm.location}
                  </p>
                  <p>
                    <span className="font-medium">Batches:</span>{' '}
                    {farm.batchCount}
                  </p>
                  <p>
                    <span className="font-medium">
                      {t('extension:lastVisit', {
                        defaultValue: 'Last Visit:',
                      })}
                    </span>{' '}
                    {farm.lastVisit ||
                      t('common:never', { defaultValue: 'Never' })}
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(
            (page) => (
              <Button
                key={page}
                variant={
                  page === pagination.currentPage ? 'default' : 'outline'
                }
                size="sm"
                onClick={() => updateSearch({ page })}
              >
                {page}
              </Button>
            ),
          )}
        </div>
      )}
    </div>
  )
}
