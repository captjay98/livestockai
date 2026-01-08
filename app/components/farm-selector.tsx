import { useState, useEffect } from 'react'
import { createServerFn } from '@tanstack/react-start'
import { getFarmsForUser } from '~/lib/farms/server'
import { requireAuth } from '~/lib/auth/middleware'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from './ui/select'
import { Building2 } from 'lucide-react'
import { cn } from '~/lib/utils'
import { useFarm } from './farm-context'

const getFarms = createServerFn({ method: 'GET' }).handler(async () => {
  const session = await requireAuth()
  return await getFarmsForUser(session.user.id)
})

interface FarmSelectorProps {
  className?: string
}

export function FarmSelector({ className }: FarmSelectorProps) {
  const { selectedFarmId, setSelectedFarmId } = useFarm()
  const [farms, setFarms] = useState<Array<{ id: string; name: string; type: string }>>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadFarms = async () => {
      try {
        const farmData = await getFarms()
        setFarms(farmData)
        
        // Auto-select first farm if none selected
        if (!selectedFarmId && farmData.length > 0) {
          setSelectedFarmId(farmData[0].id)
        }
      } catch (error) {
        console.error('Failed to load farms:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadFarms()
  }, [selectedFarmId, setSelectedFarmId])

  if (isLoading) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <Building2 className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Loading...</span>
      </div>
    )
  }

  if (farms.length === 0) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <Building2 className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">No farms</span>
      </div>
    )
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
      <Select
        value={selectedFarmId || undefined}
        onValueChange={(value) => value && setSelectedFarmId(value)}
      >
        <SelectTrigger className="flex-1">
          <SelectValue>
            {selectedFarmId ? farms.find(f => f.id === selectedFarmId)?.name : 'Select farm'}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {farms.map((farm) => (
            <SelectItem key={farm.id} value={farm.id}>
              {farm.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}