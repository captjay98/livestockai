import { Shield, Trash2, UserCheck } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import {
  removeUserFromDistrictFn,
  toggleSupervisorStatusFn,
} from '~/features/extension/admin-server'
import { useErrorMessage } from '~/hooks/useErrorMessage'

interface Assignment {
  userId: string
  userName: string
  userEmail: string
  districts: Array<{
    districtId: string
    districtName: string
    isSupervisor: boolean
    assignedAt: string
  }>
}

interface AssignmentTableProps {
  assignments: Array<Assignment>
  districts: Array<{ id: string; name: string }>
}

export function AssignmentTable({
  assignments,
  districts,
}: AssignmentTableProps) {
  const queryClient = useQueryClient()
  const getErrorMessage = useErrorMessage()

  const removeMutation = useMutation({
    mutationFn: (data: { userId: string; districtId: string }) =>
      removeUserFromDistrictFn({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['district-assignments'] })
      toast.success('User removed from district')
    },
    onError: (error) => {
      toast.error(getErrorMessage(error))
    },
  })

  const toggleSupervisorMutation = useMutation({
    mutationFn: (data: { userId: string; districtId: string }) =>
      toggleSupervisorStatusFn({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['district-assignments'] })
      toast.success('Supervisor status updated')
    },
    onError: (error) => {
      toast.error(getErrorMessage(error))
    },
  })

  if (assignments.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">No assignments found</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Assignments ({assignments.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Districts</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assignments.map((assignment) => (
              <TableRow key={assignment.userId}>
                <TableCell className="font-medium">
                  {assignment.userName}
                </TableCell>
                <TableCell>{assignment.userEmail}</TableCell>
                <TableCell>
                  {assignment.districts.length === 0 ? (
                    <span className="text-sm text-muted-foreground">
                      No districts
                    </span>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {assignment.districts.map((district) => (
                        <div
                          key={district.districtId}
                          className="flex items-center gap-2"
                        >
                          <Badge
                            variant={
                              district.isSupervisor ? 'default' : 'secondary'
                            }
                          >
                            {district.districtName}
                            {district.isSupervisor && (
                              <Shield className="h-3 w-3 ml-1" />
                            )}
                          </Badge>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() =>
                                toggleSupervisorMutation.mutate({
                                  userId: assignment.userId,
                                  districtId: district.districtId,
                                })
                              }
                              disabled={toggleSupervisorMutation.isPending}
                              title="Toggle supervisor status"
                            >
                              <UserCheck className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-destructive"
                              onClick={() =>
                                removeMutation.mutate({
                                  userId: assignment.userId,
                                  districtId: district.districtId,
                                })
                              }
                              disabled={removeMutation.isPending}
                              title="Remove from district"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <span className="text-sm text-muted-foreground">
                    {assignment.districts.length} district
                    {assignment.districts.length !== 1 ? 's' : ''}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
