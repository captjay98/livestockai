import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { RotateCcw, Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getAuditLogsFn } from '~/lib/logging/audit'
import { AuditLogTable } from '~/components/settings/audit-log-table'
import {
  Card,
  CardContent,
} from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { Button } from '~/components/ui/button'

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
    entityType: typeof search.entityType === 'string' ? search.entityType : undefined,
  }),
  loaderDeps: ({ search }) => ({ 
    page: search.page || 1,
    q: search.q,
    action: search.action,
    entityType: search.entityType
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
})

function AuditLogPage() {
  const data = Route.useLoaderData()
  const navigate = useNavigate({ from: Route.fullPath })
  const searchParams = Route.useSearch()

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
      search: (prev: any) => ({ ...prev, ...updates }),
      replace: true,
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Audit Logs</h3>
        <p className="text-sm text-muted-foreground">
          View and track system activity and changes.
        </p>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search logs..."
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select
            value={searchParams.action || 'all'}
            onValueChange={(val) =>
              updateParams({ action: val === 'all' || val === null ? undefined : val, page: 1 })
            }
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue>Action</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              <SelectItem value="create">Create</SelectItem>
              <SelectItem value="update">Update</SelectItem>
              <SelectItem value="delete">Delete</SelectItem>
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
              <SelectValue>Entity</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Entities</SelectItem>
              <SelectItem value="batch">Batch</SelectItem>
              <SelectItem value="expense">Expense</SelectItem>
              <SelectItem value="mortality">Mortality</SelectItem>
              <SelectItem value="sale">Sale</SelectItem>
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
            title="Reset filters"
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
