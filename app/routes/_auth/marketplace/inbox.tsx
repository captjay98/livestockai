import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { toast } from 'sonner'
import { getContactRequestsFn, respondToRequestFn } from '~/features/marketplace/server'
import { ContactInbox } from '~/components/marketplace/contact-inbox'

const inboxSearchSchema = z.object({
  status: z.enum(['pending', 'approved', 'denied', 'all']).default('pending'),
  page: z.number().int().positive().default(1),
})

export const Route = createFileRoute('/_auth/marketplace/inbox' as const)({
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
  component: InboxPage,
})

function InboxPage() {
  const { t } = useTranslation('marketplace')
  const queryClient = useQueryClient()
  const { status, page } = Route.useSearch()
  const data = Route.useLoaderData()

  const respondMutation = useMutation({
    mutationFn: respondToRequestFn,
    onSuccess: () => {
      toast.success('Response sent successfully')
      queryClient.invalidateQueries({ queryKey: ['contact-requests'] })
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to respond to request')
    },
  })

  const handleRespond = (requestId: string, approved: boolean, responseMessage?: string) => {
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

      <ContactInbox
        data={data}
        currentStatus={status}
        currentPage={page}
        onRespond={handleRespond}
        isLoading={respondMutation.isPending}
      />
    </div>
  )
}