import { useState } from 'react'
import { Edit, Plus, Trash2 } from 'lucide-react'
import { useRouter } from '@tanstack/react-router'
import { EditThresholdDialog } from './edit-threshold-dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { deleteSpeciesThresholdFn } from '~/features/extension/admin-server'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '~/components/ui/alert-dialog'

interface ThresholdOverride {
  id: string
  regionId: string | null
  regionName: string
  amberThreshold: number
  redThreshold: number
}

interface SpeciesThreshold {
  species: string
  amberThreshold: number
  redThreshold: number
  overrides: Array<ThresholdOverride>
}

interface ThresholdTableProps {
  thresholds: Array<SpeciesThreshold>
}

export function ThresholdTable({ thresholds }: ThresholdTableProps) {
  const router = useRouter()
  const [editingThreshold, setEditingThreshold] = useState<{
    species: string
    regionId?: string
    regionName?: string
    amberThreshold: number
    redThreshold: number
  } | null>(null)
  const [deletingOverride, setDeletingOverride] = useState<{
    id: string
    species: string
    regionName: string
  } | null>(null)

  const handleDelete = async () => {
    if (!deletingOverride) return

    try {
      await deleteSpeciesThresholdFn({
        data: { id: deletingOverride.id },
      })
      router.invalidate()
      setDeletingOverride(null)
    } catch (error) {
      console.error('Failed to delete threshold:', error)
    }
  }

  const speciesLabels: Record<string, string> = {
    broiler: 'Broiler Chicken',
    layer: 'Layer Chicken',
    catfish: 'Catfish',
    tilapia: 'Tilapia',
    cattle: 'Cattle',
    goats: 'Goats',
    sheep: 'Sheep',
    bees: 'Bees',
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Species</TableHead>
              <TableHead>Amber Threshold (%)</TableHead>
              <TableHead>Red Threshold (%)</TableHead>
              <TableHead>Region Override</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {thresholds.map((threshold) => (
              <>
                {/* Default row */}
                <TableRow key={threshold.species}>
                  <TableCell className="font-medium">
                    {speciesLabels[threshold.species] || threshold.species}
                  </TableCell>
                  <TableCell>{threshold.amberThreshold}%</TableCell>
                  <TableCell>{threshold.redThreshold}%</TableCell>
                  <TableCell>
                    <Badge variant="secondary">Global Default</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setEditingThreshold({
                          species: threshold.species,
                          amberThreshold: threshold.amberThreshold,
                          redThreshold: threshold.redThreshold,
                        })
                      }
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>

                {/* Override rows */}
                {threshold.overrides.map((override) => (
                  <TableRow key={override.id} className="bg-muted/50">
                    <TableCell className="pl-8 text-sm text-muted-foreground">
                      {speciesLabels[threshold.species] || threshold.species}
                    </TableCell>
                    <TableCell>{override.amberThreshold}%</TableCell>
                    <TableCell>{override.redThreshold}%</TableCell>
                    <TableCell>
                      <Badge variant="outline">{override.regionName}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setEditingThreshold({
                              species: threshold.species,
                              regionId: override.regionId || undefined,
                              regionName: override.regionName,
                              amberThreshold: override.amberThreshold,
                              redThreshold: override.redThreshold,
                            })
                          }
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setDeletingOverride({
                              id: override.id,
                              species: threshold.species,
                              regionName: override.regionName,
                            })
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </>
            ))}
          </TableBody>
        </Table>
      </div>

      {editingThreshold && (
        <EditThresholdDialog
          open={!!editingThreshold}
          onOpenChange={(open) => !open && setEditingThreshold(null)}
          threshold={editingThreshold}
          onSuccess={() => {
            router.invalidate()
            setEditingThreshold(null)
          }}
        />
      )}

      <AlertDialog
        open={!!deletingOverride}
        onOpenChange={(open: boolean) => !open && setDeletingOverride(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Threshold Override</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the threshold override for{' '}
              {deletingOverride?.species} in {deletingOverride?.regionName}?
              This will revert to the global default.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
