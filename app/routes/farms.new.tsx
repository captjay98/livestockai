import { createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { createFarm } from '~/lib/farms/server'
import { requireAuth } from '~/lib/auth/server-middleware'
import { Button } from '~/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'

interface CreateFarmInput {
  name: string
  location: string
  type: 'poultry' | 'fishery' | 'mixed'
}

const createFarmAction = createServerFn({ method: 'POST' })
  .inputValidator((data: CreateFarmInput) => data)
  .handler(async ({ data }) => {
    try {
      await requireAuth()
      const farmId = await createFarm(data)
      return { success: true, farmId }
    } catch (error) {
      if (error instanceof Error && error.message === 'UNAUTHORIZED') {
        throw redirect({ to: '/login' })
      }
      throw error
    }
  })

export const Route = createFileRoute('/farms/new')({
  component: NewFarmPage,
})

function NewFarmPage() {
  const router = useRouter()
  const [formData, setFormData] = useState<CreateFarmInput>({
    name: '',
    location: '',
    type: 'poultry',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
      await createFarmAction({ data: formData })
      router.navigate({ to: '/farms' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create farm')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-2xl">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" onClick={() => router.history.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Create New Farm</h1>
          <p className="text-muted-foreground mt-1">
            Add a new farm to your management system
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Farm Details</CardTitle>
          <CardDescription>
            Enter the basic information for your new farm
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Farm Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Enter farm name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev) => ({ ...prev, location: e.target.value }))
                }
                placeholder="Enter farm location"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Farm Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => {
                  if (value === 'poultry' || value === 'fishery' || value === 'mixed') {
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

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.history.back()}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !formData.name || !formData.location}
              >
                {isSubmitting ? 'Creating...' : 'Create Farm'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
