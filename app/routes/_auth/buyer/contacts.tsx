import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { getMyContactRequestsFn } from '~/features/marketplace/server'
import { RequestCard } from '~/components/marketplace/request-card'

export const Route = createFileRoute('/_auth/buyer/contacts')({
  loader: async () => {
    return getMyContactRequestsFn({ data: {} })
  },
  component: BuyerContactsPage,
})

function BuyerContactsPage() {
  const { t } = useTranslation('marketplace')
  const requests = Route.useLoaderData()

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">
          {t('myContacts', 'My Contact Requests')}
        </h1>
        <p className="text-muted-foreground">
          {t('myContactsDesc', 'Track your conversations with sellers')}
        </p>
      </div>

      {requests.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {t('noContactRequests', "You haven't contacted any sellers yet")}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {requests.map((request: any) => (
            <RequestCard key={request.id} request={request} />
          ))}
        </div>
      )}
    </div>
  )
}
