import { createFileRoute } from '@tanstack/react-router'
import { Shield, UserPlus } from 'lucide-react'
import { useState } from 'react'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { PageHeader } from '~/components/page-header'
import { AssignmentTable } from '~/components/extension/admin/assignment-table'
import { AssignUserDialog } from '~/components/extension/admin/assign-user-dialog'
import { getDistrictAssignmentsFn } from '~/features/extension/admin-server'
import { DataTableSkeleton } from '~/components/ui/data-table-skeleton'
import { ErrorPage } from '~/components/error-page'

const validateSearch = z.object({
  search: z.string().optional(),
  districtId: z.string().optional(),
})

export const Route = createFileRoute('/_auth/admin/extension/assignments')({
  validateSearch,
  loader: async () => {
    return getDistrictAssignmentsFn()
  },
  pendingComponent: () => <DataTableSkeleton />,
  errorComponent: ({ error, reset }) => (
    <ErrorPage error={error} reset={reset} />
  ),
  component: DistrictAssignmentsPage,
})

function DistrictAssignmentsPage() {
  const { t } = useTranslation(['extension', 'common'])
  const { assignments, districts } = Route.useLoaderData()
  const searchParams = Route.useSearch()
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState(searchParams.search || '')

  // Filter assignments based on search
  const filteredAssignments = assignments.filter((assignment: any) => {
    const matchesSearch =
      !searchTerm ||
      assignment.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.userEmail.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesDistrict =
      !searchParams.districtId ||
      assignment.districts.some(
        (d: any) => d.districtId === searchParams.districtId,
      )

    return matchesSearch && matchesDistrict
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('extension:districtAssignments', {
          defaultValue: 'District Assignments',
        })}
        description={t('extension:assignmentsDescription', {
          defaultValue: 'Manage extension worker assignments to districts',
        })}
        icon={Shield}
        actions={
          <Button onClick={() => setIsAssignDialogOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            {t('extension:assignUser', { defaultValue: 'Assign User' })}
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>
            {t('extension:searchFilter', { defaultValue: 'Search & Filter' })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              placeholder={t('extension:searchByNameEmail', {
                defaultValue: 'Search by name or email...',
              })}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
          </div>
        </CardContent>
      </Card>

      <AssignmentTable assignments={filteredAssignments} />

      <AssignUserDialog
        open={isAssignDialogOpen}
        onOpenChange={setIsAssignDialogOpen}
        districts={districts}
      />
    </div>
  )
}
