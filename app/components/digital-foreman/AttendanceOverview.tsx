'use client'

import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { endOfMonth, format, startOfMonth } from 'date-fns'
import { Download } from 'lucide-react'
import { toast } from 'sonner'
import { getAttendanceByFarmFn } from '~/features/digital-foreman/server'
import { exportAttendanceCsvFn } from '~/features/digital-foreman/server-payroll'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table'

interface AttendanceOverviewProps {
  farmId: string
}

export function AttendanceOverview({ farmId }: AttendanceOverviewProps) {
  const [exportRange] = useState({
    start: startOfMonth(new Date()),
    end: endOfMonth(new Date()),
  })

  const { data: attendance = [], isLoading } = useQuery({
    queryKey: ['attendance', farmId],
    queryFn: () => getAttendanceByFarmFn({ data: { farmId } }),
    enabled: !!farmId,
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
      toast.success('Attendance exported')
    },
    onError: () => toast.error('Export failed'),
  })

  if (isLoading) return <div>Loading...</div>

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Today's Attendance</CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={() => exportCsv.mutate()}
          disabled={exportCsv.isPending}
        >
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Worker</TableHead>
              <TableHead>Check In</TableHead>
              <TableHead>Check Out</TableHead>
              <TableHead>Hours</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {attendance.map((record) => (
              <TableRow key={record.id}>
                <TableCell>{record.workerName || 'Unknown'}</TableCell>
                <TableCell>
                  {format(new Date(record.checkInTime), 'HH:mm')}
                </TableCell>
                <TableCell>
                  {record.checkOutTime
                    ? format(new Date(record.checkOutTime), 'HH:mm')
                    : '-'}
                </TableCell>
                <TableCell>{record.hoursWorked || '-'}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      record.verificationStatus === 'verified'
                        ? 'default'
                        : 'secondary'
                    }
                  >
                    {record.verificationStatus}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
