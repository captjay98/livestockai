import { useEffect, useState } from 'react'
import { useRouter } from '@tanstack/react-router'
import { ChevronDown, ChevronUp, Users } from 'lucide-react'
import { SOURCE_SIZE_OPTIONS, createBatchFn } from '~/lib/batches/server'
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '~/components/ui/collapsible'

interface Structure {
  id: string
  name: string
  type: string
}

interface Supplier {
  id: string
  name: string
}

interface BatchDialogProps {
  farmId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  structures?: Array<Structure>
  suppliers?: Array<Supplier>
}

const LIVESTOCK_TYPES = [
  { value: 'poultry', label: 'Poultry' },
  { value: 'fish', label: 'Fish' },
]

const SPECIES_OPTIONS = {
  poultry: [
    { value: 'broiler', label: 'Broiler' },
    { value: 'layer', label: 'Layer' },
    { value: 'cockerel', label: 'Cockerel' },
    { value: 'turkey', label: 'Turkey' },
  ],
  fish: [
    { value: 'catfish', label: 'Catfish' },
    { value: 'tilapia', label: 'Tilapia' },
  ],
}

export function BatchDialog({
  farmId,
  open,
  onOpenChange,
  structures = [],
  suppliers = [],
}: BatchDialogProps) {
  const router = useRouter()
  const [formData, setFormData] = useState({
    livestockType: '' as 'poultry' | 'fish' | '',
    species: '',
    initialQuantity: '',
    costPerUnit: '',
    acquisitionDate: new Date().toISOString().split('T')[0],
    // Enhanced fields
    batchName: '',
    sourceSize: '',
    structureId: '',
    targetHarvestDate: '',
    target_weight_g: '',
    supplierId: '',
    notes: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [showAdditional, setShowAdditional] = useState(false)

  // Reset species and sourceSize when livestock type changes
  useEffect(() => {
    setFormData((prev) => ({ ...prev, species: '', sourceSize: '' }))
  }, [formData.livestockType])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.livestockType) return
    setIsSubmitting(true)
    setError('')

    try {
      await createBatchFn({
        data: {
          batch: {
            farmId,
            livestockType: formData.livestockType,
            species: formData.species,
            initialQuantity: parseInt(formData.initialQuantity),
            costPerUnit: parseFloat(formData.costPerUnit),
            acquisitionDate: new Date(formData.acquisitionDate),
            // Enhanced fields
            batchName: formData.batchName || null,
            sourceSize: formData.sourceSize || null,
            structureId: formData.structureId || null,
            targetHarvestDate: formData.targetHarvestDate
              ? new Date(formData.targetHarvestDate)
              : null,
            target_weight_g: formData.target_weight_g
              ? parseInt(formData.target_weight_g)
              : null,
            supplierId: formData.supplierId || null,
            notes: formData.notes || null,
          },
        },
      })
      onOpenChange(false)
      setFormData({
        livestockType: '',
        species: '',
        initialQuantity: '',
        costPerUnit: '',
        acquisitionDate: new Date().toISOString().split('T')[0],
        batchName: '',
        sourceSize: '',
        structureId: '',
        targetHarvestDate: '',
        target_weight_g: '',
        supplierId: '',
        notes: '',
      })
      setShowAdditional(false)
      router.invalidate()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create batch')
    } finally {
      setIsSubmitting(false)
    }
  }

  const speciesOptions = formData.livestockType
    ? SPECIES_OPTIONS[formData.livestockType]
    : []

  const sourceSizeOptions = formData.livestockType
    ? SOURCE_SIZE_OPTIONS[formData.livestockType]
    : []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Add New Batch
          </DialogTitle>
          <DialogDescription>Create a new livestock batch</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="livestockType">Livestock Type</Label>
            <Select
              value={formData.livestockType}
              onValueChange={(value) =>
                value &&
                setFormData((prev) => ({
                  ...prev,
                  livestockType: value,
                }))
              }
            >
              <SelectTrigger>
                <SelectValue>
                  {formData.livestockType
                    ? LIVESTOCK_TYPES.find(
                      (t) => t.value === formData.livestockType,
                    )?.label
                    : 'Select type'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {LIVESTOCK_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {formData.livestockType && (
            <div className="space-y-2">
              <Label htmlFor="species">Species</Label>
              <Select
                value={formData.species}
                onValueChange={(value) =>
                  value && setFormData((prev) => ({ ...prev, species: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue>
                    {formData.species
                      ? speciesOptions.find((s) => s.value === formData.species)
                        ?.label
                      : 'Select species'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {speciesOptions.map((species) => (
                    <SelectItem key={species.value} value={species.value}>
                      {species.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="initialQuantity">Quantity</Label>
              <Input
                id="initialQuantity"
                type="number"
                min="1"
                value={formData.initialQuantity}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    initialQuantity: e.target.value,
                  }))
                }
                placeholder="100"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="costPerUnit">Cost/Unit (₦)</Label>
              <Input
                id="costPerUnit"
                type="number"
                min="0"
                step="0.01"
                value={formData.costPerUnit}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    costPerUnit: e.target.value,
                  }))
                }
                placeholder="500"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="acquisitionDate">Acquisition Date</Label>
            <Input
              id="acquisitionDate"
              type="date"
              value={formData.acquisitionDate}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  acquisitionDate: e.target.value,
                }))
              }
              required
            />
          </div>

          {/* Additional Details Section */}
          <Collapsible open={showAdditional} onOpenChange={setShowAdditional}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                type="button"
                className="w-full justify-between p-0 h-auto font-normal text-muted-foreground hover:text-foreground"
              >
                <span>Additional Details</span>
                {showAdditional ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="batchName">Batch Name (Optional)</Label>
                <Input
                  id="batchName"
                  value={formData.batchName}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      batchName: e.target.value,
                    }))
                  }
                  placeholder="e.g., JAN-2026-BR-01"
                />
              </div>

              {formData.livestockType && (
                <div className="space-y-2">
                  <Label htmlFor="sourceSize">Source Size (Optional)</Label>
                  <Select
                    value={formData.sourceSize || undefined}
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        sourceSize: value || '',
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select source size" />
                    </SelectTrigger>
                    <SelectContent>
                      {sourceSizeOptions.map((size) => (
                        <SelectItem key={size.value} value={size.value}>
                          {size.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {structures.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="structureId">Structure (Optional)</Label>
                  <Select
                    value={formData.structureId || undefined}
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        structureId: value || '',
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select structure" />
                    </SelectTrigger>
                    <SelectContent>
                      {structures.map((structure) => (
                        <SelectItem key={structure.id} value={structure.id}>
                          {structure.name} ({structure.type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {suppliers.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="supplierId">Supplier (Optional)</Label>
                  <Select
                    value={formData.supplierId || undefined}
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        supplierId: value || '',
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select supplier" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="targetHarvestDate">
                  Target Harvest Date (Optional)
                </Label>
                <Input
                  id="targetHarvestDate"
                  type="date"
                  value={formData.targetHarvestDate}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      targetHarvestDate: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      notes: e.target.value,
                    }))
                  }
                  placeholder="Any additional notes about this batch..."
                  rows={3}
                />
              </div>
            </CollapsibleContent>
          </Collapsible>

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
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                isSubmitting ||
                !formData.livestockType ||
                !formData.species ||
                !formData.initialQuantity ||
                !formData.costPerUnit
              }
            >
              {isSubmitting ? 'Creating...' : 'Create Batch'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
