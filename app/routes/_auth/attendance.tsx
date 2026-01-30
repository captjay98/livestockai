import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { AttendanceOverview } from '~/components/digital-foreman/AttendanceOverview'
import { AttendanceSkeleton } from '~/components/digital-foreman/attendance-skeleton'
import { ErrorPage } from '~/components/error-page'
import { getAttendanceByFarmFn } from '~/features/digital-foreman/server'

const attendanceSearchSchema = z.object({
  farmId: z.string().uuid().optional(),
})

export const Route = createFileRoute('/_auth/attendance')({
  validateSearch: attendanceSearchSchema,
  loaderDeps: ({ search }) => ({
    farmId: search.farmId,
  }),
  loader: async ({ deps }) => {
    const attendance = await getAttendanceByFarmFn({
      data: { farmId: deps.farmId },
    })
    return { attendance }
  },
  pendingComponent: AttendanceSkeleton,
  errorComponent: ({ error, reset }) => (
    <ErrorPage error={error} reset={reset} />
  ),
  component: AttendancePage,
})

function AttendancePage() {
  const { farmId } = Route.useSearch()
  // Component still uses useQuery internally for reactivity,
  // but loader ensures initial data is available for SSR
  return <AttendanceOverview farmId={farmId} />
}
