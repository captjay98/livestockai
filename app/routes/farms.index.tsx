import {
  Link,
  createFileRoute,
  redirect,
  useRouter,
} from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { Building2, MapPin, Plus } from 'lucide-react'
import { useState } from 'react'
import { createFarm, getFarmsForUser } from '~/lib/farms/server'
import { requireAuth } from '~/lib/auth/middleware'
import { Button, buttonVariants } from '~/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '~/components/ui/dialog'
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

interface CreateFarmInput {
  name: string
  location: string
  type: 'poultry' | 'fishery' | 'mixed'
}

const getFarms = createServerFn({ method: 'GET' }).handler(async () => {
  try {
    const session = await requireAuth()
    const farms = await getFarmsForUser(session.user.id)
    return { farms }
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      throw redirect({ to: '/login' })
    }
    throw error
  }
})

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

export const Route = createFileRoute('/farms/')({
  component: FarmsIndexPage,
  loader: () => getFarms(),
})

function FarmsIndexPage() {
  const router = useRouter()
  const loaderData = Route.useLoaderData()
  const farms = (loaderData?.farms ?? []) as Array<Farm>

  const [dialogOpen, setDialogOpen] = useState(false)
  const [formData, setFormData] = useState<CreateFarmInput>({
    name: '',
    location: '',
    type: 'poultry',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const resetForm = () => {
    setFormData({
      name: '',
      location: '',
      type: 'poultry',
    })
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
      await createFarmAction({ data: formData })
      setDialogOpen(false)
      resetForm()
      router.invalidate()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create farm')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Farm Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage your farms and view their performance
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Farm
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Farm</DialogTitle>
              <DialogDescription>
                Enter the basic information for your new farm
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
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
                    setFormData((prev) => ({
                      ...prev,
                      location: e.target.value,
                    }))
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

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    isSubmitting || !formData.name || !formData.location
                  }
                >
                  {isSubmitting ? 'Creating...' : 'Create Farm'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {farms.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No farms found</h3>
            <p className="text-muted-foreground mb-4">
              Get started by creating your first farm
            </p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Farm
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {farms.map((farm) => (
            <Card key={farm.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">{farm.name}</CardTitle>
                    <CardDescription className="flex items-center mt-1">
                      <MapPin className="h-4 w-4 mr-1" />
                      {farm.location}
                    </CardDescription>
                  </div>
                  <Badge
                    variant={
                      farm.type === 'poultry'
                        ? 'default'
                        : farm.type === 'fishery'
                          ? 'secondary'
                          : 'outline'
                    }
                  >
                    {farm.type}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Link
                    to="/farms/$farmId"
                    params={{ farmId: farm.id }}
                    className={buttonVariants({
                      variant: 'default',
                      size: 'sm',
                      className: 'flex-1',
                    })}
                  >
                    View Details
                  </Link>
                  <Link
                    to="/farms/$farmId/edit"
                    params={{ farmId: farm.id }}
                    className={buttonVariants({
                      variant: 'outline',
                      size: 'sm',
                      className: 'flex-1',
                    })}
                  >
                    Edit
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
