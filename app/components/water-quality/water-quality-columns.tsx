import { useMemo } from 'react'
import { Edit, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { ColumnDef } from '@tanstack/react-table'
import type { WaterQualityRecord } from '~/features/water-quality/types'
import { WATER_QUALITY_THRESHOLDS } from '~/features/water-quality/constants'
import { useFormatDate, useFormatTemperature } from '~/features/settings'
import { Button } from '~/components/ui/button'

interface UseWaterQualityColumnsProps {
  onEdit: (record: WaterQualityRecord) => void
  onDelete: (record: WaterQualityRecord) => void
}

export function useWaterQualityColumns({
  onEdit,
  onDelete,
}: UseWaterQualityColumnsProps) {
  const { t } = useTranslation(['waterQuality', 'common', 'batches'])
  const { format: formatDate } = useFormatDate()
  const { format: formatTemperature, label: tempLabel } = useFormatTemperature()

  return useMemo<Array<ColumnDef<WaterQualityRecord>>>(
    () => [
      {
        accessorKey: 'date',
        header: t('common:date', { defaultValue: 'Date' }),
        cell: ({ row }) => formatDate(row.original.date),
      },
      {
        accessorKey: 'species',
        header: t('batches:batch', { defaultValue: 'Batch' }),
        cell: ({ row }) => (
          <span className="font-medium">{row.original.species}</span>
        ),
      },
      {
        accessorKey: 'ph',
        header: t('waterQuality:labels.ph', { defaultValue: 'pH' }),
        cell: ({ row }) => {
          const ph = parseFloat(row.original.ph)
          const isBad =
            ph < WATER_QUALITY_THRESHOLDS.ph.min ||
            ph > WATER_QUALITY_THRESHOLDS.ph.max
          return (
            <span className={isBad ? 'text-destructive font-bold' : ''}>
              {ph.toFixed(1)}
            </span>
          )
        },
      },
      {
        accessorKey: 'temperatureCelsius',
        header: t('waterQuality:temp', {
          label: tempLabel,
          defaultValue: 'Temp ({{label}})',
        }),
        cell: ({ row }) => {
          const temp = parseFloat(row.original.temperatureCelsius)
          const isBad =
            temp < WATER_QUALITY_THRESHOLDS.temperature.min ||
            temp > WATER_QUALITY_THRESHOLDS.temperature.max
          return (
            <span className={isBad ? 'text-destructive font-bold' : ''}>
              {formatTemperature(temp)}
            </span>
          )
        },
      },
      {
        accessorKey: 'dissolvedOxygenMgL',
        header: t('waterQuality:do', { defaultValue: 'DO (mg/L)' }),
        cell: ({ row }) => {
          const val = parseFloat(row.original.dissolvedOxygenMgL)
          const isBad = val < WATER_QUALITY_THRESHOLDS.dissolvedOxygen.min
          return (
            <span className={isBad ? 'text-destructive font-bold' : ''}>
              {val.toFixed(1)}
            </span>
          )
        },
      },
      {
        accessorKey: 'ammoniaMgL',
        header: t('waterQuality:ammonia', { defaultValue: 'Ammonia' }),
        cell: ({ row }) => {
          const val = parseFloat(row.original.ammoniaMgL)
          const isBad = val > WATER_QUALITY_THRESHOLDS.ammonia.max
          return (
            <span className={isBad ? 'text-destructive font-bold' : ''}>
              {val.toFixed(2)}
            </span>
          )
        },
      },
      {
        id: 'actions',
        cell: ({ row }) => (
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(row.original)}
              title={t('common:edit', { defaultValue: 'Edit' })}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive hover:text-destructive"
              onClick={() => onDelete(row.original)}
              title={t('common:delete', { defaultValue: 'Delete' })}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    [t, formatDate, formatTemperature, tempLabel, onEdit, onDelete],
  )
}
