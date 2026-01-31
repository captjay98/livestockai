import React, { useState } from 'react'
import { useRouter } from '@tanstack/react-router'
import { Syringe } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useVaccinationMutations } from '~/features/vaccinations/mutations'
import { cn } from '~/lib/utils'
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

interface VaccinationDialogProps {
  farmId: string
  batches: Array<Batch>
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function VaccinationDialog({
  farmId,
  batches,
  open,
  onOpenChange,
}: VaccinationDialogProps) {
  const { t } = useTranslation(['health', 'batches', 'common'])
  const router = useRouter()
  const [recordType, setRecordType] = useState<'vaccination' | 'treatment'>(
    'vaccination',
  )
  const [formData, setFormData] = useState({
    batchId: '',
    name: '',
    date: new Date().toISOString().split('T')[0],
    dosage: '',
    nextDueDate: '',
    reason: '',
    withdrawalDays: '',
    notes: '',
  })
  const { createVaccination, createTreatment } = useVaccinationMutations()
  const [error, setError] = useState('')

  const isSubmitting = createVaccination.isPending || createTreatment.isPending

  const resetForm = () => {
    setFormData({
      batchId: '',
      name: '',
      date: new Date().toISOString().split('T')[0],
      dosage: '',
      nextDueDate: '',
      reason: '',
      withdrawalDays: '',
      notes: '',
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (recordType === 'vaccination') {
      createVaccination.mutate(
        {
          farmId,
          data: {
            batchId: formData.batchId,
            vaccineName: formData.name,
            dateAdministered: new Date(formData.date),
            dosage: formData.dosage,
            nextDueDate: formData.nextDueDate
              ? new Date(formData.nextDueDate)
              : null,
            notes: formData.notes || null,
          },
        },
        {
          onSuccess: () => {
            onOpenChange(false)
            resetForm()
            router.invalidate()
          },
          onError: (err: Error) => {
            setError(err instanceof Error ? err.message : t('error.create'))
          },
        },
      )
    } else {
      createTreatment.mutate(
        {
          farmId,
          data: {
            batchId: formData.batchId,
            medicationName: formData.name,
            reason: formData.reason,
            date: new Date(formData.date),
            dosage: formData.dosage,
            withdrawalDays: parseInt(formData.withdrawalDays) || 0,
            notes: formData.notes || null,
          },
        },
        {
          onSuccess: () => {
            onOpenChange(false)
            resetForm()
            router.invalidate()
          },
          onError: (err: Error) => {
            setError(err instanceof Error ? err.message : t('error.create'))
          },
        },
      )
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader className="bg-white/10 dark:bg-black/20 p-6 -mx-6 -mt-6 rounded-t-lg border-b border-white/10 backdrop-blur-sm">
          <DialogTitle className="flex items-center gap-2 text-xl font-bold tracking-tight">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <Syringe className="h-5 w-5" />
            </div>
            {t('addHealthRecord', {
              defaultValue: 'Add Health Record',
            })}
          </DialogTitle>
          <DialogDescription className="text-xs font-medium uppercase tracking-widest text-muted-foreground/70">
            {t('addDescription', {
              defaultValue: 'Record a vaccination or treatment',
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="pt-4 px-1">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex gap-1 p-1 rounded-xl bg-white/40 dark:bg-black/40 border border-white/20 dark:border-white/10 backdrop-blur-md">
              <Button
                type="button"
                variant={recordType === 'vaccination' ? 'secondary' : 'ghost'}
                size="sm"
                className={cn(
                  'flex-1 rounded-lg font-bold text-xs transition-all',
                  recordType === 'vaccination'
                    ? 'bg-white/80 dark:bg-white/20 shadow-sm scale-[1.02]'
                    : 'text-muted-foreground/60 hover:text-foreground',
                )}
                onClick={() => setRecordType('vaccination')}
              >
                {t('vaccination', { defaultValue: 'Vaccination' })}
              </Button>
              <Button
                type="button"
                variant={recordType === 'treatment' ? 'secondary' : 'ghost'}
                size="sm"
                className={cn(
                  'flex-1 rounded-lg font-bold text-xs transition-all',
                  recordType === 'treatment'
                    ? 'bg-white/80 dark:bg-white/20 shadow-sm scale-[1.02]'
                    : 'text-muted-foreground/60 hover:text-foreground',
                )}
                onClick={() => setRecordType('treatment')}
              >
                {t('treatment', { defaultValue: 'Treatment' })}
              </Button>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 pl-1">
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
                <SelectTrigger
                  className="h-11 bg-black/5 dark:bg-white/5 border-transparent focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-all font-medium text-sm px-4 rounded-xl"
                  style={{ color: 'var(--text-landing-primary)' }}
                >
                  <SelectValue>
                    {formData.batchId
                      ? batches.find((b) => b.id === formData.batchId)?.species
                      : t('batches:selectBatch', {
                          defaultValue: 'Select batch',
                        })}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {batches.map((batch) => (
                    <SelectItem key={batch.id} value={batch.id}>
                      {batch.species} ({batch.currentQuantity})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 pl-1">
                {recordType === 'vaccination'
                  ? t('vaccineName', {
                      defaultValue: 'Vaccine Name',
                    })
                  : t('medicationName', {
                      defaultValue: 'Medication Name',
                    })}{' '}
                *
              </Label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
                placeholder={
                  recordType === 'vaccination'
                    ? t('placeholders.vaccine', {
                        defaultValue: 'e.g., Newcastle Disease',
                      })
                    : t('placeholders.medication', {
                        defaultValue: 'e.g., Oxytetracycline',
                      })
                }
                required
                className="h-11 bg-black/5 dark:bg-white/5 border-transparent focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-all font-medium text-sm px-4 rounded-xl"
                style={{ color: 'var(--text-landing-primary)' }}
              />
            </div>

            {recordType === 'treatment' && (
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 pl-1">
                  {t('reason', { defaultValue: 'Reason' })} *
                </Label>
                <Input
                  value={formData.reason}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      reason: e.target.value,
                    }))
                  }
                  placeholder={t('placeholders.reason', {
                    defaultValue: 'e.g., Respiratory infection',
                  })}
                  required
                  className="h-11 bg-black/5 dark:bg-white/5 border-transparent focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-all font-medium text-sm px-4 rounded-xl"
                  style={{ color: 'var(--text-landing-primary)' }}
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 pl-1">
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
                  className="h-11 bg-black/5 dark:bg-white/5 border-transparent focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-all font-medium text-sm px-4 rounded-xl"
                  style={{ color: 'var(--text-landing-primary)' }}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 pl-1">
                  {t('common:dosage', { defaultValue: 'Dosage' })} *
                </Label>
                <Input
                  value={formData.dosage}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      dosage: e.target.value,
                    }))
                  }
                  placeholder={t('health:placeholders.dosage', {
                    defaultValue: 'e.g., 0.5ml',
                  })}
                  required
                  className="h-11 bg-black/5 dark:bg-white/5 border-transparent focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-all font-medium text-sm px-4 rounded-xl"
                  style={{ color: 'var(--text-landing-primary)' }}
                />
              </div>
            </div>

            {recordType === 'vaccination' ? (
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 pl-1">
                  {t('nextDueDate', {
                    defaultValue: 'Next Due Date',
                  })}
                </Label>
                <Input
                  type="date"
                  value={formData.nextDueDate}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      nextDueDate: e.target.value,
                    }))
                  }
                  className="h-11 bg-black/5 dark:bg-white/5 border-transparent focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-all font-medium text-sm px-4 rounded-xl"
                  style={{ color: 'var(--text-landing-primary)' }}
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 pl-1">
                  {t('withdrawalDays', {
                    defaultValue: 'Withdrawal Days',
                  })}
                </Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.withdrawalDays}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      withdrawalDays: e.target.value,
                    }))
                  }
                  placeholder={t('placeholders.withdrawal', {
                    defaultValue: 'Days before safe for consumption',
                  })}
                  className="h-11 bg-black/5 dark:bg-white/5 border-transparent focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-all font-medium text-sm px-4 rounded-xl"
                  style={{ color: 'var(--text-landing-primary)' }}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 pl-1">
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
                placeholder={t('common:additionalNotes', {
                  defaultValue: 'Additional notes',
                })}
                rows={2}
                className="bg-black/5 dark:bg-white/5 border-transparent focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-all font-medium text-sm p-4 rounded-xl resize-none"
                style={{ color: 'var(--text-landing-primary)' }}
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
                  !formData.name ||
                  !formData.dosage
                }
              >
                {isSubmitting
                  ? t('common:creating', {
                      defaultValue: 'Creating...',
                    })
                  : t('addRecord', {
                      defaultValue: 'Add Record',
                    })}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
