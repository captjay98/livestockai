import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { RotateCcw, Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getAuditLogsFn } from '~/lib/logging/audit'
import { AuditLogTable } from '~/components/settings/audit-log-table'
import { Card, CardContent } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { Button } from '~/components/ui/button'
import { AuditSkeleton } from '~/components/settings/audit-skeleton'

interface AuditSearchParams {
  page?: number
  q?: string
  action?: string
  entityType?: string
}

export const Route = createFileRoute('/_auth/settings/audit')({
  component: AuditLogPage,
  validateSearch: (search: Record<string, unknown>): AuditSearchParams => ({
    page: typeof search.page === 'number' ? search.page : 1,
    q: typeof search.q === 'string' ? search.q : undefined,
    action: typeof search.action === 'string' ? search.action : undefined,
    entityType:
      typeof search.entityType === 'string' ? search.entityType : undefined,
  }),
  loaderDeps: ({ search }) => ({
    page: search.page || 1,
    q: search.q,
    action: search.action,
    entityType: search.entityType,
  }),
  loader: async ({ deps }) => {
    return getAuditLogsFn({
      data: {
        page: deps.page,
        pageSize: 20,
        search: deps.q,
        action: deps.action,
        entityType: deps.entityType,
      },
    })
  },
  pendingComponent: AuditSkeleton,
  errorComponent: ({ error }) => (
    <div className="p-4 text-red-600">
      Error loading audit logs: {error.message}
    </div>
  ),
})

function AuditLogPage() {
  const data = Route.useLoaderData()
  const navigate = useNavigate({ from: Route.fullPath })
  const searchParams = Route.useSearch()
  const { t } = useTranslation(['settings', 'common'])

  const [search, setSearch] = useState(searchParams.q || '')

  // Debounce search update
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (search !== (searchParams.q || '')) {
        updateParams({ q: search || undefined, page: 1 })
      }
    }, 500)
    return () => clearTimeout(timeout)
  }, [search, searchParams.q])

  const updateParams = (updates: Partial<AuditSearchParams>) => {
    navigate({
      search: (prev: AuditSearchParams) => ({ ...prev, ...updates }),
      replace: true,
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <div>
          <h3 className="text-lg font-medium">{t('audit.title')}</h3>
          <p className="text-sm text-muted-foreground">
            {t('audit.description')}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('audit.search')}
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select
            value={searchParams.action || 'all'}
            onValueChange={(val) =>
              updateParams({
                action: val === 'all' || val === null ? undefined : val,
                page: 1,
              })
            }
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue>{t('audit.filters.action')}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {t('audit.filters.allActions')}
              </SelectItem>
              <SelectItem value="create">
                {t('common:actions.create', {
                  defaultValue: 'Create',
                })}
              </SelectItem>
              <SelectItem value="update">
                {t('common:actions.update', {
                  defaultValue: 'Update',
                })}
              </SelectItem>
              <SelectItem value="delete">
                {t('common:actions.delete', {
                  defaultValue: 'Delete',
                })}
              </SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={searchParams.entityType || 'all'}
            onValueChange={(val) =>
              updateParams({
                entityType: val === 'all' || val === null ? undefined : val,
                page: 1,
              })
            }
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue>{t('audit.filters.entity')}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {t('audit.filters.allEntities')}
              </SelectItem>
              <SelectItem value="batch">
                {t('common:entities.batch', {
                  defaultValue: 'Batch',
                })}
              </SelectItem>
              <SelectItem value="expense">
                {t('common:entities.expense', {
                  defaultValue: 'Expense',
                })}
              </SelectItem>
              <SelectItem value="mortality">
                {t('common:entities.mortality', {
                  defaultValue: 'Mortality',
                })}
              </SelectItem>
              <SelectItem value="sale">
                {t('common:entities.sale', {
                  defaultValue: 'Sale',
                })}
              </SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setSearch('')
              updateParams({
                q: undefined,
                action: undefined,
                entityType: undefined,
                page: 1,
              })
            }}
            title={t('audit.filters.reset')}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <AuditLogTable
            logs={data.data}
            page={data.page}
            totalPages={data.totalPages}
            onPageChange={(page) => updateParams({ page })}
          />
        </CardContent>
      </Card>
    </div>
  )
}
