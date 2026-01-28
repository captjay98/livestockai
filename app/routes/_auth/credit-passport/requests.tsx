import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'sonner'
import { CheckCircle, Clock, UserCheck, XCircle } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { DataTable } from '~/components/ui/data-table'
import { PageHeader } from '~/components/page-header'
import { Textarea } from '~/components/ui/textarea'
import { Label } from '~/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import {
  approveRequestFn,
  denyRequestFn,
  getReportRequestsFn,
} from '~/features/credit-passport/server'
import { useFormatDate } from '~/features/settings'

export const Route = createFileRoute('/_auth/credit-passport/requests')({
  loader: async () => {
    return getReportRequestsFn({ data: {} })
  },
  component: ReportRequestsPage,
})

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  denied: 'bg-red-100 text-red-800',
  expired: 'bg-gray-100 text-gray-800',
}

const REQUEST_TYPE_LABELS = {
  credit_assessment: 'Credit Assessment',
  production_certificate: 'Production Certificate',
  impact_report: 'Impact Report',
}

function ReportRequestsPage() {
  const router = useRouter()
  const { format: formatDate } = useFormatDate()
  const data = Route.useLoaderData()
  const requests = data.requests

  const [selectedRequest, setSelectedRequest] = useState<any>(null)
  const [actionDialogOpen, setActionDialogOpen] = useState(false)
  const [actionType, setActionType] = useState<'approve' | 'deny'>('approve')
  const [responseMessage, setResponseMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleAction = async () => {
    if (!selectedRequest) return

    setIsSubmitting(true)
    try {
      if (actionType === 'approve') {
        await approveRequestFn({
          data: {
            requestId: selectedRequest.id,
          },
        })
        toast.success('Request approved successfully')
      } else {
        await denyRequestFn({
          data: {
            requestId: selectedRequest.id,
            reason: responseMessage || 'Request denied',
          },
        })
        toast.success('Request denied')
      }

      setActionDialogOpen(false)
      setSelectedRequest(null)
      setResponseMessage('')
      router.invalidate()
    } catch (error) {
      toast.error(`Failed to ${actionType} request`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const openActionDialog = (request: any, type: 'approve' | 'deny') => {
    setSelectedRequest(request)
    setActionType(type)
    setActionDialogOpen(true)
  }

  const columns = [
    {
      accessorKey: 'requesterName',
      header: 'Requester',
      cell: ({ row }: any) => (
        <div>
          <div className="font-medium">{row.original.requesterName}</div>
          <div className="text-sm text-muted-foreground">
            {row.original.requesterEmail}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'reportType',
      header: 'Report Type',
      cell: ({ row }: any) =>
        REQUEST_TYPE_LABELS[
          row.original.reportType as keyof typeof REQUEST_TYPE_LABELS
        ],
    },
    {
      accessorKey: 'purpose',
      header: 'Purpose',
      cell: ({ row }: any) => (
        <div className="max-w-xs truncate" title={row.original.purpose}>
          {row.original.purpose}
        </div>
      ),
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
      accessorKey: 'requestedAt',
      header: 'Requested',
      cell: ({ row }: any) => formatDate(new Date(row.original.requestedAt)),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }: any) => {
        if (row.original.status !== 'pending') return null

        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openActionDialog(row.original, 'approve')}
              className="text-green-600 hover:text-green-700"
            >
              <CheckCircle className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openActionDialog(row.original, 'deny')}
              className="text-red-600 hover:text-red-700"
            >
              <XCircle className="h-4 w-4" />
            </Button>
          </div>
        )
      },
    },
  ]

  const pendingCount = requests.filter((r) => r.status === 'pending').length

  return (
    <div className="space-y-6">
      <PageHeader
        title="Report Requests"
        description="Manage third-party requests for your credit passport reports"
        icon={UserCheck}
      />

      {pendingCount > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-yellow-800">
              <Clock className="h-5 w-5" />
              Pending Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-yellow-700">
              You have {pendingCount} pending request
              {pendingCount !== 1 ? 's' : ''} that require your attention.
            </p>
          </CardContent>
        </Card>
      )}

      <DataTable
        columns={columns}
        data={requests}
        total={data.pagination.total}
        page={data.pagination.page}
        pageSize={data.pagination.pageSize}
        totalPages={data.pagination.totalPages}
        onPaginationChange={() => {}}
        onSortChange={() => {}}
        emptyIcon={<UserCheck className="h-12 w-12 text-muted-foreground" />}
        emptyTitle="No requests found"
        emptyDescription="Third-party requests for your reports will appear here."
      />

      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' ? 'Approve Request' : 'Deny Request'}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'approve'
                ? 'This will generate and share the requested report with the requester.'
                : 'This will decline the request and notify the requester.'}
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <div>
                  <strong>Requester:</strong> {selectedRequest.requesterName}
                </div>
                <div>
                  <strong>Email:</strong> {selectedRequest.requesterEmail}
                </div>
                <div>
                  <strong>Organization:</strong>{' '}
                  {selectedRequest.organization || 'Not specified'}
                </div>
                <div>
                  <strong>Purpose:</strong> {selectedRequest.purpose}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="responseMessage">
                  {actionType === 'approve'
                    ? 'Message (Optional)'
                    : 'Reason for Denial'}
                </Label>
                <Textarea
                  id="responseMessage"
                  placeholder={
                    actionType === 'approve'
                      ? 'Add a message for the requester...'
                      : 'Explain why this request is being denied...'
                  }
                  value={responseMessage}
                  onChange={(e) => setResponseMessage(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setActionDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAction}
              disabled={isSubmitting}
              variant={actionType === 'approve' ? 'default' : 'destructive'}
            >
              {isSubmitting
                ? actionType === 'approve'
                  ? 'Approving...'
                  : 'Denying...'
                : actionType === 'approve'
                  ? 'Approve & Generate'
                  : 'Deny Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
