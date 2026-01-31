import { Link, createFileRoute } from '@tanstack/react-router'
import { ArrowRight, Plus, Users } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getWorkersByFarmFn } from '~/features/digital-foreman/server'
import { useFarm } from '~/features/farms/context'
import { cn } from '~/lib/utils'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card, CardContent } from '~/components/ui/card'
import { WorkerFormDialog } from '~/components/workers/worker-form-dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table'
import { PageHeader } from '~/components/page-header'
import { WorkerSkeleton } from '~/components/workers/worker-skeleton'
import { ErrorPage } from '~/components/error-page'

export const Route = createFileRoute('/_auth/workers/')({
  loader: async () => {
    return getWorkersByFarmFn({ data: {} })
  },
  pendingComponent: WorkerSkeleton,
  errorComponent: ({ error, reset }) => (
    <ErrorPage error={error} reset={reset} />
  ),
  component: WorkersListPage,
})

function WorkersListPage() {
  const { t } = useTranslation(['workers', 'common'])
  const { selectedFarmId } = useFarm()
  const [createWorkerDialogOpen, setCreateWorkerDialogOpen] = useState(false)
  const allWorkers = Route.useLoaderData()

  // Filter workers by selected farm
  const workers = useMemo(() => {
    if (!selectedFarmId) return allWorkers
    return allWorkers.filter((w) => w.farmId === selectedFarmId)
  }, [allWorkers, selectedFarmId])

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('workers:staffLabor', { defaultValue: 'Staff & Labor' })}
        description={t('workers:description', {
          defaultValue:
            'Manage your farm workers, employment status, and wage rates.',
        })}
        icon={Users}
        actions={
          <Button onClick={() => setCreateWorkerDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {t('workers:addWorker', { defaultValue: 'Add Worker' })}
          </Button>
        }
      />

      <WorkerFormDialog
        open={createWorkerDialogOpen}
        onOpenChange={setCreateWorkerDialogOpen}
      />

      <Card className="bg-white/30 dark:bg-black/80 backdrop-blur-2xl border-white/20 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden border">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-white/40 dark:bg-white/5">
              <TableRow className="hover:bg-transparent border-white/10">
                <TableHead className="font-bold text-foreground py-4 h-12">
                  Name
                </TableHead>
                <TableHead className="font-bold text-foreground py-4 h-12">
                  Phone
                </TableHead>
                <TableHead className="font-bold text-foreground py-4 h-12">
                  Status
                </TableHead>
                <TableHead className="font-bold text-foreground py-4 h-12">
                  Rate
                </TableHead>
                <TableHead className="py-4 h-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <Users className="h-10 w-10 mb-2 opacity-20" />
                      <p className="font-medium">
                        {t('workers:noWorkersFound', {
                          defaultValue: 'No workers found',
                        })}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                workers.map((worker) => (
                  <TableRow
                    key={worker.id}
                    className="hover:bg-white/20 dark:hover:bg-white/5 border-white/5 transition-colors group"
                  >
                    <TableCell className="font-bold py-4">
                      {worker.userName}
                    </TableCell>
                    <TableCell className="text-muted-foreground py-4 font-medium">
                      {worker.phone}
                    </TableCell>
                    <TableCell className="py-4">
                      <Badge
                        variant={
                          worker.employmentStatus === 'active'
                            ? 'default'
                            : 'secondary'
                        }
                        className={cn(
                          'rounded-full px-3 py-0.5 text-[10px] font-black uppercase tracking-widest',
                          worker.employmentStatus === 'active'
                            ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]'
                            : 'bg-muted/50 text-muted-foreground',
                        )}
                      >
                        {worker.employmentStatus}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-4 font-black text-sm whitespace-nowrap">
                      {worker.wageRateAmount}{' '}
                      <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">
                        / {worker.wageRateType}
                      </span>
                    </TableCell>
                    <TableCell className="py-4 text-right">
                      <Link
                        to="/workers/$workerId"
                        params={{ workerId: worker.userId }}
                      >
                        <Button
                          size="sm"
                          variant="ghost"
                          className="rounded-xl font-bold hover:bg-primary/10 hover:text-primary transition-all"
                        >
                          View Details
                          <ArrowRight className="h-4 w-4 ml-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
