import { useState } from 'react'
import { useRouter } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'
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
import { createRegionFn } from '~/features/extension/admin-server'

interface Country {
  id: string
  code: string
  name: string
  regions: Array<{
    id: string
    name: string
    level: 1 | 2
  }>
}

interface CreateRegionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  countries: Array<Country>
  defaultCountryId?: string
  defaultParentId?: string
  onSuccess?: () => void
}

export function CreateRegionDialog({
  open,
  onOpenChange,
  countries,
  defaultCountryId,
  defaultParentId,
  onSuccess,
}: CreateRegionDialogProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [countryId, setCountryId] = useState(defaultCountryId || '')
  const [parentId, setParentId] = useState(defaultParentId || '')
  const [level, setLevel] = useState<'1' | '2'>(defaultParentId ? '2' : '1')
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')

  const selectedCountry = countries.find((c) => c.id === countryId)
  const level1Regions = selectedCountry?.regions.filter((r) => r.level === 1)

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
      await createRegionFn({
        data: {
          countryId,
          parentId: level === '2' ? parentId : undefined,
          level: Number(level) as 1 | 2,
          name,
          slug,
        },
      })

      onSuccess?.()
      router.invalidate()
      onOpenChange(false)

      // Reset form
      setCountryId(defaultCountryId || '')
      setParentId(defaultParentId || '')
      setLevel(defaultParentId ? '2' : '1')
      setName('')
      setSlug('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create region')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Region or District</DialogTitle>
            <DialogDescription>
              Create a new region (level 1) or district (level 2) for extension
              services.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="country">Country *</Label>
              <Select
                value={countryId}
                onValueChange={(v) => setCountryId(v || '')}
                disabled={!!defaultCountryId}
              >
                <SelectTrigger id="country">
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((country) => (
                    <SelectItem key={country.id} value={country.id}>
                      {country.code} - {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="level">Level *</Label>
              <Select
                value={level}
                onValueChange={(v) => setLevel(v as '1' | '2')}
                disabled={!!defaultParentId}
              >
                <SelectTrigger id="level">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Level 1 (Region/State)</SelectItem>
                  <SelectItem value="2">Level 2 (District)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {level === '2' && (
              <div className="space-y-2">
                <Label htmlFor="parent">Parent Region *</Label>
                <Select
                  value={parentId}
                  onValueChange={(v) => setParentId(v || '')}
                  disabled={!!defaultParentId || !countryId}
                >
                  <SelectTrigger id="parent">
                    <SelectValue placeholder="Select parent region" />
                  </SelectTrigger>
                  <SelectContent>
                    {level1Regions?.map((region) => (
                      <SelectItem key={region.id} value={region.id}>
                        {region.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g., Kano, Lagos, Abuja"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug *</Label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="e.g., kano, lagos, abuja"
                required
              />
              <p className="text-xs text-muted-foreground">
                URL-friendly identifier (auto-generated from name)
              </p>
            </div>
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
            <Button
              type="submit"
              disabled={
                isSubmitting ||
                !countryId ||
                !name ||
                !slug ||
                (level === '2' && !parentId)
              }
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
