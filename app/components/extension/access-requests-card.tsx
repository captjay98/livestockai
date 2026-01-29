import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { CheckCircle2, Clock, RefreshCw, Shield, XCircle } from 'lucide-react'
import { ApproveAccessDialog } from './approve-access-dialog'
import { DenyAccessDialog } from './deny-access-dialog'
import { RevokeAccessDialog } from './revoke-access-dialog'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { Skeleton } from '~/components/ui/skeleton'
import { getAccessRequestsFn } from '~/features/extension/server'

interface AccessRequestsCardProps {
  farmId: string
}

export function AccessRequestsCard({ farmId }: AccessRequestsCardProps) {
  const queryClient = useQueryClient()
  const [approveDialogOpen, setApproveDialogOpen] = useState(false)
  const [denyDialogOpen, setDenyDialogOpen] = useState(false)
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false)
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(
    null,
  )
  const [selectedGrantId, setSelectedGrantId] = useState<string | null>(null)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['access-requests', farmId],
    queryFn: () => getAccessRequestsFn({ data: { farmId } }),
  })

  const handleApprove = (requestId: string) => {
    setSelectedRequestId(requestId)
    setApproveDialogOpen(true)
  }

  const handleDeny = (requestId: string) => {
    setSelectedRequestId(requestId)
    setDenyDialogOpen(true)
  }

  const handleRevoke = (grantId: string) => {
    setSelectedGrantId(grantId)
    setRevokeDialogOpen(true)
  }

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['access-requests', farmId] })
    setApproveDialogOpen(false)
    setDenyDialogOpen(false)
    setRevokeDialogOpen(false)
    setSelectedRequestId(null)
    setSelectedGrantId(null)
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Access Requests
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    )
  }

  const pendingRequests = data?.pendingRequests || []
  const activeGrants = data?.activeGrants || []

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Access Requests
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetch()}
              className="h-8 w-8 p-0"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Pending Requests */}
          <div>
            <h3 className="mb-3 text-sm font-semibold">
              PENDING REQUESTS ({pendingRequests.length})
            </h3>
            {pendingRequests.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No pending access requests
              </p>
            ) : (
              <div className="space-y-3">
                {pendingRequests.map((request) => (
                  <Card
                    key={request.id}
                    className="border-amber-200 bg-amber-50/50"
                  >
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium">
                              {request.requesterName}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {request.requesterEmail}
                            </p>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(request.createdAt), 'MMM d')}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm">
                            <span className="font-medium">Purpose:</span>{' '}
                            {request.purpose}
                          </p>
                          <p className="text-sm">
                            <span className="font-medium">Duration:</span>{' '}
                            {request.requestedDurationDays} days
                          </p>
                        </div>
                        <div className="flex gap-2 pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeny(request.id)}
                            className="flex-1"
                          >
                            <XCircle className="mr-2 h-4 w-4" />
                            Deny
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleApprove(request.id)}
                            className="flex-1"
                          >
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Approve
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Active Grants */}
          <div>
            <h3 className="mb-3 text-sm font-semibold">
              ACTIVE GRANTS ({activeGrants.length})
            </h3>
            {activeGrants.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No active access grants
              </p>
            ) : (
              <div className="space-y-3">
                {activeGrants.map((grant) => (
                  <Card key={grant.id}>
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium">{grant.agentName}</p>
                            <p className="text-sm text-muted-foreground">
                              {grant.agentEmail}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Granted:{' '}
                            {format(new Date(grant.grantedAt), 'MMM d, yyyy')}
                          </span>
                          <span>•</span>
                          <span>
                            Expires:{' '}
                            {format(new Date(grant.expiresAt), 'MMM d, yyyy')}
                          </span>
                          <span>•</span>
                          <Badge
                            variant={
                              grant.financialVisibility
                                ? 'default'
                                : 'secondary'
                            }
                            className="h-5"
                          >
                            💰 Financial:{' '}
                            {grant.financialVisibility ? 'Yes' : 'No'}
                          </Badge>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleRevoke(grant.id)}
                          className="w-full"
                        >
                          Revoke Access
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      {selectedRequestId && (
        <>
          <ApproveAccessDialog
            open={approveDialogOpen}
            onOpenChange={setApproveDialogOpen}
            requestId={selectedRequestId}
            onSuccess={handleSuccess}
          />
          <DenyAccessDialog
            open={denyDialogOpen}
            onOpenChange={setDenyDialogOpen}
            requestId={selectedRequestId}
            onSuccess={handleSuccess}
          />
        </>
      )}
      {selectedGrantId && (
        <RevokeAccessDialog
          open={revokeDialogOpen}
          onOpenChange={setRevokeDialogOpen}
          grantId={selectedGrantId}
          onSuccess={handleSuccess}
        />
      )}
    </>
  )
}
