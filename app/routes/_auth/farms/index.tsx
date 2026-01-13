import { Link, createFileRoute, redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { Bird, Building2, Edit, Fish, MapPin, Plus, Users } from 'lucide-react'
import { useState } from 'react'
import { getFarmsForUser } from '~/features/farms/server'
import { requireAuth } from '~/features/auth/server-middleware'
import { Button, buttonVariants } from '~/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { FarmDialog } from '~/components/dialogs/farm-dialog'

interface FarmWithStats {
  id: string
  name: string
  location: string
  type: 'poultry' | 'fishery' | 'mixed'
  activeBatches: number
  totalLivestock: number
}

// Enhanced loader that fetches farm stats
const getFarmsWithStats = createServerFn({ method: 'GET' }).handler(
  async () => {
    const { db } = await import('~/lib/db')
    const session = await requireAuth()

    const farms = await getFarmsForUser(session.user.id)

    // Fetch stats for all farms in parallel
    const farmsWithStats = await Promise.all(
      farms.map(async (farm) => {
        const stats = await db
          .selectFrom('batches')
          .select([
            db.fn.count('id').as('activeBatches'),
            db.fn.sum<number>('currentQuantity').as('totalLivestock'),
          ])
          .where('farmId', '=', farm.id)
          .where('status', '=', 'active')
          .executeTakeFirst()

        return {
          ...farm,
          activeBatches: Number(stats?.activeBatches || 0),
          totalLivestock: Number(stats?.totalLivestock || 0),
        }
      }),
    )

    return farmsWithStats
  },
)

export const Route = createFileRoute('/_auth/farms/')({
  component: FarmsIndexPage,
  loader: async () => {
    try {
      const farms = await getFarmsWithStats()
      return { farms }
    } catch (err) {
      if (err instanceof Error && err.message === 'UNAUTHORIZED') {
        throw redirect({ to: '/login' })
      }
      throw err
    }
  },
})

function FarmsIndexPage() {
  const loaderData = Route.useLoaderData()
  const farms = loaderData.farms as Array<FarmWithStats>

  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedFarm, setSelectedFarm] = useState<FarmWithStats | null>(null)

  const handleCreate = () => {
    setSelectedFarm(null)
    setDialogOpen(true)
  }

  const handleEdit = (farm: FarmWithStats) => {
    setSelectedFarm(farm)
    setDialogOpen(true)
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
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Add Farm
        </Button>
      </div>

      <FarmDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        farm={selectedFarm}
      />

      {farms.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No farms found</h3>
            <p className="text-muted-foreground mb-4">
              Get started by creating your first farm
            </p>
            <Button onClick={handleCreate}>
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
              <CardContent className="space-y-4">
                {/* Stats Row */}
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span className="font-medium text-foreground">
                      {farm.activeBatches}
                    </span>
                    <span>batches</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    {farm.type === 'fishery' ? (
                      <Fish className="h-4 w-4" />
                    ) : (
                      <Bird className="h-4 w-4" />
                    )}
                    <span className="font-medium text-foreground">
                      {farm.totalLivestock.toLocaleString()}
                    </span>
                    <span>livestock</span>
                  </div>
                </div>

                {/* Actions */}
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
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleEdit(farm)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
