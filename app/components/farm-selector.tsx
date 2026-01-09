import { useEffect, useState } from 'react'
import { Building2 } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'
import { useFarm } from './farm-context'
import { getFarmsForUserFn } from '~/lib/farms/server'
import { cn } from '~/lib/utils'

interface FarmSelectorProps {
  className?: string
}

export function FarmSelector({ className }: FarmSelectorProps) {
  const { selectedFarmId, setSelectedFarmId } = useFarm()
  const [farms, setFarms] = useState<
    Array<{ id: string; name: string; type: string }>
  >([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadFarms = async () => {
      try {
        const farmData = await getFarmsForUserFn()
        setFarms(farmData)

        // Auto-select logic removed to default to "All Farms" (null)
        // if (!selectedFarmId && farmData.length > 0) {
        //   setSelectedFarmId(farmData[0].id)
        // }
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
        value={selectedFarmId || 'all'}
        onValueChange={(value) =>
          setSelectedFarmId(value === 'all' ? null : value)
        }
      >
        <SelectTrigger className="flex-1">
          <SelectValue>
            {selectedFarmId
              ? farms.find((f) => f.id === selectedFarmId)?.name
              : 'All Farms'}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Farms</SelectItem>
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
