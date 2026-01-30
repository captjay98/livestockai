import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { PayrollDashboard } from '~/components/digital-foreman/PayrollDashboard'
import { PayrollSkeleton } from '~/components/digital-foreman/payroll-skeleton'
import { ErrorPage } from '~/components/error-page'
import { getPayrollHistoryFn } from '~/features/digital-foreman/server-payroll'

const payrollSearchSchema = z.object({
  farmId: z.string().uuid().optional(),
})

export const Route = createFileRoute('/_auth/payroll')({
  validateSearch: payrollSearchSchema,
  loaderDeps: ({ search }) => ({
    farmId: search.farmId,
  }),
  loader: async ({ deps }) => {
    const periods = await getPayrollHistoryFn({
      data: { farmId: deps.farmId },
    })
    return { periods }
  },
  pendingComponent: PayrollSkeleton,
  errorComponent: ({ error, reset }) => (
    <ErrorPage error={error} reset={reset} />
  ),
  component: PayrollPage,
})

function PayrollPage() {
  const { farmId } = Route.useSearch()
  // Component still uses useQuery internally for reactivity,
  // but loader ensures initial data is available for SSR
  return <PayrollDashboard farmId={farmId} />
}
