import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useRouter } from '@tanstack/react-router'
import { AlertTriangle, Loader2 } from 'lucide-react'
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
  deactivateRegionFn,
  updateRegionFn,
} from '~/features/extension/admin-server'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '~/components/ui/alert-dialog'

interface Region {
  id: string
  name: string
  slug: string
  isActive: boolean
  farmCount: number
  agentCount: number
}

interface EditRegionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  region: Region
  onSuccess?: () => void
}

export function EditRegionDialog({
  open,
  onOpenChange,
  region,
  onSuccess,
}: EditRegionDialogProps) {
  const { t } = useTranslation(['extension', 'common'])
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false)

  const [name, setName] = useState(region.name)
  const [slug, setSlug] = useState(region.slug)

  const handleNameChange = (value: string) => {
    setName(value)
    // Auto-generate slug from name
    setSlug(
      value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, ''),
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      await updateRegionFn({
        data: {
          id: region.id,
          name,
          slug,
        },
      })

      onSuccess?.()
      router.invalidate()
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update region')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeactivate = async () => {
    setError(null)
    setIsSubmitting(true)

    try {
      await deactivateRegionFn({
        data: {
          id: region.id,
        },
      })

      onSuccess?.()
      router.invalidate()
      setShowDeactivateDialog(false)
      onOpenChange(false)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to deactivate region',
      )
      setShowDeactivateDialog(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  const canDeactivate = region.farmCount === 0 && region.isActive

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {t('extension:admin.editRegion', {
                  defaultValue: 'Edit Region',
                })}
              </DialogTitle>
              <DialogDescription>
                {t('extension:admin.editRegionDescription', {
                  defaultValue: 'Update the name and slug for this region.',
                })}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {error && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder={t('admin.placeholders.regionName', {
                    defaultValue: 'e.g., Kano, Lagos, Abuja',
                  })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">Slug *</Label>
                <Input
                  id="slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder={t('admin.placeholders.regionSlug', {
                    defaultValue: 'e.g., kano, lagos, abuja',
                  })}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  URL-friendly identifier (auto-generated from name)
                </p>
              </div>

              {region.farmCount > 0 && (
                <div className="rounded-md bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-200">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                    <div>
                      <p className="font-medium">
                        {t('extension:cannotDeactivate', {
                          defaultValue: 'Cannot deactivate',
                        })}
                      </p>
                      <p className="mt-1 text-xs">
                        {t('extension:regionHasFarms', {
                          defaultValue:
                            'This region has {{count}} farm(s) assigned. Reassign farms before deactivating.',
                          count: region.farmCount,
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
              <div>
                {canDeactivate && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => setShowDeactivateDialog(true)}
                    disabled={isSubmitting}
                  >
                    Deactivate
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting || !name || !slug}>
                  {isSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {t('common:saveChanges', { defaultValue: 'Save Changes' })}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={showDeactivateDialog}
        onOpenChange={setShowDeactivateDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('extension:admin.deactivateRegion', {
                defaultValue: 'Deactivate Region',
              })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('extension:admin.deactivateRegionDescription', {
                defaultValue:
                  'Are you sure you want to deactivate "{{name}}"? This will hide it from selection lists but preserve historical data.',
                name: region.name,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeactivate}
              disabled={isSubmitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
