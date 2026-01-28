import { useState } from 'react'
import type { SensorType } from '~/lib/db/types'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '~/components/ui/dialog'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
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
  defaultValues
}: SensorFormDialogProps) {
  const [name, setName] = useState(defaultValues?.name ?? '')
  const [sensorType, setSensorType] = useState<SensorType>(defaultValues?.sensorType ?? 'temperature')
  const [structureId, setStructureId] = useState(defaultValues?.structureId ?? '')
  const [pollingInterval, setPollingInterval] = useState(defaultValues?.pollingIntervalMinutes ?? 15)
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
        pollingIntervalMinutes: pollingInterval
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
              <Button onClick={copyApiKey} variant="outline">Copy</Button>
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
          <DialogTitle>{mode === 'create' ? 'Add Sensor' : 'Edit Sensor'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Sensor name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Sensor Type</Label>
            <Select value={sensorType} onValueChange={(v) => setSensorType((v || 'temperature') as SensorType)}>
              <SelectTrigger>
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
            <Label>Structure (optional)</Label>
            <Select value={structureId} onValueChange={(v) => setStructureId(v || '')}>
              <SelectTrigger>
                <SelectValue placeholder="Select structure" />
              </SelectTrigger>
              <SelectContent>
                {structures.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Polling Interval</Label>
            <Select value={String(pollingInterval)} onValueChange={(v) => setPollingInterval(Number(v) || 15)}>
              <SelectTrigger>
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
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !name}>
              {loading ? 'Saving...' : mode === 'create' ? 'Create' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
