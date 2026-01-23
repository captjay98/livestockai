import { useState } from 'react'
import { useTranslation } from 'react-i18next'
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

  const handleExport = (format: 'xlsx' | 'pdf') => {
    window.location.href = `/reports/export?type=${selectedReport}&format=${format}&farmId=${selectedFarm}&startDate=${startDate}&endDate=${endDate}`
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
