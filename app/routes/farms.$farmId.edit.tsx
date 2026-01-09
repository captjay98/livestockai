import {
  Link,
  createFileRoute,
  redirect,
  useRouter,
} from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { getFarmById, updateFarm } from '~/lib/farms/server'
import { requireAuth } from '~/lib/auth/middleware'
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

interface Farm {
  id: string
  name: string
  location: string
  type: 'poultry' | 'fishery' | 'mixed'
}

const getFarmForEdit = createServerFn({ method: 'GET' })
  .inputValidator((data: { farmId: string }) => data)
  .handler(async ({ data }) => {
    try {
      const session = await requireAuth()
      return await getFarmById(data.farmId, session.user.id)
    } catch (error) {
      if (error instanceof Error && error.message === 'UNAUTHORIZED') {
        throw redirect({ to: '/login' })
      }
      throw error
    }
  })

interface UpdateFarmInput {
  farmId: string
  name: string
  location: string
  type: 'poultry' | 'fishery' | 'mixed'
}

const updateFarmAction = createServerFn({ method: 'POST' })
  .inputValidator((data: UpdateFarmInput) => data)
  .handler(async ({ data }) => {
    try {
      const session = await requireAuth()
      await updateFarm(data.farmId, session.user.id, {
        name: data.name,
        location: data.location,
        type: data.type,
      })
      return { success: true }
    } catch (error) {
      if (error instanceof Error && error.message === 'UNAUTHORIZED') {
        throw redirect({ to: '/login' })
      }
      throw error
    }
  })

export const Route = createFileRoute('/farms/$farmId/edit')({
  component: EditFarmPage,
  loader: ({ params }) => getFarmForEdit({ data: { farmId: params.farmId } }),
})

function EditFarmPage() {
  const router = useRouter()
  const farm = Route.useLoaderData()
  const { farmId } = Route.useParams()

  const [formData, setFormData] = useState({
    name: farm?.name || '',
    location: farm?.location || '',
    type: (farm?.type || 'poultry'),
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  if (!farm) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Farm not found</h1>
          <p className="text-muted-foreground mb-4">
            The farm you're trying to edit doesn't exist or you don't have
            access to it.
          </p>
          <Link to="/farms">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Farms
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
      await updateFarmAction({ data: { farmId, ...formData } })
      router.navigate({ to: '/farms/$farmId', params: { farmId } })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update farm')
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
          <h1 className="text-3xl font-bold">Edit Farm</h1>
          <p className="text-muted-foreground mt-1">
            Update your farm information
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Farm Details</CardTitle>
          <CardDescription>
            Update the information for your farm
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
                  if (
                    value &&
                    (value === 'poultry' ||
                      value === 'fishery' ||
                      value === 'mixed')
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
                {isSubmitting ? 'Updating...' : 'Update Farm'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
