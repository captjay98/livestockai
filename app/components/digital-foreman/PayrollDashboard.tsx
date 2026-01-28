'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Download } from 'lucide-react'
import {
    exportPayrollCsvFn,
    getPayrollHistoryFn,
    getPayrollSummaryFn,
    recordPaymentFn,
} from '~/features/digital-foreman/server-payroll'
import { useFormatCurrency, useSettings } from '~/features/settings'
import { downloadPDF, generatePaymentReceiptPDF } from '~/lib/export/pdf'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
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
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '~/components/ui/dialog'

interface PayrollDashboardProps {
    farmId: string
}

export function PayrollDashboard({ farmId }: PayrollDashboardProps) {
    const { format } = useFormatCurrency()
    const { settings } = useSettings()
    const queryClient = useQueryClient()
    const [selectedPeriod, setSelectedPeriod] = useState<string>('')
    const [paymentWorkerId, setPaymentWorkerId] = useState('')
    const [paymentAmount, setPaymentAmount] = useState('')
    const [paymentMethod, setPaymentMethod] = useState<
        'cash' | 'bank_transfer' | 'mobile_money'
    >('cash')

    const { data: periods = [] } = useQuery({
        queryKey: ['payroll-periods', farmId],
        queryFn: () => getPayrollHistoryFn({ data: { farmId } }),
        enabled: !!farmId,
    })

    const { data: summary } = useQuery({
        queryKey: ['payroll-summary', farmId, selectedPeriod],
        queryFn: () =>
            getPayrollSummaryFn({
                data: { farmId, payrollPeriodId: selectedPeriod },
            }),
        enabled: !!farmId && !!selectedPeriod,
    })

    const recordPayment = useMutation({
        mutationFn: recordPaymentFn,
        onSuccess: () => {
            toast.success('Payment recorded')
            queryClient.invalidateQueries({ queryKey: ['payroll-summary'] })
        },
        onError: () => toast.error('Failed to record payment'),
    })

    const exportCsv = useMutation({
        mutationFn: () =>
            exportPayrollCsvFn({
                data: { farmId, payrollPeriodId: selectedPeriod },
            }),
        onSuccess: (result) => {
            const blob = new Blob([result.csv], { type: 'text/csv' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = result.filename
            a.click()
            URL.revokeObjectURL(url)
            toast.success('Payroll exported')
        },
        onError: () => toast.error('Export failed'),
    })

    const handleRecordPayment = () => {
        if (!paymentWorkerId || !paymentAmount || !selectedPeriod) return
        recordPayment.mutate({
            data: {
                workerId: paymentWorkerId,
                payrollPeriodId: selectedPeriod,
                amount: Number(paymentAmount),
                paymentMethod,
                paymentDate: new Date(),
            },
        })
    }

    const handleDownloadReceipt = (worker: {
        id: string
        userName: string | null
        totalHours: number
        grossWages: number
        paid: number
        wageRate: number
        wageRateType: 'hourly' | 'daily' | 'monthly'
    }) => {
        if (!summary) return
        const period = periods.find((p) => p.id === selectedPeriod)
        if (!period) return

        const doc = generatePaymentReceiptPDF(
            {
                receiptNumber: `PAY-${worker.id.slice(0, 8).toUpperCase()}`,
                paymentDate: new Date(),
                farmName: summary.farmName || 'Farm',
                workerName: worker.userName || 'Worker',
                periodStart: new Date(period.startDate),
                periodEnd: new Date(period.endDate),
                totalHours: worker.totalHours,
                wageRate: worker.wageRate,
                wageRateType: worker.wageRateType,
                grossWages: worker.grossWages,
                amountPaid: worker.paid,
                paymentMethod: 'cash',
            },
            settings,
        )
        downloadPDF(
            doc,
            `receipt-${(worker.userName || 'worker').replace(/\s+/g, '-').toLowerCase()}-${period.startDate}`,
        )
        toast.success('Receipt downloaded')
    }

    const totalWages =
        summary?.workers.reduce((sum, w) => sum + w.grossWages, 0) || 0
    const totalPaid = summary?.workers.reduce((sum, w) => sum + w.paid, 0) || 0
    const outstanding = totalWages - totalPaid

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Payroll Dashboard</CardTitle>
                    {selectedPeriod && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => exportCsv.mutate()}
                            disabled={exportCsv.isPending}
                        >
                            <Download className="h-4 w-4 mr-2" />
                            Export CSV
                        </Button>
                    )}
                </CardHeader>
                <CardContent>
                    <div className="mb-4">
                        <Label>Select Period</Label>
                        <Select
                            value={selectedPeriod}
                            onValueChange={(v) => v && setSelectedPeriod(v)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select period" />
                            </SelectTrigger>
                            <SelectContent>
                                {periods.map((p) => (
                                    <SelectItem key={p.id} value={p.id}>
                                        {p.periodType} -{' '}
                                        {new Date(
                                            p.startDate,
                                        ).toLocaleDateString()}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {summary && (
                        <>
                            <div className="grid grid-cols-3 gap-4 mb-6">
                                <Card>
                                    <CardContent className="pt-4">
                                        <div className="text-sm text-muted-foreground">
                                            Total Wages
                                        </div>
                                        <div className="text-2xl font-bold">
                                            {format(totalWages)}
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="pt-4">
                                        <div className="text-sm text-muted-foreground">
                                            Total Paid
                                        </div>
                                        <div className="text-2xl font-bold">
                                            {format(totalPaid)}
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="pt-4">
                                        <div className="text-sm text-muted-foreground">
                                            Outstanding
                                        </div>
                                        <div className="text-2xl font-bold text-amber-600">
                                            {format(outstanding)}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Worker</TableHead>
                                        <TableHead>Hours</TableHead>
                                        <TableHead>Wages</TableHead>
                                        <TableHead>Paid</TableHead>
                                        <TableHead>Balance</TableHead>
                                        <TableHead></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {summary.workers.map((worker) => (
                                        <TableRow key={worker.id}>
                                            <TableCell>
                                                {worker.userName}
                                            </TableCell>
                                            <TableCell>
                                                {worker.totalHours.toFixed(1)}
                                            </TableCell>
                                            <TableCell>
                                                {format(worker.grossWages)}
                                            </TableCell>
                                            <TableCell>
                                                {format(worker.paid)}
                                            </TableCell>
                                            <TableCell
                                                className={
                                                    worker.balance > 0
                                                        ? 'text-amber-600'
                                                        : ''
                                                }
                                            >
                                                {format(worker.balance)}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex gap-2">
                                                    <Dialog>
                                                        <DialogTrigger>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() =>
                                                                    setPaymentWorkerId(
                                                                        worker.id,
                                                                    )
                                                                }
                                                            >
                                                                Pay
                                                            </Button>
                                                        </DialogTrigger>
                                                        <DialogContent>
                                                            <DialogHeader>
                                                                <DialogTitle>
                                                                    Record
                                                                    Payment
                                                                </DialogTitle>
                                                            </DialogHeader>
                                                            <div className="space-y-4">
                                                                <div>
                                                                    <Label>
                                                                        Amount
                                                                    </Label>
                                                                    <Input
                                                                        type="number"
                                                                        value={
                                                                            paymentAmount
                                                                        }
                                                                        onChange={(
                                                                            e,
                                                                        ) =>
                                                                            setPaymentAmount(
                                                                                e
                                                                                    .target
                                                                                    .value,
                                                                            )
                                                                        }
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <Label>
                                                                        Method
                                                                    </Label>
                                                                    <Select
                                                                        value={
                                                                            paymentMethod
                                                                        }
                                                                        onValueChange={(
                                                                            v,
                                                                        ) =>
                                                                            v &&
                                                                            setPaymentMethod(
                                                                                v,
                                                                            )
                                                                        }
                                                                    >
                                                                        <SelectTrigger>
                                                                            <SelectValue />
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                            <SelectItem value="cash">
                                                                                Cash
                                                                            </SelectItem>
                                                                            <SelectItem value="bank_transfer">
                                                                                Bank
                                                                                Transfer
                                                                            </SelectItem>
                                                                            <SelectItem value="mobile_money">
                                                                                Mobile
                                                                                Money
                                                                            </SelectItem>
                                                                        </SelectContent>
                                                                    </Select>
                                                                </div>
                                                                <Button
                                                                    onClick={
                                                                        handleRecordPayment
                                                                    }
                                                                    disabled={
                                                                        recordPayment.isPending
                                                                    }
                                                                >
                                                                    Record
                                                                    Payment
                                                                </Button>
                                                            </div>
                                                        </DialogContent>
                                                    </Dialog>
                                                    {worker.paid > 0 && (
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() =>
                                                                handleDownloadReceipt(
                                                                    worker,
                                                                )
                                                            }
                                                            title="Download Receipt"
                                                        >
                                                            <Download className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
