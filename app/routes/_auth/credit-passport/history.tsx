import { createFileRoute, useNavigate, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'sonner'
import { Download, Eye, History, Trash2 } from 'lucide-react'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { DataTable } from '~/components/ui/data-table'
import { DataTableSkeleton } from '~/components/ui/data-table-skeleton'
import { PageHeader } from '~/components/page-header'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '~/components/ui/alert-dialog'
import {
  deleteReportFn,
  downloadReportFn,
  getReportsHistoryFn,
} from '~/features/credit-passport/server'
import { useFormatDate } from '~/features/settings'
import { ErrorPage } from '~/components/error-page'

const searchSchema = z.object({
  page: z.number().int().positive().optional().default(1),
  pageSize: z.number().int().positive().max(100).optional().default(10),
})

export const Route = createFileRoute('/_auth/credit-passport/history')({
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => ({
    page: search.page,
    pageSize: search.pageSize,
  }),
  loader: async ({ deps }) => {
    return getReportsHistoryFn({ data: deps })
  },
  pendingComponent: DataTableSkeleton,
  errorComponent: ({ error, reset }) => (
    <ErrorPage error={error} reset={reset} />
  ),
  component: ReportHistoryPage,
})

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  expired: 'bg-gray-100 text-gray-800',
}

const REPORT_TYPE_LABELS = {
  credit_assessment: 'Credit Assessment',
  production_certificate: 'Production Certificate',
  impact_report: 'Impact Report',
}

interface ReportHistoryData {
  reports: Array<{
    id: string
    reportType: string
    status: string
    createdAt: string
    verificationCount?: number
    expiresAt?: string
  }>
  total: number
  page: number
  pageSize: number
  totalPages: number
}

