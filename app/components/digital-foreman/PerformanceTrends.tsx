'use client'

import { Minus, TrendingDown, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '~/components/ui/select'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '~/components/ui/table'

export interface TrendDataPoint {
    period: string
    taskCompletionRate: number
    attendanceRate: number
    approvalRate: number
}

export interface WorkerTrendData {
    workerId: string
    workerName: string
    trends: Array<TrendDataPoint>
    currentPeriod: TrendDataPoint
    previousPeriod?: TrendDataPoint
}

interface PerformanceTrendsProps {
    workers: Array<WorkerTrendData>
    periodType: 'weekly' | 'monthly'
    onPeriodTypeChange: (type: 'weekly' | 'monthly') => void
}

function TrendIndicator({
    current,
    previous,
}: {
    current: number
    previous?: number
}) {
    if (previous === undefined) {
        return <Minus className="h-4 w-4 text-muted-foreground" />
    }

    const diff = current - previous
    if (Math.abs(diff) < 1) {
        return <Minus className="h-4 w-4 text-muted-foreground" />
    }

    if (diff > 0) {
        return (
            <span className="flex items-center text-green-600 text-xs">
                <TrendingUp className="h-4 w-4 mr-1" />+{diff.toFixed(0)}%
            </span>
        )
    }

    return (
        <span className="flex items-center text-red-600 text-xs">
            <TrendingDown className="h-4 w-4 mr-1" />
            {diff.toFixed(0)}%
        </span>
    )
}

function MetricCell({
    value,
    previousValue,
}: {
    value: number
    previousValue?: number
}) {
    return (
        <div className="flex flex-col items-end">
            <span className="font-medium">{value.toFixed(0)}%</span>
            <TrendIndicator current={value} previous={previousValue} />
        </div>
    )
}

export function PerformanceTrends({
    workers,
    periodType,
    onPeriodTypeChange,
}: PerformanceTrendsProps) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg">Performance Trends</CardTitle>
                <Select
                    value={periodType}
                    onValueChange={(v) =>
                        onPeriodTypeChange(v as 'weekly' | 'monthly')
                    }
                >
                    <SelectTrigger className="w-32 h-10">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                </Select>
            </CardHeader>
            <CardContent>
                {workers.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                        No performance data available
                    </p>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Worker</TableHead>
                                <TableHead className="text-right">
                                    Tasks
                                </TableHead>
                                <TableHead className="text-right">
                                    Attendance
                                </TableHead>
                                <TableHead className="text-right">
                                    Approval
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {workers.map((worker) => (
                                <TableRow key={worker.workerId}>
                                    <TableCell className="font-medium">
                                        {worker.workerName}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <MetricCell
                                            value={
                                                worker.currentPeriod
                                                    .taskCompletionRate
                                            }
                                            previousValue={
                                                worker.previousPeriod
                                                    ?.taskCompletionRate
                                            }
                                        />
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <MetricCell
                                            value={
                                                worker.currentPeriod
                                                    .attendanceRate
                                            }
                                            previousValue={
                                                worker.previousPeriod
                                                    ?.attendanceRate
                                            }
                                        />
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <MetricCell
                                            value={
                                                worker.currentPeriod
                                                    .approvalRate
                                            }
                                            previousValue={
                                                worker.previousPeriod
                                                    ?.approvalRate
                                            }
                                        />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    )
}
