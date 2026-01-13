import { toast } from 'sonner'
import { useState } from 'react'
import { useRouter } from '@tanstack/react-router'
import { ChevronDown, ChevronUp, Scale } from 'lucide-react'
import { createWeightSampleFn } from '~/features/weight/server'
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

interface WeightDialogProps {
  farmId: string
  batches: Array<Batch>
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function WeightDialog({ farmId, batches, open, onOpenChange }: WeightDialogProps) {
  const router = useRouter()
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [formData, setFormData] = useState({
    batchId: '',
    date: new Date().toISOString().split('T')[0],
    sampleSize: '',
    averageWeightKg: '',
    minWeightKg: '',
    maxWeightKg: '',
    notes: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const selectedBatch = batches.find((b) => b.id === formData.batchId)
  const estimatedTotal =
    formData.averageWeightKg && selectedBatch
      ? (parseFloat(formData.averageWeightKg) * selectedBatch.currentQuantity).toFixed(1)
      : null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
      await createWeightSampleFn({
        data: {
          farmId,
          data: {
            batchId: formData.batchId,
            date: new Date(formData.date),
            sampleSize: parseInt(formData.sampleSize),
            averageWeightKg: parseFloat(formData.averageWeightKg),
            minWeightKg: formData.minWeightKg ? parseFloat(formData.minWeightKg) : null,
            maxWeightKg: formData.maxWeightKg ? parseFloat(formData.maxWeightKg) : null,
            notes: formData.notes || null,
          },
        },
      })
      toast.success('Weight recorded')
      onOpenChange(false)
      setFormData({ batchId: '', date: new Date().toISOString().split('T')[0], sampleSize: '', averageWeightKg: '', minWeightKg: '', maxWeightKg: '', notes: '' })
      router.invalidate()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            Weight Sample
          </DialogTitle>
          <DialogDescription>Record a weight sample for growth tracking</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Batch *</Label>
            <Select
              value={formData.batchId}
              onValueChange={(value) => value && setFormData((prev) => ({ ...prev, batchId: value }))}
            >
              <SelectTrigger>
                <SelectValue>
                  {formData.batchId ? batches.find((b) => b.id === formData.batchId)?.species : 'Select batch'}
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

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Date *</Label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Sample Size *</Label>
              <Input
                type="number"
                min="1"
                value={formData.sampleSize}
                onChange={(e) => setFormData((prev) => ({ ...prev, sampleSize: e.target.value }))}
                placeholder="e.g., 10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Average Weight (kg) *</Label>
            <Input
              type="number"
              step="0.001"
              min="0"
              value={formData.averageWeightKg}
              onChange={(e) => setFormData((prev) => ({ ...prev, averageWeightKg: e.target.value }))}
              placeholder="e.g., 1.5"
              required
            />
          </div>

          {estimatedTotal && (
            <div className="p-3 bg-muted rounded-lg text-sm">
              Estimated batch total: <span className="font-medium">{estimatedTotal} kg</span>
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            {showAdvanced ? 'Hide' : 'Show'} additional details
          </button>

          {showAdvanced && (
            <div className="space-y-3 p-3 border rounded-lg bg-muted/30">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Min Weight (kg)</Label>
                  <Input
                    type="number"
                    step="0.001"
                    min="0"
                    value={formData.minWeightKg}
                    onChange={(e) => setFormData((prev) => ({ ...prev, minWeightKg: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max Weight (kg)</Label>
                  <Input
                    type="number"
                    step="0.001"
                    min="0"
                    value={formData.maxWeightKg}
                    onChange={(e) => setFormData((prev) => ({ ...prev, maxWeightKg: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional observations"
                  rows={2}
                />
              </div>
            </div>
          )}

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !formData.batchId || !formData.sampleSize || !formData.averageWeightKg}
            >
              {isSubmitting ? 'Recording...' : 'Record Sample'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
