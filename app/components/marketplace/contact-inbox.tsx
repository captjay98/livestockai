import { useTranslation } from 'react-i18next'
import { RequestCard } from './request-card'
import type { ContactRequestRecord } from '~/features/marketplace/repository'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'

interface ContactInboxProps {
  requests: Array<ContactRequestRecord>
  onRespond: (requestId: string, approved: boolean, message?: string) => void
}

export function ContactInbox({ requests, onRespond }: ContactInboxProps) {
  const { t } = useTranslation('marketplace')
  const pendingRequests = requests.filter((r) => r.status === 'pending')
  const approvedRequests = requests.filter((r) => r.status === 'approved')
  const deniedRequests = requests.filter((r) => r.status === 'denied')

  return (
    <Tabs defaultValue="pending" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="pending">
          {t('inbox.pending')} ({pendingRequests.length})
        </TabsTrigger>
        <TabsTrigger value="approved">
          {t('inbox.approved')} ({approvedRequests.length})
        </TabsTrigger>
        <TabsTrigger value="denied">
          {t('inbox.denied')} ({deniedRequests.length})
        </TabsTrigger>
        <TabsTrigger value="all">
          {t('inbox.all')} ({requests.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="pending" className="space-y-4">
        {pendingRequests.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            {t('inbox.noPendingRequests')}
          </p>
        ) : (
          pendingRequests.map((request) => (
            <RequestCard
              key={request.id}
              request={request}
              onApprove={(message) => onRespond(request.id, true, message)}
              onDeny={(message) => onRespond(request.id, false, message)}
            />
          ))
        )}
      </TabsContent>

      <TabsContent value="approved" className="space-y-4">
        {approvedRequests.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            {t('inbox.noApprovedRequests')}
          </p>
        ) : (
          approvedRequests.map((request) => (
            <RequestCard key={request.id} request={request} />
          ))
        )}
      </TabsContent>

      <TabsContent value="denied" className="space-y-4">
        {deniedRequests.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            {t('inbox.noDeniedRequests')}
          </p>
        ) : (
          deniedRequests.map((request) => (
            <RequestCard key={request.id} request={request} />
          ))
        )}
      </TabsContent>

      <TabsContent value="all" className="space-y-4">
        {requests.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            {t('inbox.noContactRequests')}
          </p>
        ) : (
          requests.map((request) => (
            <RequestCard
              key={request.id}
              request={request}
              onApprove={
                request.status === 'pending'
                  ? (message) => onRespond(request.id, true, message)
                  : undefined
              }
              onDeny={
                request.status === 'pending'
                  ? (message) => onRespond(request.id, false, message)
                  : undefined
              }
            />
          ))
        )}
      </TabsContent>
    </Tabs>
  )
}
