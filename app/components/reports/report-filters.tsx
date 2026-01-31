import { useTranslation } from 'react-i18next'
import { Filter } from 'lucide-react'
import { getFiscalYearLabel } from '~/features/reports/fiscal-year'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { Input } from '~/components/ui/input'
import { Button } from '~/components/ui/button'
import { Switch } from '~/components/ui/switch'
import { Label } from '~/components/ui/label'
import { Card } from '~/components/ui/card'
import { cn } from '~/lib/utils'

interface ReportFiltersProps {
  reportTypes: Array<any>
  selectedReport: string
  setSelectedReport: (id: string) => void
  farms: Array<any>
  selectedFarm: string
  setSelectedFarm: (id: string) => void
  startDate: string
  setStartDate: (val: string) => void
  endDate: string
  setEndDate: (val: string) => void
  useFiscalYear: boolean
  onFiscalYearToggle: (checked: boolean) => void
  fiscalYearStartMonth: number
  onGenerate: () => void
}

export function ReportFilters({
  reportTypes,
  selectedReport,
  setSelectedReport,
  farms,
  selectedFarm,
  setSelectedFarm,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  useFiscalYear,
  onFiscalYearToggle,
  fiscalYearStartMonth,
  onGenerate,
}: ReportFiltersProps) {
  const { t } = useTranslation(['reports', 'common'])

  return (
    <Card className="bg-white/30 dark:bg-black/30 backdrop-blur-md border-white/20 dark:border-white/10 shadow-sm rounded-2xl p-6 mb-6">
      <div className="flex items-center gap-2 mb-6">
        <div className="p-2 rounded-lg bg-primary/10 text-primary">
          <Filter className="h-5 w-5" />
        </div>
        <h2 className="font-bold text-lg">
          {t('reports:generate', { defaultValue: 'Generate Report' })}
        </h2>
      </div>

      <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5 mb-8">
        {reportTypes.map((type) => {
          const Icon = type.icon
          const isSelected = selectedReport === type.id
          return (
            <button
              key={type.id}
              onClick={() => setSelectedReport(type.id)}
              className={cn(
                'flex flex-col items-center justify-center gap-3 p-4 rounded-xl border transition-all duration-200 group relative overflow-hidden',
                isSelected
                  ? 'bg-primary/10 border-primary/50 text-primary shadow-sm'
                  : 'bg-white/40 dark:bg-black/40 border-white/10 dark:border-white/5 hover:bg-white/60 dark:hover:bg-white/5 hover:border-primary/20 hover:scale-[1.02]',
              )}
            >
              <div
                className={cn(
                  'p-2.5 rounded-full transition-colors',
                  isSelected
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-white/50 dark:bg-white/10 text-muted-foreground group-hover:text-primary',
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
              <span className="font-semibold text-xs sm:text-sm text-center leading-tight">
                {t(
                  `reports:types.${type.id === 'profit-loss' ? 'profitLoss' : type.id}` as any,
                  { defaultValue: type.name },
                )}
              </span>
              {isSelected && (
                <div className="absolute inset-0 border-2 border-primary rounded-xl pointer-events-none" />
              )}
            </button>
          )
        })}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 items-end bg-white/40 dark:bg-black/40 p-5 rounded-xl border border-white/10">
        <div className="space-y-2.5">
          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
            {t('reports:labels.farm', { defaultValue: 'Farm' })}
          </Label>
          <Select
            value={selectedFarm}
            onValueChange={(v) => v && setSelectedFarm(v)}
          >
            <SelectTrigger className="bg-white/50 dark:bg-black/20 border-white/10 h-11">
              <SelectValue>
                {selectedFarm === 'all'
                  ? t('reports:labels.allFarms', { defaultValue: 'All Farms' })
                  : farms.find((f: any) => f.id === selectedFarm)?.name ||
                    selectedFarm}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {t('reports:labels.allFarms', { defaultValue: 'All Farms' })}
              </SelectItem>
              {farms.map((farm: { id: string; name: string }) => (
                <SelectItem key={farm.id} value={farm.id}>
                  {farm.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedReport !== 'inventory' && (
          <>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between h-[18px]">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                  {t('common:dateRange', { defaultValue: 'Date Range' })}
                </Label>
                <div className="flex items-center gap-2">
                  <Label
                    htmlFor="fiscal-year"
                    className="text-[10px] font-medium text-muted-foreground cursor-pointer"
                  >
                    {t('reports:labels.useFiscalYear', {
                      defaultValue: 'Fiscal Year',
                    })}
                  </Label>
                  <Switch
                    id="fiscal-year"
                    checked={useFiscalYear}
                    onCheckedChange={onFiscalYearToggle}
                    className="scale-75 origin-right"
                  />
                </div>
              </div>

              <div className="relative">
                <div
                  className={cn(
                    'grid gap-2',
                    useFiscalYear ? 'opacity-50 pointer-events-none' : '',
                  )}
                >
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="bg-white/50 dark:bg-black/20 border-white/10 h-11"
                  />
                </div>
                {useFiscalYear && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/5 backdrop-blur-[1px] rounded-md">
                    <span className="text-xs font-medium px-2 py-1 bg-primary/10 text-primary rounded-md border border-primary/20">
                      {getFiscalYearLabel(fiscalYearStartMonth)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1 opacity-0">
                End Date
              </Label>
              <div
                className={cn(
                  'grid gap-2',
                  useFiscalYear ? 'opacity-50 pointer-events-none' : '',
                )}
              >
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-white/50 dark:bg-black/20 border-white/10 h-11"
                />
              </div>
            </div>
          </>
        )}

        <Button
          onClick={onGenerate}
          className="h-11 w-full font-bold shadow-lg shadow-primary/20"
        >
          {t('reports:generate', { defaultValue: 'Generate Report' })}
        </Button>
      </div>
    </Card>
  )
}
