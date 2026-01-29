import { useTranslation } from 'react-i18next'
import { getFiscalYearLabel } from '~/features/reports/fiscal-year'

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
    <div className="bg-card rounded-lg border p-6 mb-6">
      <h2 className="font-semibold mb-4">
        {t('reports:generate', { defaultValue: 'Generate Report' })}
      </h2>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-4">
        {reportTypes.map((type) => {
          const Icon = type.icon
          return (
            <button
              key={type.id}
              onClick={() => setSelectedReport(type.id)}
              className={`p-4 rounded-lg border text-left transition-colors ${
                selectedReport === type.id
                  ? 'border-primary bg-primary/5'
                  : 'hover:border-muted-foreground/50'
              }`}
            >
              <Icon
                className={`h-5 w-5 mb-2 ${
                  selectedReport === type.id
                    ? 'text-primary'
                    : 'text-muted-foreground'
                }`}
              />
              <div className="font-medium text-sm">
                {t(
                  `reports:types.${type.id === 'profit-loss' ? 'profitLoss' : type.id}` as any,
                  { defaultValue: type.name },
                )}
              </div>
            </button>
          )
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-4 mb-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">
            {t('reports:labels.farm', { defaultValue: 'Farm' })}
          </label>
          <select
            value={selectedFarm}
            onChange={(e) => setSelectedFarm(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">
              {t('reports:labels.allFarms', {
                defaultValue: 'All Farms',
              })}
            </option>
            {farms.map((farm: { id: string; name: string }) => (
              <option key={farm.id} value={farm.id}>
                {farm.name}
              </option>
            ))}
          </select>
        </div>

        {selectedReport !== 'inventory' && (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={useFiscalYear}
                  onChange={(e) => onFiscalYearToggle(e.target.checked)}
                  className="h-4 w-4 rounded border-input"
                />
                {t('reports:labels.useFiscalYear', {
                  defaultValue: 'Use Fiscal Year',
                })}{' '}
                {useFiscalYear &&
                  `(${getFiscalYearLabel(fiscalYearStartMonth)})`}
              </label>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t('reports:labels.startDate', {
                  defaultValue: 'Start Date',
                })}
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={useFiscalYear}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-50"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t('reports:labels.endDate', {
                  defaultValue: 'End Date',
                })}
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={useFiscalYear}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-50"
              />
            </div>
          </>
        )}

        <div className="flex items-end">
          <button
            onClick={onGenerate}
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 w-full"
          >
            {t('reports:generate', { defaultValue: 'Generate' })}
          </button>
        </div>
      </div>
    </div>
  )
}
