import { useEffect, useState } from 'react'
import { useRouter } from '@tanstack/react-router'
import { Building2 } from 'lucide-react'
import { getFarmByIdFn, updateFarmFn } from '~/lib/farms/server'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'

interface EditFarmDialogProps {
  farmId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function EditFarmDialog({
  farmId,
  open,
  onOpenChange,
  onSuccess,
}: EditFarmDialogProps) {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    type: 'poultry' as 'poultry' | 'fishery' | 'mixed',
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Load farm data when dialog opens
  useEffect(() => {
    const loadFarm = async () => {
      if (open && farmId) {
        try {
          const farmData = await getFarmByIdFn({ data: { farmId } })
          if (farmData) {
            setFormData({
              name: farmData.name,
              location: farmData.location,
              type: farmData.type as 'poultry' | 'fishery' | 'mixed',
            })
          }
        } catch (err) {
          console.error('Failed to load farm:', err)
        } finally {
          setIsLoading(false)
        }
      }
    }
    loadFarm()
  }, [open, farmId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
      await updateFarmFn({
        data: {
          farmId,
          name: formData.name,
          location: formData.location,
          type: formData.type,
        },
      })
      onOpenChange(false)
      if (onSuccess) onSuccess()
      router.invalidate()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update farm')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Edit Farm
          </DialogTitle>
          <DialogDescription>Update your farm information</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4 py-4">
            <div className="h-10 bg-muted animate-pulse rounded" />
            <div className="h-10 bg-muted animate-pulse rounded" />
            <div className="h-10 bg-muted animate-pulse rounded" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-farm-name">Farm Name</Label>
              <Input
                id="edit-farm-name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Enter farm name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-farm-location">Location</Label>
              <Input
                id="edit-farm-location"
                value={formData.location}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, location: e.target.value }))
                }
                placeholder="Enter farm location"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-farm-type">Farm Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => {
                  if (
                    value === 'poultry' ||
                    value === 'fishery' ||
                    value === 'mixed'
                  ) {
                    setFormData((prev) => ({ ...prev, type: value }))
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="poultry">Poultry</SelectItem>
                  <SelectItem value="fishery">Fishery</SelectItem>
                  <SelectItem value="mixed">Mixed</SelectItem>
                </SelectContent>
              </Select>
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
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !formData.name || !formData.location}
              >
                {isSubmitting ? 'Updating...' : 'Update Farm'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
