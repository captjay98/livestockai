import { toast } from 'sonner'
import React, { useState } from 'react'
import { useRouter } from '@tanstack/react-router'
import { Syringe } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  createTreatmentFn,
  createVaccinationFn,
} from '~/features/vaccinations/server'
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
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
      if (recordType === 'vaccination') {
        await createVaccinationFn({
          data: {
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
        })
      } else {
        await createTreatmentFn({
          data: {
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
        })
      }
      toast.success(
        recordType === 'vaccination'
          ? t('vaccinationRecorded', {
              defaultValue: 'Vaccination recorded',
            })
          : t('treatmentRecorded', {
              defaultValue: 'Treatment recorded',
            }),
      )
      onOpenChange(false)
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
      router.invalidate()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t('error.create', {
              defaultValue: 'Failed to create record',
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
            <Syringe className="h-5 w-5" />
            {t('addHealthRecord', {
              defaultValue: 'Add Health Record',
            })}
          </DialogTitle>
          <DialogDescription>
            {t('addDescription', {
              defaultValue: 'Record a vaccination or treatment',
            })}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2">
            <Button
              type="button"
              variant={recordType === 'vaccination' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setRecordType('vaccination')}
            >
              {t('vaccination', { defaultValue: 'Vaccination' })}
            </Button>
            <Button
              type="button"
              variant={recordType === 'treatment' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setRecordType('treatment')}
            >
              {t('treatment', { defaultValue: 'Treatment' })}
            </Button>
          </div>

          <div className="space-y-2">
            <Label>{t('batches:batch', { defaultValue: 'Batch' })} *</Label>
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
            <Label>
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
            />
          </div>

          {recordType === 'treatment' && (
            <div className="space-y-2">
              <Label>{t('reason', { defaultValue: 'Reason' })} *</Label>
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
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>{t('common:date', { defaultValue: 'Date' })} *</Label>
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
            <div className="space-y-2">
              <Label>{t('common:dosage', { defaultValue: 'Dosage' })} *</Label>
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
              />
            </div>
          </div>

          {recordType === 'vaccination' ? (
            <div className="space-y-2">
              <Label>
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
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Label>
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
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>{t('common:notes', { defaultValue: 'Notes' })}</Label>
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
      </DialogContent>
    </Dialog>
  )
}
