'use client'

import { useEffect, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  getGeofenceFn,
  saveGeofenceFn,
} from '~/features/digital-foreman/server-payroll'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
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

type GeofenceType = 'circle' | 'polygon'

interface GeofenceConfigProps {
  farmId: string
}

export function GeofenceConfig({ farmId }: GeofenceConfigProps) {
  const [type, setType] = useState<GeofenceType>('circle')
  const [centerLat, setCenterLat] = useState(0)
  const [centerLng, setCenterLng] = useState(0)
  const [radius, setRadius] = useState(500)
  const [tolerance, setTolerance] = useState(100)

  const { data: existing } = useQuery({
    queryKey: ['geofence', farmId],
    queryFn: () => getGeofenceFn({ data: { farmId } }),
    enabled: !!farmId,
  })

  useEffect(() => {
    if (existing) {
      setType(existing.geofenceType)
      setTolerance(Number(existing.toleranceMeters) || 100)
      if (existing.geofenceType === 'circle') {
        setCenterLat(Number(existing.centerLat) || 0)
        setCenterLng(Number(existing.centerLng) || 0)
        setRadius(Number(existing.radiusMeters) || 500)
      }
    }
  }, [existing])

  const save = useMutation({
    mutationFn: saveGeofenceFn,
    onSuccess: () => toast.success('Geofence saved'),
    onError: () => toast.error('Failed to save geofence'),
  })

  const handleSave = () => {
    save.mutate({
      data: {
        farmId,
        geofenceType: type,
        centerLat: type === 'circle' ? centerLat : undefined,
        centerLng: type === 'circle' ? centerLng : undefined,
        radiusMeters: type === 'circle' ? radius : undefined,
        toleranceMeters: tolerance,
      },
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Geofence Configuration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Type</Label>
          <Select
            value={type}
            onValueChange={(v) => v && setType(v as GeofenceType)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="circle">Circle</SelectItem>
              <SelectItem value="polygon">Polygon</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {type === 'circle' && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Center Latitude</Label>
                <Input
                  type="number"
                  step="0.0000001"
                  value={centerLat}
                  onChange={(e) => setCenterLat(Number(e.target.value))}
                />
              </div>
              <div>
                <Label>Center Longitude</Label>
                <Input
                  type="number"
                  step="0.0000001"
                  value={centerLng}
                  onChange={(e) => setCenterLng(Number(e.target.value))}
                />
              </div>
            </div>
            <div>
              <Label>Radius (meters): {radius}m</Label>
              <input
                type="range"
                min={50}
                max={5000}
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
                className="w-full"
              />
            </div>
          </>
        )}

        <div>
          <Label>Tolerance (meters)</Label>
          <Input
            type="number"
            value={tolerance}
            onChange={(e) => setTolerance(Number(e.target.value))}
          />
        </div>

        <Button onClick={handleSave} disabled={save.isPending}>
          Save Geofence
        </Button>
      </CardContent>
    </Card>
  )
}
