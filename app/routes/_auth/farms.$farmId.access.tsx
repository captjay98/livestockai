import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Check, Clock, Eye, EyeOff, UserMinus, X } from 'lucide-react'
import {
  getAccessRequestsFn,
  respondToAccessRequestFn,
  revokeAccessFn,
} from '~/features/extension/server'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'
import { ErrorPage } from '~/components/error-page'
import { DataTableSkeleton } from '~/components/ui/data-table-skeleton'

export const Route = createFileRoute('/_auth/farms/$farmId/access')({
  component: AccessManagementPage,
  loader: ({ params }) => {
    return getAccessRequestsFn({ data: { farmId: params.farmId } })
  },
  pendingComponent: DataTableSkeleton,
  errorComponent: ({ error, reset }) => (
    <ErrorPage error={error} reset={reset} />
  ),
})

function AccessManagementPage() {
  const { t } = useTranslation(['common', 'farms'])
  const { farmId } = Route.useParams()
  const { pendingRequests, activeGrants } = Route.useLoaderData()
  const queryClient = useQueryClient()

  const respondMutation = useMutation({
    mutationFn: respondToAccessRequestFn,
    onSuccess: (_, variables) => {
      const action = variables.data.approved ? 'approved' : 'denied'
      toast.success(t(`Access request ${action}`))
      queryClient.invalidateQueries({
        queryKey: ['access-requests', farmId],
      })
    },
    onError: () => {
      toast.error(t('Failed to respond to request'))
    },
  })

  const revokeMutation = useMutation({
    mutationFn: revokeAccessFn,
    onSuccess: () => {
      toast.success(t('Access revoked'))
      queryClient.invalidateQueries({
        queryKey: ['access-requests', farmId],
      })
    },
    onError: () => {
      toast.error(t('Failed to revoke access'))
    },
  })

  const handleRespond = (requestId: string, approved: boolean) => {
    respondMutation.mutate({ data: { requestId, approved } })
  }

  const handleRevoke = (grantId: string) => {
    revokeMutation.mutate({ data: { grantId } })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('Access Management')}</h1>
        <p className="text-muted-foreground">
          {t('Manage farm access requests and permissions')}
        </p>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList>
          <TabsTrigger value="pending">
            {t('Pending Requests')} ({pendingRequests.length})
          </TabsTrigger>
          <TabsTrigger value="active">
            {t('Active Grants')} ({activeGrants.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingRequests.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                {t('No pending requests')}
              </CardContent>
            </Card>
          ) : (
            pendingRequests.map((request: any) => (
              <Card key={request.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{request.requesterName}</span>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleRespond(request.id, true)}
                        disabled={respondMutation.isPending}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        {t('Approve')}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRespond(request.id, false)}
                        disabled={respondMutation.isPending}
                      >
                        <X className="h-4 w-4 mr-1" />
                        {t('Deny')}
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p>
                      <strong>{t('Purpose')}:</strong> {request.purpose}
                    </p>
                    <p>
                      <strong>{t('Duration')}:</strong>{' '}
                      {request.requestedDuration} days
                    </p>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm text-muted-foreground">
                        {t('Requested')}{' '}
                        {new Date(request.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          {activeGrants.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                {t('No active grants')}
              </CardContent>
            </Card>
          ) : (
            activeGrants.map((grant: any) => (
              <Card key={grant.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{grant.userName}</span>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleRevoke(grant.id)}
                      disabled={revokeMutation.isPending}
                    >
                      <UserMinus className="h-4 w-4 mr-1" />
                      {t('Revoke')}
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          grant.hasFinancialAccess ? 'default' : 'secondary'
                        }
                      >
                        {grant.hasFinancialAccess ? (
                          <Eye className="h-3 w-3 mr-1" />
                        ) : (
                          <EyeOff className="h-3 w-3 mr-1" />
                        )}
                        {grant.hasFinancialAccess
                          ? t('Financial Access')
                          : t('Basic Access')}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {t('Expires')}:{' '}
                      {new Date(grant.expiresAt).toLocaleDateString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
