import { Link, createFileRoute  } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { getWorkersByFarmFn } from '~/features/digital-foreman/server'
import { useUserSettings } from '~/features/settings/use-user-settings'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'

export const Route = createFileRoute('/_auth/workers/')({
  component: WorkersListPage,
})

function WorkersListPage() {
  const { settings } = useUserSettings()
  const farmId = settings.defaultFarmId
  const { data: workers = [], isLoading } = useQuery({
    queryKey: ['workers', farmId],
    queryFn: () => farmId ? getWorkersByFarmFn({ data: { farmId } }) : Promise.resolve([]),
    enabled: !!farmId,
  })

  if (!farmId) return <div>Please select a farm first</div>
  if (isLoading) return <div>Loading...</div>

  return (
    <Card>
      <CardHeader>
        <CardTitle>Workers</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Rate</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {workers.map((worker) => (
              <TableRow key={worker.id}>
                <TableCell>{worker.userName || 'Unknown'}</TableCell>
                <TableCell>{worker.phone}</TableCell>
                <TableCell>
                  <Badge variant={worker.employmentStatus === 'active' ? 'default' : 'secondary'}>
                    {worker.employmentStatus}
                  </Badge>
                </TableCell>
                <TableCell>{worker.wageRateAmount}/{worker.wageRateType}</TableCell>
                <TableCell>
                  <Link to="/workers/$workerId" params={{ workerId: worker.userId }}>
                    <Button size="sm" variant="outline">View</Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
