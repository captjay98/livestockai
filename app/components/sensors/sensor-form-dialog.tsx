import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { SensorType } from '~/lib/db/types'
import {
  Dialog,
  DialogContent,
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
import { POLLING_INTERVALS, SENSOR_TYPES } from '~/features/sensors/constants'

interface SensorFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  structures: Array<{ id: string; name: string }>
  onSubmit: (data: {
    name: string
    sensorType: SensorType
    structureId?: string
    pollingIntervalMinutes: number
  }) => Promise<{ sensorId: string; apiKey?: string }>
  mode: 'create' | 'edit'
  defaultValues?: {
    name?: string
    sensorType?: SensorType
    structureId?: string
    pollingIntervalMinutes?: number
  }
}

export function SensorFormDialog({
  open,
  onOpenChange,
  structures,
  onSubmit,
  mode,
  defaultValues,
}: SensorFormDialogProps) {
  const { t } = useTranslation(['sensors', 'common'])
  const [name, setName] = useState(defaultValues?.name ?? '')
  const [sensorType, setSensorType] = useState<SensorType>(
    defaultValues?.sensorType ?? 'temperature',
  )
  const [structureId, setStructureId] = useState(
    defaultValues?.structureId ?? '',
  )
  const [pollingInterval, setPollingInterval] = useState(
    defaultValues?.pollingIntervalMinutes ?? 15,
  )
  const [loading, setLoading] = useState(false)
  const [apiKey, setApiKey] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const result = await onSubmit({
        name,
        sensorType,
        structureId: structureId || undefined,
        pollingIntervalMinutes: pollingInterval,
      })
      if (result.apiKey) {
        setApiKey(result.apiKey)
      } else {
        onOpenChange(false)
      }
    } finally {
      setLoading(false)
    }
  }

  const copyApiKey = () => {
    if (apiKey) navigator.clipboard.writeText(apiKey)
  }

  if (apiKey) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sensor Created</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Save this API key - it won't be shown again:
            </p>
            <div className="flex gap-2">
              <Input value={apiKey} readOnly className="font-mono text-xs" />
              <Button onClick={copyApiKey} variant="outline">
                Copy
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => onOpenChange(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === 'create'
              ? t('sensors:actions.addSensor', { defaultValue: 'Add Sensor' })
              : t('sensors:actions.editSensor', {
                  defaultValue: 'Edit Sensor',
                })}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label
              htmlFor="name"
              className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 pl-1"
            >
              Name
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('sensors:placeholders.sensorName', {
                defaultValue: 'Sensor name',
              })}
              required
              className="h-11 bg-black/5 dark:bg-white/5 border-transparent focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-all font-medium text-sm px-4 rounded-xl"
              style={{ color: 'var(--text-landing-primary)' }}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 pl-1">
              Sensor Type
            </Label>
            <Select
              value={sensorType}
              onValueChange={(v) =>
                setSensorType((v || 'temperature') as SensorType)
              }
            >
              <SelectTrigger
                className="h-11 bg-black/5 dark:bg-white/5 border-transparent focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-all font-medium text-sm px-4 rounded-xl"
                style={{ color: 'var(--text-landing-primary)' }}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SENSOR_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type.replace(/_/g, ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 pl-1">
              Structure (optional)
            </Label>
            <Select
              value={structureId}
              onValueChange={(v) => setStructureId(v || '')}
            >
              <SelectTrigger
                className="h-11 bg-black/5 dark:bg-white/5 border-transparent focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-all font-medium text-sm px-4 rounded-xl"
                style={{ color: 'var(--text-landing-primary)' }}
              >
                <SelectValue
                  placeholder={t('sensors:placeholders.selectStructure', {
                    defaultValue: 'Select structure',
                  })}
                />
              </SelectTrigger>
              <SelectContent>
                {structures.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 pl-1">
              Polling Interval
            </Label>
            <Select
              value={String(pollingInterval)}
              onValueChange={(v) => setPollingInterval(Number(v) || 15)}
            >
              <SelectTrigger
                className="h-11 bg-black/5 dark:bg-white/5 border-transparent focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-all font-medium text-sm px-4 rounded-xl"
                style={{ color: 'var(--text-landing-primary)' }}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {POLLING_INTERVALS.map((interval) => (
                  <SelectItem key={interval} value={String(interval)}>
                    {interval} minutes
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !name}>
              {loading
                ? t('common:saving', { defaultValue: 'Saving...' })
                : mode === 'create'
                  ? t('common:create', { defaultValue: 'Create' })
                  : t('common:save', { defaultValue: 'Save' })}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
