import { useEffect, useState } from 'react'
import { AlertCircle, Loader2 } from 'lucide-react'
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
import { getRegionTreeFn, updateSpeciesThresholdFn  } from '~/features/extension/admin-server'
import { Badge } from '~/components/ui/badge'

interface EditThresholdDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  threshold: {
    species: string
    regionId?: string
    regionName?: string
    amberThreshold: number
    redThreshold: number
  }
  onSuccess?: () => void
}

export function EditThresholdDialog({
  open,
  onOpenChange,
  threshold,
  onSuccess,
}: EditThresholdDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [regions, setRegions] = useState<
    Array<{ id: string; name: string; level: number }>
  >([])

  const [regionId, setRegionId] = useState(threshold.regionId || '')
  const [amberThreshold, setAmberThreshold] = useState(
    threshold.amberThreshold.toString(),
  )
  const [redThreshold, setRedThreshold] = useState(
    threshold.redThreshold.toString(),
  )

  // Load regions for override selection
  useEffect(() => {
    if (open && !threshold.regionId) {
      getRegionTreeFn().then((tree) => {
        const allRegions: Array<{ id: string; name: string; level: number }> =
          []
        tree.forEach((country) => {
          country.regions.forEach((region) => {
            allRegions.push({
              id: region.id,
              name: `${region.name} (${country.name})`,
              level: region.level,
            })
            region.districts?.forEach((district) => {
              allRegions.push({
                id: district.id,
                name: `${district.name} (${region.name})`,
                level: district.level,
              })
            })
          })
        })
        setRegions(allRegions)
      })
    }
  }, [open, threshold.regionId])

  const amber = parseFloat(amberThreshold)
  const red = parseFloat(redThreshold)
  const isValid = !isNaN(amber) && !isNaN(red) && amber > 0 && red > 0 && amber < red

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!isValid) {
      setError('Amber threshold must be less than red threshold')
      return
    }

    setIsSubmitting(true)

    try {
      await updateSpeciesThresholdFn({
        data: {
          species: threshold.species as any,
          regionId: regionId || undefined,
          amberThreshold: amber,
          redThreshold: red,
        },
      })

      onSuccess?.()
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update threshold')
    } finally {
      setIsSubmitting(false)
    }
  }

  const speciesLabels: Record<string, string> = {
    broiler: 'Broiler Chicken',
    layer: 'Layer Chicken',
    catfish: 'Catfish',
    tilapia: 'Tilapia',
    cattle: 'Cattle',
    goats: 'Goats',
    sheep: 'Sheep',
    bees: 'Bees',
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {threshold.regionId ? 'Edit' : 'Add'} Threshold Override
            </DialogTitle>
            <DialogDescription>
              Configure mortality thresholds for{' '}
              {speciesLabels[threshold.species] || threshold.species}
              {threshold.regionName && ` in ${threshold.regionName}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {!threshold.regionId && (
              <div className="space-y-2">
                <Label htmlFor="region">Region (Optional)</Label>
                <Select
                  value={regionId}
                  onValueChange={(v) => setRegionId(v || '')}
                >
                  <SelectTrigger id="region">
                    <SelectValue placeholder="Global default (no region)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Global default</SelectItem>
                    {regions.map((region) => (
                      <SelectItem key={region.id} value={region.id}>
                        {region.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Leave empty for global default, or select a region for an
                  override
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="amber">Amber Threshold (%) *</Label>
              <Input
                id="amber"
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={amberThreshold}
                onChange={(e) => setAmberThreshold(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Mortality rate at which health status becomes "warning"
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="red">Red Threshold (%) *</Label>
              <Input
                id="red"
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={redThreshold}
                onChange={(e) => setRedThreshold(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Mortality rate at which health status becomes "critical"
              </p>
            </div>

            {!isValid && amber >= red && (
              <div className="flex items-start gap-2 rounded-md bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-200">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <p>Amber threshold must be less than red threshold</p>
              </div>
            )}

            {isValid && (
              <div className="rounded-md border p-3">
                <p className="mb-2 text-sm font-medium">Preview:</p>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center justify-between">
                    <span>0% - {amber}%</span>
                    <Badge className="bg-green-500">Healthy</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>
                      {amber}% - {red}%
                    </span>
                    <Badge className="bg-amber-500">Warning</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>{red}%+</span>
                    <Badge className="bg-red-500">Critical</Badge>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !isValid}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
