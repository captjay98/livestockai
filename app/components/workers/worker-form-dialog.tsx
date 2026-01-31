import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Loader2 } from 'lucide-react'
import { useWorkerMutations } from '~/features/digital-foreman/mutations'
import { useFarm } from '~/features/farms/context'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'

interface WorkerFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function WorkerFormDialog({
  open,
  onOpenChange,
}: WorkerFormDialogProps) {
  const { t } = useTranslation(['workers', 'common'])
  const { selectedFarmId } = useFarm()

  // Form State
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [wageRateAmount, setWageRateAmount] = useState('')
  const [wageRateType, setWageRateType] = useState<
    'hourly' | 'daily' | 'monthly'
  >('monthly')
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  const validate = () => {
    const newErrors: { [key: string]: string } = {}
    if (name.length < 2)
      newErrors.name = t(
        'workers:validation.name',
        'Name must be at least 2 characters',
      )
    if (phone.length < 10)
      newErrors.phone = t(
        'workers:validation.phone',
        'Phone must be at least 10 digits',
      )
    if (
      !wageRateAmount ||
      isNaN(parseFloat(wageRateAmount)) ||
      parseFloat(wageRateAmount) <= 0
    )
      newErrors.wageRateAmount = t(
        'workers:validation.wage',
        'Please enter a valid positive wage',
      )
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const { createWorker } = useWorkerMutations()

  const resetForm = () => {
    setName('')
    setPhone('')
    setWageRateAmount('')
    setWageRateType('monthly')
    setErrors({})
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFarmId) return
    if (validate()) {
      // Mocking a User ID for now since we don't have a full invitation flow yet
      const mockUserId = crypto.randomUUID()

      createWorker.mutate(
        {
          data: {
            userId: mockUserId,
            farmId: selectedFarmId,
            phone: phone,
            wageRateAmount: parseFloat(wageRateAmount),
            wageRateType: wageRateType,
            wageCurrency: 'USD', // Default currency
            permissions: [],
            structureIds: [],
          },
        },
        {
          onSuccess: () => {
            onOpenChange(false)
            resetForm()
          },
        },
      )
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {t('workers:create.title', 'Add New Worker')}
          </DialogTitle>
          <DialogDescription>
            {t(
              'workers:create.description',
              'Create a new worker profile for your farm.',
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label
              htmlFor="name"
              className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 pl-1"
            >
              {t('workers:form.name', 'Full Name')}
            </Label>
            <Input
              id="name"
              placeholder={t('workers:placeholders.fullName', {
                defaultValue: 'John Doe',
              })}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`h-11 bg-black/5 dark:bg-white/5 border-transparent focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-all font-medium text-sm px-4 rounded-xl ${errors.name ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
              style={{ color: 'var(--text-landing-primary)' }}
            />
            {errors.name && (
              <p className="text-xs text-red-500">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="phone"
              className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 pl-1"
            >
              {t('workers:form.phone', 'Phone Number')}
            </Label>
            <Input
              id="phone"
              placeholder={t('workers:placeholders.phone', {
                defaultValue: '+1234567890',
              })}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={`h-11 bg-black/5 dark:bg-white/5 border-transparent focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-all font-medium text-sm px-4 rounded-xl ${errors.phone ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
              style={{ color: 'var(--text-landing-primary)' }}
            />
            {errors.phone && (
              <p className="text-xs text-red-500">{errors.phone}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label
                htmlFor="wage"
                className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 pl-1"
              >
                {t('workers:form.wage', 'Wage Amount')}
              </Label>
              <Input
                id="wage"
                type="number"
                placeholder={t('workers:placeholders.wageRate', {
                  defaultValue: '0.00',
                })}
                value={wageRateAmount}
                onChange={(e) => setWageRateAmount(e.target.value)}
                className={`h-11 bg-black/5 dark:bg-white/5 border-transparent focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-all font-medium text-sm px-4 rounded-xl ${errors.wageRateAmount ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                style={{ color: 'var(--text-landing-primary)' }}
              />
              {errors.wageRateAmount && (
                <p className="text-xs text-red-500">{errors.wageRateAmount}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 pl-1">
                {t('workers:form.rate', 'Rate Type')}
              </Label>
              <Select
                value={wageRateType}
                onValueChange={(val: any) => setWageRateType(val)}
              >
                <SelectTrigger
                  className="h-11 bg-black/5 dark:bg-white/5 border-transparent focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-all font-medium text-sm px-4 rounded-xl"
                  style={{ color: 'var(--text-landing-primary)' }}
                >
                  <SelectValue
                    placeholder={t('workers:placeholders.selectType', {
                      defaultValue: 'Select type',
                    })}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hourly">Hourly</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t('common:cancel', 'Cancel')}
            </Button>
            <Button type="submit" disabled={createWorker.isPending}>
              {createWorker.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {t('common:save', 'Save Worker')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
