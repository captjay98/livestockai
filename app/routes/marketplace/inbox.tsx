import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { toast } from 'sonner'
import { checkAuthFn } from '~/features/auth/server'
import {
  getContactRequestsFn,
  respondToRequestFn,
} from '~/features/marketplace/server'
import { ContactInbox } from '~/components/marketplace/contact-inbox'
import { DataTableSkeleton } from '~/components/ui/data-table-skeleton'
import { ErrorPage } from '~/components/error-page'

const inboxSearchSchema = z.object({
  status: z.enum(['pending', 'approved', 'denied', 'all']).default('pending'),
  page: z.number().int().positive().default(1),
})

export const Route = createFileRoute('/marketplace/inbox')({
  beforeLoad: async () => {
    await checkAuthFn({ data: {} })
  },
  validateSearch: inboxSearchSchema,
  loaderDeps: ({ search }) => ({ status: search.status, page: search.page }),
  loader: async ({ deps }) => {
    return getContactRequestsFn({
      data: {
        status: deps.status,
        page: deps.page,
        pageSize: 20,
      },
    })
  },
  pendingComponent: DataTableSkeleton,
  errorComponent: ({ error }) => <ErrorPage error={error} />,
  component: InboxPage,
})

function InboxPage() {
  const { t } = useTranslation('marketplace')
  const queryClient = useQueryClient()
  Route.useSearch()
  const data = Route.useLoaderData()

  const respondMutation = useMutation({
    mutationFn: respondToRequestFn,
    onSuccess: () => {
      toast.success(
        t('marketplace:messages.responseSent', {
          defaultValue: 'Response sent successfully',
        }),
      )
      queryClient.invalidateQueries({ queryKey: ['contact-requests'] })
    },
    onError: (error: Error) => {
      toast.error(
        error.message ||
          t('marketplace:messages.respondFailed', {
            defaultValue: 'Failed to respond to request',
          }),
      )
    },
  })

  const handleRespond = (
    requestId: string,
    approved: boolean,
    responseMessage?: string,
  ) => {
    respondMutation.mutate({
      data: {
        requestId,
        approved,
        responseMessage,
      },
    })
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{t('contactRequests')}</h1>
        <p className="text-muted-foreground">
          {t('contactRequestsDescription')}
        </p>
      </div>

      <ContactInbox requests={data.data} onRespond={handleRespond} />
    </div>
  )
}
