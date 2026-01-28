import { useState } from 'react'
import { ArrowUpDown, Eye, Trash2 } from 'lucide-react'
import type { SensorType } from '~/lib/db/types'
import { SENSOR_TYPES, SENSOR_TYPE_CONFIG } from '~/features/sensors/constants'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'

interface SensorWithStatus {
  id: string
  name: string
  sensorType: SensorType
  structureName: string | null
  status: 'online' | 'stale' | 'offline'
  lastReadingAt: Date | null
}

interface SensorListProps {
  sensors: Array<SensorWithStatus>
  structures: Array<{id: string, name: string}>
  onDelete?: (id: string) => void
  onView?: (id: string) => void
}

const statusColors = {
  online: 'bg-green-100 text-green-800',
  stale: 'bg-yellow-100 text-yellow-800',
  offline: 'bg-red-100 text-red-800',
}

export function SensorList({ sensors, structures, onDelete, onView }: SensorListProps) {
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [structureFilter, setStructureFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'name' | 'status'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  const filteredSensors = sensors
    .filter(sensor => statusFilter === 'all' || sensor.status === statusFilter)
    .filter(sensor => structureFilter === 'all' || sensor.structureName === structureFilter)
    .filter(sensor => typeFilter === 'all' || sensor.sensorType === typeFilter)
    .sort((a, b) => {
      const aVal = sortBy === 'name' ? a.name : a.status
      const bVal = sortBy === 'name' ? b.name : b.status
      const result = aVal.localeCompare(bVal)
      return sortOrder === 'asc' ? result : -result
    })

  const handleSort = (field: 'name' | 'status') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
  }

  const formatTime = (date: Date | null) => {
    if (!date) return 'No data'
    const mins = Math.floor((Date.now() - date.getTime()) / 60000)
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    return hrs < 24 ? `${hrs}h ago` : `${Math.floor(hrs / 24)}d ago`
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v || 'all')}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="online">Online</SelectItem>
            <SelectItem value="stale">Stale</SelectItem>
            <SelectItem value="offline">Offline</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={structureFilter} onValueChange={(v) => setStructureFilter(v || 'all')}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by structure" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Structures</SelectItem>
            {structures.map((structure) => (
              <SelectItem key={structure.id} value={structure.name}>
                {structure.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v || 'all')}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {SENSOR_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {SENSOR_TYPE_CONFIG[type].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <Button variant="ghost" onClick={() => handleSort('name')} className="h-auto p-0 font-semibold">
                Name <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Structure</TableHead>
            <TableHead>
              <Button variant="ghost" onClick={() => handleSort('status')} className="h-auto p-0 font-semibold">
                Status <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead>Last Reading</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredSensors.map((sensor) => (
            <TableRow key={sensor.id}>
              <TableCell className="font-medium">{sensor.name}</TableCell>
              <TableCell>{sensor.sensorType.replace(/_/g, ' ')}</TableCell>
              <TableCell>{sensor.structureName || '-'}</TableCell>
              <TableCell>
                <Badge className={statusColors[sensor.status]}>{sensor.status}</Badge>
              </TableCell>
              <TableCell>{formatTime(sensor.lastReadingAt)}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {onView && (
                    <Button variant="ghost" size="sm" onClick={() => onView(sensor.id)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  )}
                  {onDelete && (
                    <Button variant="ghost" size="sm" onClick={() => onDelete(sensor.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
