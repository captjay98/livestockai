'use client'

import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { MoreHorizontal, Pencil, Trash2, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { getWorkersByFarmFn, removeWorkerFromFarmFn } from '~/features/digital-foreman/server'
import { useFormatCurrency } from '~/features/settings'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '~/components/ui/alert-dialog'

interface WorkerListProps {
  farmId: string
  onAddWorker?: () => void
  onEditWorker?: (workerId: string) => void
}

export function WorkerList({ farmId, onAddWorker, onEditWorker }: WorkerListProps) {
  const queryClient = useQueryClient()
  const { format } = useFormatCurrency()
  const [workerToRemove, setWorkerToRemove] = useState<{ id: string; profileId: string; name: string } | null>(null)

  const { data: workers = [], isLoading } = useQuery({
    queryKey: ['workers', farmId],
    queryFn: () => getWorkersByFarmFn({ data: { farmId } }),
    enabled: !!farmId,
  })

  const removeWorker = useMutation({
    mutationFn: removeWorkerFromFarmFn,
    onSuccess: () => {
      toast.success('Worker removed from farm')
      queryClient.invalidateQueries({ queryKey: ['workers', farmId] })
      setWorkerToRemove(null)
    },
    onError: () => toast.error('Failed to remove worker'),
  })

  if (isLoading) return <div>Loading...</div>

  const statusColors = {
    active: 'default',
    inactive: 'secondary',
    terminated: 'destructive',
  } as const

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Workers</CardTitle>
          {onAddWorker && (
            <Button onClick={onAddWorker} className="min-h-[48px]">
              <UserPlus className="h-4 w-4 mr-2" />
              Add Worker
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {workers.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No workers found. Add your first worker to get started.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Wage Rate</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workers.map((worker) => (
                  <TableRow key={worker.id}>
                    <TableCell className="font-medium">{worker.userName || 'Unknown'}</TableCell>
                    <TableCell>{worker.phone || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={statusColors[worker.employmentStatus]}>
                        {worker.employmentStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(worker.wageRateAmount || 0)}/{worker.wageRateType}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger>
                          <Button variant="ghost" size="sm" className="h-10 w-10 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Link to="/workers/$workerId" params={{ workerId: worker.userId }}>
                              View Profile
                            </Link>
                          </DropdownMenuItem>
                          {onEditWorker && (
                            <DropdownMenuItem onClick={() => onEditWorker(worker.userId)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setWorkerToRemove({ id: worker.userId, profileId: worker.id, name: worker.userName || 'Unknown' })}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remove
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!workerToRemove} onOpenChange={() => setWorkerToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Worker</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {workerToRemove?.name} from this farm? Their historical data will be preserved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => workerToRemove && removeWorker.mutate({ data: { profileId: workerToRemove.profileId } })}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
