import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery } from '@tanstack/react-query'
import { endOfMonth, format, startOfMonth } from 'date-fns'
import { Download, Users } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '~/lib/utils'
import { getAttendanceByFarmFn } from '~/features/digital-foreman/server'
import { exportAttendanceCsvFn } from '~/features/digital-foreman/server-payroll'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { PageHeader } from '~/components/page-header'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table'

interface AttendanceOverviewProps {
  farmId?: string
}

export function AttendanceOverview({ farmId }: AttendanceOverviewProps) {
  const { t } = useTranslation(['digitalForeman'])
  const [exportRange] = useState({
    start: startOfMonth(new Date()),
    end: endOfMonth(new Date()),
  })

  const { data: attendance = [], isLoading } = useQuery({
    queryKey: ['attendance', farmId ?? 'all'],
    queryFn: () => getAttendanceByFarmFn({ data: { farmId } }),
  })

  const exportCsv = useMutation({
    mutationFn: () =>
      exportAttendanceCsvFn({
        data: {
          farmId,
          startDate: exportRange.start,
          endDate: exportRange.end,
        },
      }),
    onSuccess: (result) => {
      const blob = new Blob([result.csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = result.filename
      a.click()
      URL.revokeObjectURL(url)
      toast.success(
        t('digitalForeman:messages.attendanceExported', {
          defaultValue: 'Attendance exported',
        }),
      )
    },
    onError: () =>
      toast.error(
        t('digitalForeman:messages.exportFailed', {
          defaultValue: 'Export failed',
        }),
      ),
  })

  if (isLoading)
    return (
      <div className="p-8 flex items-center justify-center text-muted-foreground font-black uppercase tracking-widest animate-pulse">
        {t('common:loading')}
      </div>
    )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance Tracking"
        description="Monitor worker presence, check-in times, and verification status across your farm."
        icon={Users}
        actions={
          <Button
            variant="outline"
            onClick={() => exportCsv.mutate()}
            disabled={exportCsv.isPending}
            className="rounded-xl font-bold bg-white/50 dark:bg-white/5 border-white/20 hover:bg-white/80 dark:hover:bg-white/10 shadow-sm"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        }
      />

      <Card className="bg-white/30 dark:bg-black/80 backdrop-blur-2xl border-white/20 dark:border-white/10 shadow-2xl rounded-3xl overflow-hidden relative border min-h-[400px]">
        {/* Decorative Orbs */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <CardHeader className="pb-2 relative z-10 border-b border-white/10">
          <CardTitle className="text-xl font-black tracking-tight">
            Today's Log
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 relative z-10">
          <Table>
            <TableHeader className="bg-white/40 dark:bg-white/5">
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="font-black uppercase tracking-widest text-[10px] text-muted-foreground h-12">
                  Worker
                </TableHead>
                <TableHead className="font-black uppercase tracking-widest text-[10px] text-muted-foreground h-12">
                  Check In
                </TableHead>
                <TableHead className="font-black uppercase tracking-widest text-[10px] text-muted-foreground h-12">
                  Check Out
                </TableHead>
                <TableHead className="font-black uppercase tracking-widest text-[10px] text-muted-foreground h-12">
                  Hours
                </TableHead>
                <TableHead className="font-black uppercase tracking-widest text-[10px] text-muted-foreground h-12">
                  Status
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attendance.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center opacity-40">
                      <Users className="h-12 w-12 mb-4" />
                      <p className="font-bold uppercase tracking-widest text-xs text-muted-foreground">
                        No records for today
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                attendance.map((record) => (
                  <TableRow
                    key={record.id}
                    className="border-white/10 hover:bg-white/20 dark:hover:bg-white/5 transition-colors group"
                  >
                    <TableCell className="font-bold py-4">
                      {record.workerName || 'Unknown'}
                    </TableCell>
                    <TableCell className="font-medium text-muted-foreground">
                      {format(new Date(record.checkInTime), 'HH:mm')}
                    </TableCell>
                    <TableCell className="font-medium text-muted-foreground">
                      {record.checkOutTime ? (
                        format(new Date(record.checkOutTime), 'HH:mm')
                      ) : (
                        <span className="text-emerald-500/60 font-black animate-pulse uppercase text-[10px] tracking-tighter">
                          Active
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="font-black text-primary/80">
                      {record.hoursWorked || '-'}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          record.verificationStatus === 'verified'
                            ? 'default'
                            : 'secondary'
                        }
                        className={cn(
                          'rounded-lg px-2 py-0.5 font-black uppercase tracking-tighter text-[10px] shadow-sm',
                          record.verificationStatus === 'verified'
                            ? 'bg-emerald-500 shadow-emerald-500/20'
                            : 'bg-muted shadow-inner',
                        )}
                      >
                        {record.verificationStatus}
                      </Badge>
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
