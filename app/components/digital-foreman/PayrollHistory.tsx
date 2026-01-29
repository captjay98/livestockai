'use client'

import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { Calendar } from 'lucide-react'
import { getPayrollHistoryFn } from '~/features/digital-foreman/server-payroll'
import { useFormatCurrency } from '~/features/settings'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table'

interface PayrollHistoryProps {
  farmId: string
  onSelectPeriod?: (periodId: string) => void
  selectedPeriodId?: string
}

export function PayrollHistory({
  farmId,
  onSelectPeriod,
  selectedPeriodId,
}: PayrollHistoryProps) {
  const { format: formatCurrency } = useFormatCurrency()

  const { data: periods = [], isLoading } = useQuery({
    queryKey: ['payroll-history', farmId],
    queryFn: () => getPayrollHistoryFn({ data: { farmId } }),
    enabled: !!farmId,
  })

  if (isLoading) return <div>Loading...</div>

  if (periods.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Payroll History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">
            No payroll periods found
          </p>
        </CardContent>
      </Card>
    )
  }

  const statusColors = {
    draft: 'secondary',
    active: 'default',
    closed: 'outline',
  } as const

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Payroll History
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Period</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Total Wages</TableHead>
              <TableHead className="text-right">Total Paid</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {periods.map((period) => (
              <TableRow
                key={period.id}
                className={`cursor-pointer hover:bg-muted/50 ${selectedPeriodId === period.id ? 'bg-muted' : ''}`}
                onClick={() => onSelectPeriod?.(period.id)}
              >
                <TableCell>
                  <div className="font-medium">
                    {format(new Date(period.startDate), 'MMM d')} -{' '}
                    {format(new Date(period.endDate), 'MMM d, yyyy')}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="capitalize">
                    {period.periodType}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      statusColors[period.status as keyof typeof statusColors]
                    }
                  >
                    {period.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency((period as any).totalWages || 0)}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency((period as any).totalPaid || 0)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
