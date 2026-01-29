import { useState } from 'react'
import {
  ChevronDown,
  ChevronRight,
  Edit,
  MapPin,
  Plus,
  Users,
} from 'lucide-react'
import { useRouter } from '@tanstack/react-router'
import { EditRegionDialog } from './edit-region-dialog'
import { CreateRegionDialog } from './create-region-dialog'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'

interface Region {
  id: string
  countryId: string
  parentId: string | null
  level: 1 | 2
  name: string
  slug: string
  isActive: boolean
  farmCount: number
  agentCount: number
  districts?: Array<District>
}

interface District {
  id: string
  countryId: string
  parentId: string | null
  level: 1 | 2
  name: string
  slug: string
  isActive: boolean
  farmCount: number
  agentCount: number
}

interface Country {
  id: string
  code: string
  name: string
  regions: Array<Region>
}

interface RegionTreeProps {
  tree: Array<Country>
}

export function RegionTree({ tree }: RegionTreeProps) {
  const [expandedCountries, setExpandedCountries] = useState<Set<string>>(
    new Set(tree.map((c) => c.id)),
  )
  const [expandedRegions, setExpandedRegions] = useState<Set<string>>(
    new Set(),
  )
  const [editingRegion, setEditingRegion] = useState<Region | District | null>(
    null,
  )
  const [addingDistrictTo, setAddingDistrictTo] = useState<Region | null>(null)
  const router = useRouter()

  const toggleCountry = (countryId: string) => {
    setExpandedCountries((prev) => {
      const next = new Set(prev)
      if (next.has(countryId)) {
        next.delete(countryId)
      } else {
        next.add(countryId)
      }
      return next
    })
  }

  const toggleRegion = (regionId: string) => {
    setExpandedRegions((prev) => {
      const next = new Set(prev)
      if (next.has(regionId)) {
        next.delete(regionId)
      } else {
        next.add(regionId)
      }
      return next
    })
  }

  const handleSuccess = () => {
    router.invalidate()
  }

  return (
    <div className="space-y-4">
      {tree.map((country) => (
        <Card key={country.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleCountry(country.id)}
                >
                  {expandedCountries.has(country.id) ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
                <CardTitle className="text-lg">
                  {country.code} {country.name}
                </CardTitle>
                <Badge variant="secondary">
                  {country.regions.length} regions
                </Badge>
              </div>
            </div>
          </CardHeader>

          {expandedCountries.has(country.id) && (
            <CardContent>
              <div className="space-y-2">
                {country.regions.map((region) => (
                  <div key={region.id} className="border-l-2 pl-4">
                    <div className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleRegion(region.id)}
                        >
                          {expandedRegions.has(region.id) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                        <span className="font-medium">{region.name}</span>
                        <Badge variant="outline">Level 1</Badge>
                        {!region.isActive && (
                          <Badge variant="destructive">Inactive</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {region.farmCount} farms
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Users className="h-3 w-3" />
                          {region.agentCount} agents
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setAddingDistrictTo(region)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingRegion(region)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {expandedRegions.has(region.id) &&
                      region.districts &&
                      region.districts.length > 0 && (
                        <div className="ml-8 space-y-1 border-l-2 pl-4">
                          {region.districts.map((district) => (
                            <div
                              key={district.id}
                              className="flex items-center justify-between py-2"
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-sm">{district.name}</span>
                                <Badge variant="outline" className="text-xs">
                                  Level 2
                                </Badge>
                                {!district.isActive && (
                                  <Badge
                                    variant="destructive"
                                    className="text-xs"
                                  >
                                    Inactive
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <MapPin className="h-3 w-3" />
                                  {district.farmCount}
                                </div>
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Users className="h-3 w-3" />
                                  {district.agentCount}
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setEditingRegion(district)}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      ))}

      {editingRegion && (
        <EditRegionDialog
          open={!!editingRegion}
          onOpenChange={(open: boolean) => !open && setEditingRegion(null)}
          region={editingRegion}
          onSuccess={handleSuccess}
        />
      )}

      {addingDistrictTo && (
        <CreateRegionDialog
          open={!!addingDistrictTo}
          onOpenChange={(open: boolean) => !open && setAddingDistrictTo(null)}
          countries={tree}
          defaultParentId={addingDistrictTo.id}
          defaultCountryId={addingDistrictTo.countryId}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  )
}
