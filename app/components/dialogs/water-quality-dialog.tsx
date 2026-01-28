import { toast } from 'sonner'
import React, { useState } from 'react'
import { useRouter } from '@tanstack/react-router'
import { Droplets } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
    WATER_QUALITY_THRESHOLDS,
    insertReadingFn,
} from '~/features/water-quality/server'
import { useFormatTemperature } from '~/features/settings'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Textarea } from '~/components/ui/textarea'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '~/components/ui/select'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '~/components/ui/dialog'

interface Batch {
    id: string
    species: string
    currentQuantity: number
}

interface WaterQualityDialogProps {
    farmId: string
    batches: Array<Batch>
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function WaterQualityDialog({
    farmId,
    batches,
    open,
    onOpenChange,
}: WaterQualityDialogProps) {
    const { t } = useTranslation(['waterQuality', 'batches', 'common'])
    const router = useRouter()
    const { label: tempLabel } = useFormatTemperature()
    const [formData, setFormData] = useState({
        batchId: '',
        date: new Date().toISOString().split('T')[0],
        ph: '',
        temperatureCelsius: '',
        dissolvedOxygenMgL: '',
        ammoniaMgL: '',
        notes: '',
    })
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState('')

    const thresholds = WATER_QUALITY_THRESHOLDS
    const ph = parseFloat(formData.ph)
    const temp = parseFloat(formData.temperatureCelsius)
    const oxygen = parseFloat(formData.dissolvedOxygenMgL)
    const ammonia = parseFloat(formData.ammoniaMgL)

    const warnings = {
        ph: formData.ph && (ph < thresholds.ph.min || ph > thresholds.ph.max),
        temp:
            formData.temperatureCelsius &&
            (temp < thresholds.temperature.min ||
                temp > thresholds.temperature.max),
        oxygen:
            formData.dissolvedOxygenMgL &&
            oxygen < thresholds.dissolvedOxygen.min,
        ammonia: formData.ammoniaMgL && ammonia > thresholds.ammonia.max,
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        setError('')

        try {
            await insertReadingFn({
                data: {
                    farmId,
                    data: {
                        batchId: formData.batchId,
                        date: new Date(formData.date),
                        ph: parseFloat(formData.ph),
                        temperatureCelsius: parseFloat(
                            formData.temperatureCelsius,
                        ),
                        dissolvedOxygenMgL: parseFloat(
                            formData.dissolvedOxygenMgL,
                        ),
                        ammoniaMgL: parseFloat(formData.ammoniaMgL),
                        notes: formData.notes || undefined,
                    },
                },
            })
            toast.success(
                t('recorded', { defaultValue: 'Water quality recorded' }),
            )
            onOpenChange(false)
            setFormData({
                batchId: '',
                date: new Date().toISOString().split('T')[0],
                ph: '',
                temperatureCelsius: '',
                dissolvedOxygenMgL: '',
                ammoniaMgL: '',
                notes: '',
            })
            router.invalidate()
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : t('error.record', {
                          defaultValue: 'Failed to record',
                      }),
            )
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Droplets className="h-5 w-5" />
                        {t('reading', {
                            defaultValue: 'Water Quality Reading',
                        })}
                    </DialogTitle>
                    <DialogDescription>
                        {t('recordDescription', {
                            defaultValue: 'Record water quality parameters',
                        })}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label>
                            {t('batches:batch', { defaultValue: 'Batch' })} *
                        </Label>
                        <Select
                            value={formData.batchId}
                            onValueChange={(value) =>
                                value &&
                                setFormData((prev) => ({
                                    ...prev,
                                    batchId: value,
                                }))
                            }
                        >
                            <SelectTrigger>
                                <SelectValue>
                                    {formData.batchId
                                        ? batches.find(
                                              (b) => b.id === formData.batchId,
                                          )?.species
                                        : t('batches:selectBatch', {
                                              defaultValue: 'Select batch',
                                          })}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                {batches.map((batch) => (
                                    <SelectItem key={batch.id} value={batch.id}>
                                        {batch.species} ({batch.currentQuantity}
                                        )
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>
                            {t('common:date', { defaultValue: 'Date' })} *
                        </Label>
                        <Input
                            type="date"
                            value={formData.date}
                            onChange={(e) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    date: e.target.value,
                                }))
                            }
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <Label
                                className={warnings.ph ? 'text-warning' : ''}
                            >
                                {t('ph', { defaultValue: 'pH' })} (
                                {thresholds.ph.min}-{thresholds.ph.max}) *
                            </Label>
                            <Input
                                type="number"
                                step="0.1"
                                value={formData.ph}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        ph: e.target.value,
                                    }))
                                }
                                className={warnings.ph ? 'border-warning' : ''}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label
                                className={warnings.temp ? 'text-warning' : ''}
                            >
                                {t('temp', { defaultValue: 'Temp' })}{' '}
                                {tempLabel} ({thresholds.temperature.min}-
                                {thresholds.temperature.max}) *
                            </Label>
                            <Input
                                type="number"
                                step="0.1"
                                value={formData.temperatureCelsius}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        temperatureCelsius: e.target.value,
                                    }))
                                }
                                className={
                                    warnings.temp ? 'border-warning' : ''
                                }
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <Label
                                className={
                                    warnings.oxygen ? 'text-warning' : ''
                                }
                            >
                                {t('do', { defaultValue: 'DO mg/L' })} (≥
                                {thresholds.dissolvedOxygen.min}) *
                            </Label>
                            <Input
                                type="number"
                                step="0.1"
                                value={formData.dissolvedOxygenMgL}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        dissolvedOxygenMgL: e.target.value,
                                    }))
                                }
                                className={
                                    warnings.oxygen ? 'border-warning' : ''
                                }
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label
                                className={
                                    warnings.ammonia ? 'text-warning' : ''
                                }
                            >
                                {t('ammonia', { defaultValue: 'Ammonia mg/L' })}{' '}
                                (≤
                                {thresholds.ammonia.max}) *
                            </Label>
                            <Input
                                type="number"
                                step="0.001"
                                value={formData.ammoniaMgL}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        ammoniaMgL: e.target.value,
                                    }))
                                }
                                className={
                                    warnings.ammonia ? 'border-warning' : ''
                                }
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>
                            {t('common:notes', { defaultValue: 'Notes' })}
                        </Label>
                        <Textarea
                            value={formData.notes}
                            onChange={(e) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    notes: e.target.value,
                                }))
                            }
                            placeholder={t('common:additionalObservations', {
                                defaultValue: 'Additional observations',
                            })}
                            rows={2}
                        />
                    </div>

                    {error && (
                        <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                            {error}
                        </div>
                    )}

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isSubmitting}
                        >
                            {t('common:cancel', { defaultValue: 'Cancel' })}
                        </Button>
                        <Button
                            type="submit"
                            disabled={
                                isSubmitting ||
                                !formData.batchId ||
                                !formData.ph ||
                                !formData.temperatureCelsius ||
                                !formData.dissolvedOxygenMgL ||
                                !formData.ammoniaMgL
                            }
                        >
                            {isSubmitting
                                ? t('common:recording', {
                                      defaultValue: 'Recording...',
                                  })
                                : t('recordReading', {
                                      defaultValue: 'Record Reading',
                                  })}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
