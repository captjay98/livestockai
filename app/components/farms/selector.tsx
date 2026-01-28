import { Building2 } from 'lucide-react'
import { useFarm } from '~/features/farms/context'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '~/components/ui/select'
import { cn } from '~/lib/utils'

interface FarmSelectorProps {
    className?: string
    farms?: Array<{ id: string; name: string; type: string }>
}

export function FarmSelector({ className, farms = [] }: FarmSelectorProps) {
    const { selectedFarmId, setSelectedFarmId } = useFarm()

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