function ReportHistoryPage() {
  const { t } = useTranslation(['credit-passport', 'common'])
  const router = useRouter()
  const navigate = useNavigate()
  const { format: formatDate } = useFormatDate()
  const loaderData = Route.useLoaderData()

  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedReport, setSelectedReport] = useState<
    ReportHistoryData['reports'][number] | null
  >(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const filteredReports = (loaderData.reports as Array<any>).filter(
    (report: any) => {
      if (typeFilter !== 'all' && report.reportType !== typeFilter) return false
      if (statusFilter !== 'all' && report.status !== statusFilter) return false
      return true
    },
  )

  const handlePaginationChange = (page: number, pageSize: number) => {
    navigate({
      to: '/credit-passport/history',
      search: { page, pageSize },
    })
  }

  const handleSortChange = (_column: string, _order: 'asc' | 'desc') => {
    // Sorting is handled server-side, currently fixed to createdAt desc
  }

  const handleDownload = async (reportId: string) => {
    try {
      const result = (await downloadReportFn({ data: { reportId } })) as any
      // Convert base64 content to blob
      const binaryString = atob(result.content)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }
      const blob = new Blob([bytes], { type: result.contentType })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `credit-passport-${reportId}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      toast.error(
        t('credit-passport:downloadFailed', {
          defaultValue: 'Failed to download report',
        }),
      )
    }
  }

  const handleDelete = async () => {
    if (!selectedReport) return

    setIsDeleting(true)
    try {
      await deleteReportFn({ data: { reportId: selectedReport.id } })
      toast.success(
        t('credit-passport:reportDeleted', {
          defaultValue: 'Report deleted successfully',
        }),
      )
      setDeleteDialogOpen(false)
      setSelectedReport(null)
      router.invalidate()
    } catch (error) {
      toast.error(
        t('credit-passport:deleteFailed', {
          defaultValue: 'Failed to delete report',
        }),
      )
    } finally {
      setIsDeleting(false)
    }
  }

  const columns = [
    {
      accessorKey: 'reportType',
      header: 'Type',
      cell: ({ row }: any) =>
        REPORT_TYPE_LABELS[
          row.original.reportType as keyof typeof REPORT_TYPE_LABELS
        ],
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }: any) => (
        <Badge
          className={
            STATUS_COLORS[row.original.status as keyof typeof STATUS_COLORS]
          }
        >
          {row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Generated',
      cell: ({ row }: any) => formatDate(new Date(row.original.createdAt)),
    },
    {
      accessorKey: 'verificationCount',
      header: 'Verifications',
      cell: ({ row }: any) => (
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4 text-muted-foreground" />
          {row.original.verificationCount || 0}
        </div>
      ),
    },
    {
      accessorKey: 'expiresAt',
      header: 'Expires',
      cell: ({ row }: any) =>
        row.original.expiresAt
          ? formatDate(new Date(row.original.expiresAt))
          : 'Never',
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }: any) => (
        <div className="flex items-center gap-2">
          {row.original.status === 'completed' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDownload(row.original.id)}
            >
              <Download className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedReport(row.original)
              setDeleteDialogOpen(true)
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('credit-passport:reportHistory', {
          defaultValue: 'Report History',
        })}
        description={t('credit-passport:historyDescription', {
          defaultValue:
            'View and manage your generated credit passport reports',
        })}
        icon={History}
        actions={
          <Button onClick={() => router.navigate({ to: '/credit-passport' })}>
            {t('credit-passport:generateNewReport', {
              defaultValue: 'Generate New Report',
            })}
          </Button>
        }
      />

      <div className="flex gap-4">
        <Select
          value={typeFilter}
          onValueChange={(value) => setTypeFilter(value ?? 'all')}
        >
          <SelectTrigger className="w-48">
            <SelectValue
              placeholder={t('credit-passport:filters.filterByType', {
                defaultValue: 'Filter by type',
              })}
            />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              {t('credit-passport:filters.allTypes', {
                defaultValue: 'All Types',
              })}
            </SelectItem>
            <SelectItem value="credit_assessment">
              {t('credit-passport:types.creditAssessment', {
                defaultValue: 'Credit Assessment',
              })}
            </SelectItem>
            <SelectItem value="production_certificate">
              {t('credit-passport:types.productionCertificate', {
                defaultValue: 'Production Certificate',
              })}
            </SelectItem>
            <SelectItem value="impact_report">
              {t('credit-passport:types.impactReport', {
                defaultValue: 'Impact Report',
              })}
            </SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value ?? 'all')}
        >
          <SelectTrigger className="w-48">
            <SelectValue
              placeholder={t('credit-passport:filters.filterByStatus', {
                defaultValue: 'Filter by status',
              })}
            />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              {t('credit-passport:filters.allStatus', {
                defaultValue: 'All Status',
              })}
            </SelectItem>
            <SelectItem value="pending">
              {t('common:status.pending', { defaultValue: 'Pending' })}
            </SelectItem>
            <SelectItem value="completed">
              {t('common:status.completed', { defaultValue: 'Completed' })}
            </SelectItem>
            <SelectItem value="failed">
              {t('common:status.failed', { defaultValue: 'Failed' })}
            </SelectItem>
            <SelectItem value="expired">
              {t('common:status.expired', { defaultValue: 'Expired' })}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={filteredReports}
        total={loaderData.total}
        page={loaderData.page}
        pageSize={loaderData.pageSize}
        totalPages={loaderData.totalPages}
        emptyIcon={<History className="h-12 w-12 text-muted-foreground" />}
        emptyTitle={t('credit-passport:empty.total', {
          defaultValue: 'No reports found',
        })}
        emptyDescription={t('credit-passport:empty.desc', {
          defaultValue:
            'Generate your first credit passport report to get started.',
        })}
        onPaginationChange={handlePaginationChange}
        onSortChange={handleSortChange}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('credit-passport:deleteReport', {
                defaultValue: 'Delete Report',
              })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this report? This action cannot be
              undone. The report will no longer be accessible for verification.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {t('common:cancel', { defaultValue: 'Cancel' })}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting
                ? t('common:status.deleting', { defaultValue: 'Deleting...' })
                : t('common:delete', { defaultValue: 'Delete' })}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
