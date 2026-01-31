import { Link } from '@tanstack/react-router'
import { Building2, FileBarChart, TrendingDown } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface FarmQuickActionsProps {
  farmId: string
  onRecordExpense: () => void
}

export function FarmQuickActions({
  farmId,
  onRecordExpense,
}: FarmQuickActionsProps) {
  const { t } = useTranslation(['farms', 'reports'])

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
      <Link to="/batches" preload="intent" className="w-full">
        <div className="group relative flex flex-col items-center justify-center gap-3 p-6 text-center border rounded-3xl bg-white/30 dark:bg-black/30 backdrop-blur-md border-white/20 hover:bg-white/50 dark:hover:bg-black/40 transition-all hover:scale-[1.02] shadow-sm h-full">
          <div className="p-3 rounded-2xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
            <Building2 className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-sm tracking-tight">
              {t('farms:quickActions.manageBatches')}
            </h3>
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
              Inventory
            </p>
          </div>
        </div>
      </Link>

      <button
        className="w-full group relative flex flex-col items-center justify-center gap-3 p-6 text-center border rounded-3xl bg-white/30 dark:bg-black/30 backdrop-blur-md border-white/20 hover:bg-red-50/50 dark:hover:bg-red-900/10 hover:border-red-500/20 transition-all hover:scale-[1.02] shadow-sm h-full"
        onClick={onRecordExpense}
      >
        <div className="p-3 rounded-2xl bg-red-500/10 text-destructive group-hover:bg-destructive group-hover:text-white transition-colors">
          <TrendingDown className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <h3 className="font-bold text-sm tracking-tight">
            {t('farms:quickActions.recordExpense')}
          </h3>
          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
            Expense
          </p>
        </div>
      </button>

      <Link
        to="/reports"
        search={{
          reportType: 'profit-loss',
          farmId: farmId,
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split('T')[0],
          endDate: new Date().toISOString().split('T')[0],
        }}
        className="w-full"
      >
        <div className="group relative flex flex-col items-center justify-center gap-3 p-6 text-center border rounded-3xl bg-white/30 dark:bg-black/30 backdrop-blur-md border-white/20 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 hover:border-blue-500/20 transition-all hover:scale-[1.02] shadow-sm h-full">
          <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-600 group-hover:bg-blue-500 group-hover:text-white transition-colors">
            <FileBarChart className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-sm tracking-tight">
              {t('farms:quickActions.viewReports')}
            </h3>
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
              Analytics
            </p>
          </div>
        </div>
      </Link>
    </div>
  )
}
