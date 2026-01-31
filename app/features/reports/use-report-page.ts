import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useBusinessSettings } from '../settings'
import { getFiscalYearEnd, getFiscalYearStart } from './fiscal-year'

interface UseReportPageProps {
  initialReportType: string
  initialFarmId?: string
  initialStartDate: string
  initialEndDate: string
}

export function useReportPage({
  initialReportType,
  initialFarmId,
  initialStartDate,
  initialEndDate,
}: UseReportPageProps) {
  const { t } = useTranslation(['reports', 'common'])
  const { fiscalYearStartMonth } = useBusinessSettings()

  const [selectedReport, setSelectedReport] = useState(initialReportType)
  const [selectedFarm, setSelectedFarm] = useState(initialFarmId || '')
  const [startDate, setStartDate] = useState(initialStartDate)
  const [endDate, setEndDate] = useState(initialEndDate)
  const [useFiscalYear, setUseFiscalYear] = useState(false)

  const handleFiscalYearToggle = (checked: boolean) => {
    setUseFiscalYear(checked)
    if (checked) {
      const start = getFiscalYearStart(fiscalYearStartMonth)
      const end = getFiscalYearEnd(fiscalYearStartMonth)
      setStartDate(start.toISOString().split('T')[0])
      setEndDate(end.toISOString().split('T')[0])
    }
  }

  const handleGenerateReport = () => {
    const params = new URLSearchParams({
      reportType: selectedReport,
      startDate,
      endDate,
    })
    if (selectedFarm) params.set('farmId', selectedFarm)
    window.location.href = `/reports?${params.toString()}`
  }

  const handleExport = (format: 'csv' | 'xlsx' | 'pdf') => {
    // Only CSV export is currently implemented
    if (format === 'xlsx') {
      toast.info(
        t('reports:exportNotAvailable.excel.title', {
          defaultValue: 'Excel Export Not Available',
        }),
        {
          description: t('reports:exportNotAvailable.excel.description', {
            defaultValue:
              'Excel export is not yet implemented. Please use CSV export instead.',
          }),
        },
      )
      return
    }

    if (format === 'pdf') {
      toast.info(
        t('reports:exportNotAvailable.pdf.title', {
          defaultValue: 'PDF Export Not Available',
        }),
        {
          description: t('reports:exportNotAvailable.pdf.description', {
            defaultValue:
              'PDF export is temporarily disabled due to bundle size constraints. Please use CSV export instead.',
          }),
        },
      )
      return
    }

    // CSV export works - redirect to export endpoint
    const params = new URLSearchParams({
      type: selectedReport,
      format: 'csv',
      startDate,
      endDate,
    })
    if (selectedFarm && selectedFarm !== 'all') {
      params.set('farmId', selectedFarm)
    }
    window.location.href = `/reports/export?${params.toString()}`
  }

  return {
    selectedReport,
    setSelectedReport,
    selectedFarm,
    setSelectedFarm,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    useFiscalYear,
    fiscalYearStartMonth,
    handleFiscalYearToggle,
    handleGenerateReport,
    handleExport,
    t,
  }
}
