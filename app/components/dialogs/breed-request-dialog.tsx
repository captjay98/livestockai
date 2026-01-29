import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '~/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Textarea } from '~/components/ui/textarea'

interface BreedRequestDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: {
    breedName: string
    typicalMarketWeightG?: number
    typicalDaysToMarket?: number
    typicalFcr?: number
    source?: string
    userEmail?: string
    notes?: string
  }) => Promise<void>
}

export function BreedRequestDialog({
  open,
  onOpenChange,
  onSubmit,
}: BreedRequestDialogProps) {
  const [formData, setFormData] = useState({
    breedName: '',
    typicalMarketWeightG: '',
    typicalDaysToMarket: '',
    typicalFcr: '',
    source: '',
    userEmail: '',
    notes: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await onSubmit({
        breedName: formData.breedName,
        typicalMarketWeightG: formData.typicalMarketWeightG
          ? parseInt(formData.typicalMarketWeightG)
          : undefined,
        typicalDaysToMarket: formData.typicalDaysToMarket
          ? parseInt(formData.typicalDaysToMarket)
          : undefined,
        typicalFcr: formData.typicalFcr
          ? parseFloat(formData.typicalFcr)
          : undefined,
        source: formData.source || undefined,
        userEmail: formData.userEmail || undefined,
        notes: formData.notes || undefined,
      })
      toast.success("Breed request submitted! We'll review it soon.")
      onOpenChange(false)
      setFormData({
        breedName: '',
        typicalMarketWeightG: '',
        typicalDaysToMarket: '',
        typicalFcr: '',
        source: '',
        userEmail: '',
        notes: '',
      })
    } catch (err) {
      toast.error('Failed to submit request')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Request a Breed</DialogTitle>
          <DialogDescription>
            Don't see your breed? Let us know and we'll add it to the database.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="breedName">
              Breed Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="breedName"
              value={formData.breedName}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  breedName: e.target.value,
                }))
              }
              placeholder="e.g., Hubbard Classic"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="typicalMarketWeightG">Market Weight (g)</Label>
              <Input
                id="typicalMarketWeightG"
                type="number"
                value={formData.typicalMarketWeightG}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    typicalMarketWeightG: e.target.value,
                  }))
                }
                placeholder="2800"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="typicalDaysToMarket">Days to Market</Label>
              <Input
                id="typicalDaysToMarket"
                type="number"
                value={formData.typicalDaysToMarket}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    typicalDaysToMarket: e.target.value,
                  }))
                }
                placeholder="42"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="typicalFcr">Typical FCR</Label>
            <Input
              id="typicalFcr"
              type="number"
              step="0.01"
              value={formData.typicalFcr}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  typicalFcr: e.target.value,
                }))
              }
              placeholder="1.65"
            />
            <p className="text-xs text-muted-foreground">
              Feed Conversion Ratio (if known)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="source">Source (Hatchery/Supplier)</Label>
            <Input
              id="source"
              value={formData.source}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  source: e.target.value,
                }))
              }
              placeholder="e.g., Zartech Hatchery"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="userEmail">Your Email (for follow-up)</Label>
            <Input
              id="userEmail"
              type="email"
              value={formData.userEmail}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  userEmail: e.target.value,
                }))
              }
              placeholder="you@example.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  notes: e.target.value,
                }))
              }
              placeholder="Any additional information about this breed..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
