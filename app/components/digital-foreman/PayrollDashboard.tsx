import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Download, Wallet } from 'lucide-react'
import {
  exportPayrollCsvFn,
  getPayrollHistoryFn,
  getPayrollSummaryFn,
  recordPaymentFn,
} from '~/features/digital-foreman/server-payroll'
import { useFormatCurrency, useSettings } from '~/features/settings'
import { downloadPDF, generatePaymentReceiptPDF } from '~/lib/export/pdf'
import { cn } from '~/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { PageHeader } from '~/components/page-header'
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
  farmId?: string
}

export function PayrollDashboard({ farmId }: PayrollDashboardProps) {
  const { t } = useTranslation(['digitalForeman'])
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
    queryKey: ['payroll-periods', farmId ?? 'all'],
    queryFn: () => getPayrollHistoryFn({ data: { farmId } }),
  })

  const { data: summary } = useQuery({
    queryKey: ['payroll-summary', farmId ?? 'all', selectedPeriod],
    queryFn: () =>
      getPayrollSummaryFn({
        data: { farmId, payrollPeriodId: selectedPeriod },
      }),
    enabled: !!selectedPeriod,
  })

  const recordPayment = useMutation({
    mutationFn: recordPaymentFn,
    onSuccess: () => {
      toast.success(
        t('digitalForeman:messages.paymentRecorded', {
          defaultValue: 'Payment recorded',
        }),
      )
      queryClient.invalidateQueries({ queryKey: ['payroll-summary'] })
    },
    onError: () =>
      toast.error(
        t('digitalForeman:messages.paymentRecordFailed', {
          defaultValue: 'Failed to record payment',
        }),
      ),
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
      toast.success(
        t('digitalForeman:messages.payrollExported', {
          defaultValue: 'Payroll exported',
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
    toast.success(
      t('digitalForeman:messages.receiptDownloaded', {
        defaultValue: 'Receipt downloaded',
      }),
    )
  }

  const totalWages =
    summary?.workers.reduce((sum, w) => sum + w.grossWages, 0) || 0
  const totalPaid = summary?.workers.reduce((sum, w) => sum + w.paid, 0) || 0
  const outstanding = totalWages - totalPaid

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payroll Command"
        description="Verify wages, record payments, and manage financial logs for your workforce."
        icon={Wallet}
        actions={
          selectedPeriod && (
            <Button
              variant="outline"
              onClick={() => exportCsv.mutate()}
              disabled={exportCsv.isPending}
              className="rounded-xl font-bold bg-white/50 dark:bg-white/5 border-white/20 hover:bg-white/80 dark:hover:bg-white/10 shadow-sm"
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          )
        }
      />

      <Card className="bg-white/30 dark:bg-black/80 backdrop-blur-2xl border-white/20 dark:border-white/10 shadow-2xl rounded-3xl overflow-hidden relative border">
        {/* Decorative Orbs */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

        <CardHeader className="pb-4 relative z-10 border-b border-white/10">
          <CardTitle className="text-xl font-black tracking-tight">
            Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 relative z-10">
          <div className="max-w-md space-y-2">
            <Label className="font-black uppercase tracking-widest text-[10px] text-muted-foreground ml-1">
              Active Payroll Period
            </Label>
            <Select
              value={selectedPeriod}
              onValueChange={(v) => v && setSelectedPeriod(v)}
            >
              <SelectTrigger className="rounded-2xl h-12 bg-white/40 dark:bg-white/5 border-white/20 shadow-inner font-bold active:scale-[0.99] transition-transform">
                <SelectValue
                  placeholder={t('digitalForeman:placeholders.locatePeriod', {
                    defaultValue: 'Locate period...',
                  })}
                />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-white/10 backdrop-blur-xl bg-white/80 dark:bg-black/80">
                {periods.map((p) => (
                  <SelectItem
                    key={p.id}
                    value={p.id}
                    className="rounded-xl my-1 focus:bg-primary/10"
                  >
                    <span className="font-bold text-primary mr-2 uppercase tracking-tighter text-[10px]">
                      {p.periodType}
                    </span>
                    <span className="font-medium">
                      {new Date(p.startDate).toLocaleDateString()}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {summary && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-white/30 dark:bg-black/80 backdrop-blur-2xl border-white/20 dark:border-white/10 shadow-2xl rounded-3xl overflow-hidden relative border group hover:border-white/30 transition-all">
              <CardContent className="pt-6">
                <div className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-2">
                  Total Wages
                </div>
                <div className="text-3xl font-black tracking-tighter text-foreground">
                  {format(totalWages)}
                </div>
                <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-primary/10 rounded-full blur-2xl group-hover:scale-125 transition-transform" />
              </CardContent>
            </Card>
            <Card className="bg-white/30 dark:bg-black/80 backdrop-blur-2xl border-white/20 dark:border-white/10 shadow-2xl rounded-3xl overflow-hidden relative border group hover:border-white/30 transition-all">
              <CardContent className="pt-6">
                <div className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-2">
                  Total Settled
                </div>
                <div className="text-3xl font-black tracking-tighter text-emerald-500">
                  {format(totalPaid)}
                </div>
                <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:scale-125 transition-transform" />
              </CardContent>
            </Card>
            <Card className="bg-white/30 dark:bg-black/80 backdrop-blur-2xl border-white/20 dark:border-white/10 shadow-2xl rounded-3xl overflow-hidden relative border group hover:border-white/30 transition-all border-amber-500/20">
              <CardContent className="pt-6">
                <div className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-2">
                  Outstanding
                </div>
                <div className="text-3xl font-black tracking-tighter text-amber-500">
                  {format(outstanding)}
                </div>
                <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl group-hover:scale-125 transition-transform" />
              </CardContent>
            </Card>
          </div>

          <Card className="bg-white/30 dark:bg-black/80 backdrop-blur-2xl border-white/20 dark:border-white/10 shadow-2xl rounded-3xl overflow-hidden relative border">
            <CardHeader className="pb-4 border-b border-white/10">
              <CardTitle className="text-xl font-black tracking-tight">
                Worker Disbursement List
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-white/40 dark:bg-white/5">
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead className="font-black uppercase tracking-widest text-[10px] text-muted-foreground h-12">
                      Worker
                    </TableHead>
                    <TableHead className="font-black uppercase tracking-widest text-[10px] text-muted-foreground h-12 text-right">
                      Hours
                    </TableHead>
                    <TableHead className="font-black uppercase tracking-widest text-[10px] text-muted-foreground h-12 text-right">
                      Wages
                    </TableHead>
                    <TableHead className="font-black uppercase tracking-widest text-[10px] text-muted-foreground h-12 text-right">
                      Paid
                    </TableHead>
                    <TableHead className="font-black uppercase tracking-widest text-[10px] text-muted-foreground h-12 text-right">
                      Balance
                    </TableHead>
                    <TableHead className="font-black uppercase tracking-widest text-[10px] text-muted-foreground h-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summary.workers.map((worker) => (
                    <TableRow
                      key={worker.id}
                      className="border-white/10 hover:bg-white/20 dark:hover:bg-white/5 transition-colors group"
                    >
                      <TableCell className="font-black py-4">
                        {worker.userName}
                      </TableCell>
                      <TableCell className="text-right font-medium text-muted-foreground">
                        {worker.totalHours.toFixed(1)}
                      </TableCell>
                      <TableCell className="text-right font-black text-primary/80">
                        {format(worker.grossWages)}
                      </TableCell>
                      <TableCell className="text-right font-bold text-emerald-500/80">
                        {format(worker.paid)}
                      </TableCell>
                      <TableCell
                        className={cn(
                          'text-right font-black',
                          worker.balance > 0
                            ? 'text-amber-500'
                            : 'text-muted-foreground/30',
                        )}
                      >
                        {format(worker.balance)}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2 pr-2">
                          <Dialog>
                            <DialogTrigger
                              render={
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setPaymentWorkerId(worker.id)}
                                  className="rounded-xl font-black text-[10px] uppercase tracking-widest border-primary/20 hover:bg-primary/10 hover:border-primary/40 active:scale-[0.95]"
                                >
                                  Settlement
                                </Button>
                              }
                            />
                            <DialogContent className="rounded-3xl border-white/20 backdrop-blur-3xl bg-white/80 dark:bg-black/80 max-w-sm">
                              <DialogHeader>
                                <DialogTitle className="text-2xl font-black tracking-tight">
                                  Disburse Logistics
                                </DialogTitle>
                              </DialogHeader>
                              <div className="space-y-6 pt-4">
                                <div className="space-y-2">
                                  <Label className="font-black uppercase tracking-widest text-[10px] text-muted-foreground ml-1">
                                    Amount ({settings.currencySymbol})
                                  </Label>
                                  <Input
                                    type="number"
                                    value={paymentAmount}
                                    onChange={(e) =>
                                      setPaymentAmount(e.target.value)
                                    }
                                    className="rounded-2xl h-12 bg-white/40 dark:bg-white/5 border-white/20 shadow-inner font-black text-lg"
                                    placeholder={t(
                                      'digitalForeman:placeholders.amount',
                                      {
                                        defaultValue: '0.00',
                                      },
                                    )}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label className="font-black uppercase tracking-widest text-[10px] text-muted-foreground ml-1">
                                    Payment Channel
                                  </Label>
                                  <Select
                                    value={paymentMethod}
                                    onValueChange={(v) =>
                                      v && setPaymentMethod(v as any)
                                    }
                                  >
                                    <SelectTrigger className="rounded-2xl h-12 bg-white/40 dark:bg-white/5 border-white/20 shadow-inner font-bold">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl border-white/10">
                                      <SelectItem
                                        value="cash"
                                        className="rounded-xl mb-1"
                                      >
                                        Cash On Hand
                                      </SelectItem>
                                      <SelectItem
                                        value="bank_transfer"
                                        className="rounded-xl mb-1"
                                      >
                                        Bank Wire
                                      </SelectItem>
                                      <SelectItem
                                        value="mobile_money"
                                        className="rounded-xl"
                                      >
                                        Digital Wallet
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <Button
                                  onClick={handleRecordPayment}
                                  disabled={recordPayment.isPending}
                                  className="w-full h-12 rounded-2xl font-black uppercase tracking-widest bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 active:scale-[0.98] transition-all"
                                >
                                  Finalize Payment
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                          {worker.paid > 0 && (
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleDownloadReceipt(worker)}
                              className="rounded-xl hover:bg-primary/10 hover:text-primary transition-colors h-8 w-8"
                              title={t('digitalForeman:downloadReceipt', {
                                defaultValue: 'Download Receipt',
                              })}
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
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
