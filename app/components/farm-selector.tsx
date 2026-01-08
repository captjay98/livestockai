import { useState, useEffect } from 'react'
import { useRouter } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { getFarmsForUser } from '~/lib/farms/server'
import { requireAuth } from '~/lib/auth/middleware'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from './ui/select'
import { Building2 } from 'lucide-react'

const getFarms = createServerFn({ method: 'GET' }).handler(async () => {
  const session = await requireAuth()
  return await getFarmsForUser(session.user.id)
})

interface FarmSelectorProps {
  selectedFarmId?: string
  onFarmChange?: (farmId: string) => void
  className?: string
}

export function FarmSelector({ selectedFarmId, onFarmChange, className }: FarmSelectorProps) {
  const router = useRouter()
  const [farms, setFarms] = useState<Array<{ id: string; name: string; type: string }>>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadFarms = async () => {
      try {
        const farmData = await getFarms()
        setFarms(farmData)
      } catch (error) {
        console.error('Failed to load farms:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadFarms()
  }, [])

  const handleFarmChange = (farmId: string) => {
    if (onFarmChange) {
      onFarmChange(farmId)
    } else {
      // Default behavior: navigate to farm details
      router.navigate({ to: '/farms/$farmId', params: { farmId } })
    }
  }

  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Building2 className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Loading farms...</span>
      </div>
    )
  }

  if (farms.length === 0) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Building2 className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">No farms available</span>
      </div>
    )
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Building2 className="h-4 w-4 text-muted-foreground" />
      <Select
        value={selectedFarmId || undefined}
        onValueChange={(value) => value && handleFarmChange(value)}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue>{selectedFarmId ? farms.find(f => f.id === selectedFarmId)?.name : 'Select a farm'}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {farms.map((farm) => (
            <SelectItem key={farm.id} value={farm.id}>
              {farm.name} ({farm.type})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}