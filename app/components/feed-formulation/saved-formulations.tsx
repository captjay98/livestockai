import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  BookOpen,
  Download,
  Eye,
  Link,
  MoreHorizontal,
  RefreshCw,
  Trash2,
  TrendingUp,
} from 'lucide-react'
import { format as formatDate } from 'date-fns'
import { toNumber } from '~/features/settings/currency'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { Skeleton } from '~/components/ui/skeleton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import { useFormatCurrency } from '~/features/settings'

interface SavedFormulationsProps {
  onSelectForComparison?: (formulationId: string) => void
}

export function SavedFormulations({
  onSelectForComparison,
}: SavedFormulationsProps) {
  const { t } = useTranslation(['feed-formulation', 'common'])
  const { format } = useFormatCurrency()
  const queryClient = useQueryClient()

  const [selectedFormulation, setSelectedFormulation] = useState<string | null>(
    null,
  )
  const [showDetailDialog, setShowDetailDialog] = useState(false)

  // Fetch saved formulations
  const { data: formulations, isLoading } = useQuery({
    queryKey: ['saved-formulations'],
    queryFn: async () => {
      const { getFormulationsFn } =
        await import('~/features/feed-formulation/server')
      return getFormulationsFn()
    },
  })

  // Fetch formulation details for dialog
  const { data: formulationDetail } = useQuery({
    queryKey: ['formulation-detail', selectedFormulation],
    queryFn: async () => {
      if (!selectedFormulation) return null
      const { getFormulationDetailFn } =
        await import('~/features/feed-formulation/server')
      return getFormulationDetailFn({
        data: { formulationId: selectedFormulation },
      })
    },
    enabled: !!selectedFormulation,
  })

  // Fetch usage history for dialog
  const { data: usageHistory } = useQuery({
    queryKey: ['formulation-usage-history', formulationDetail?.id],
    queryFn: async () => {
      if (!formulationDetail?.id) return []
      const { getFormulationUsageHistoryFn } =
        await import('~/features/feed-formulation/server')
      return getFormulationUsageHistoryFn({
        data: { formulationId: formulationDetail.id },
      })
    },
    enabled: !!formulationDetail?.id,
  })

  // Re-optimize mutation
  const reOptimizeMutation = useMutation({
    mutationFn: async (formulationId: string) => {
      const { reOptimizeFormulationFn } =
        await import('~/features/feed-formulation/server')
      return reOptimizeFormulationFn({ data: { formulationId } })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-formulations'] })
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (formulationId: string) => {
      const { deleteFormulationFn } =
        await import('~/features/feed-formulation/server')
      return deleteFormulationFn({ data: { formulationId } })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-formulations'] })
    },
  })

  const handleViewDetail = (formulationId: string) => {
    setSelectedFormulation(formulationId)
    setShowDetailDialog(true)
  }

  const handleReOptimize = (formulationId: string) => {
    reOptimizeMutation.mutate(formulationId)
  }

  const handleDelete = (formulationId: string) => {
    if (
      confirm(
        t('savedFormulations.confirmDelete', {
          defaultValue: 'Are you sure you want to delete this formulation?',
        }),
      )
    ) {
      deleteMutation.mutate(formulationId)
    }
  }

  const handleExportPdf = async () => {
    if (!formulationDetail) return

    try {
      const { generateFormulationPdf } =
        await import('~/features/feed-formulation/pdf-service')

      // Transform to PDF data format
      const pdfData = {
        name: formulationDetail.name,
        species: formulationDetail.species,
        productionStage: formulationDetail.productionStage,
        batchSizeKg: formulationDetail.batchSizeKg,
        totalCostPerKg: formulationDetail.totalCostPerKg,
        ingredients: formulationDetail.ingredients.map((ing: any) => ({
          name: ing.name,
          percentage: ing.percentage,
          quantity: ing.quantity,
          cost: ing.cost,
        })),
        nutritionalValues: formulationDetail.nutritionalValues,
        mixingInstructions: formulationDetail.mixingInstructions,
      }

      const blob = await generateFormulationPdf(
        pdfData,
        format(0).replace('0', '').trim(), // Extract currency symbol
      )

      // Download
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `formulation-${formulationDetail.name.replace(/\s+/g, '-').toLowerCase()}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to generate PDF:', error)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            {t('savedFormulations.title', {
              defaultValue: 'Saved Formulations',
            })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[400px] w-full" />
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            {t('savedFormulations.title', {
              defaultValue: 'Saved Formulations',
            })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {formulations && formulations.length > 0 ? (
            <div className="space-y-4">
              {formulations.map((formulation) => (
                <div
                  key={formulation.id}
                  className="p-4 border rounded-lg hover:bg-muted/50"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium">{formulation.name}</h3>
                        <Badge variant="outline">
                          {formulation.species} • {formulation.productionStage}
                        </Badge>
                        {formulation.usageCount > 0 && (
                          <Badge variant="secondary">
                            <Link className="h-3 w-3 mr-1" />
                            {formulation.usageCount} batches
                          </Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground">
                            Cost per kg
                          </div>
                          <div className="font-medium">
                            {format(formulation.totalCostPerKg)}
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">
                            Batch size
                          </div>
                          <div className="font-medium">
                            {formulation.batchSizeKg}
                            kg
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Created</div>
                          <div className="font-medium">
                            {formatDate(
                              new Date(formulation.createdAt),
                              'MMM dd, yyyy',
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleViewDetail(formulation.id)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          {t('savedFormulations.viewDetail', {
                            defaultValue: 'View Detail',
                          })}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleReOptimize(formulation.id)}
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          {t('savedFormulations.reOptimize', {
                            defaultValue: 'Re-optimize',
                          })}
                        </DropdownMenuItem>
                        {onSelectForComparison && (
                          <DropdownMenuItem
                            onClick={() =>
                              onSelectForComparison(formulation.id)
                            }
                          >
                            <TrendingUp className="h-4 w-4 mr-2" />
                            {t('savedFormulations.addToComparison', {
                              defaultValue: 'Add to Comparison',
                            })}
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => handleDelete(formulation.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          {t('savedFormulations.delete', {
                            defaultValue: 'Delete',
                          })}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {t('savedFormulations.noFormulations', {
                  defaultValue:
                    'No saved formulations yet. Create and save your first formulation to see it here.',
                })}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {formulationDetail?.name ||
                t('savedFormulations.formulationDetail', {
                  defaultValue: 'Formulation Detail',
                })}
            </DialogTitle>
            <DialogDescription>
              {formulationDetail &&
                `${formulationDetail.species} • ${formulationDetail.productionStage} • ${formulationDetail.batchSizeKg}kg batch`}
            </DialogDescription>
            {formulationDetail && (
              <Button
                onClick={handleExportPdf}
                variant="outline"
                size="sm"
                className="mt-2"
              >
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
            )}
          </DialogHeader>

          {formulationDetail ? (
            <div className="space-y-6">
              {/* Cost Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="text-2xl font-bold">
                    {format(formulationDetail.totalCostPerKg)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Cost per kg
                  </div>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="text-2xl font-bold">
                    {format(
                      toNumber(formulationDetail.totalCostPerKg) *
                        toNumber(formulationDetail.batchSizeKg),
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Total cost
                  </div>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="text-2xl font-bold">
                    {formulationDetail.batchSizeKg}kg
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Batch size
                  </div>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="text-2xl font-bold">
                    {formulationDetail.ingredients.length}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Ingredients
                  </div>
                </div>
              </div>

              {/* Ingredients */}
              <div>
                <h4 className="font-medium mb-3">
                  {t('savedFormulations.ingredients', {
                    defaultValue: 'Ingredients',
                  })}
                </h4>
                <div className="space-y-2">
                  {formulationDetail.ingredients.map((ingredient: any) => (
                    <div
                      key={ingredient.id}
                      className="flex justify-between items-center p-3 bg-muted rounded-lg"
                    >
                      <span className="font-medium">{ingredient.name}</span>
                      <div className="text-right">
                        <div className="font-medium">
                          {ingredient.quantity.toFixed(2)}
                          kg ({ingredient.percentage.toFixed(1)}
                          %)
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {format(ingredient.cost)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Nutritional Profile */}
              <div>
                <h4 className="font-medium mb-3">
                  {t('savedFormulations.nutritionalValues', {
                    defaultValue: 'Nutritional Profile',
                  })}
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <div className="text-lg font-bold">
                      {formulationDetail.nutritionalValues.protein.toFixed(1)}%
                    </div>
                    <div className="text-sm text-muted-foreground">Protein</div>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <div className="text-lg font-bold">
                      {formulationDetail.nutritionalValues.energy.toFixed(0)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Energy (kcal/kg)
                    </div>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <div className="text-lg font-bold">
                      {formulationDetail.nutritionalValues.fiber.toFixed(1)}%
                    </div>
                    <div className="text-sm text-muted-foreground">Fiber</div>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <div className="text-lg font-bold">
                      {formulationDetail.nutritionalValues.fat.toFixed(1)}%
                    </div>
                    <div className="text-sm text-muted-foreground">Fat</div>
                  </div>
                </div>
              </div>

              {/* Mixing Instructions */}
              {formulationDetail.mixingInstructions && (
                <div>
                  <h4 className="font-medium mb-3">
                    {t('savedFormulations.mixingInstructions', {
                      defaultValue: 'Mixing Instructions',
                    })}
                  </h4>
                  <div className="p-4 bg-muted rounded-lg whitespace-pre-wrap">
                    {formulationDetail.mixingInstructions}
                  </div>
                </div>
              )}

              {/* Usage History */}
              <div>
                <h4 className="font-medium mb-3">
                  {t('savedFormulations.usageHistory', {
                    defaultValue: 'Usage History',
                  })}
                </h4>
                {usageHistory && usageHistory.length > 0 ? (
                  <Card>
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left p-3 font-medium">
                                Batch
                              </th>
                              <th className="text-left p-3 font-medium">
                                Date Used
                              </th>
                              <th className="text-left p-3 font-medium">
                                Batch Size
                              </th>
                              <th className="text-left p-3 font-medium">
                                Total Cost
                              </th>
                              <th className="text-left p-3 font-medium">
                                Notes
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {usageHistory.map((usage: any) => (
                              <tr
                                key={usage.id}
                                className="border-b last:border-b-0"
                              >
                                <td className="p-3">
                                  {usage.batchName || 'N/A'}
                                </td>
                                <td className="p-3">
                                  {formatDate(
                                    new Date(usage.usedAt),
                                    'MMM dd, yyyy',
                                  )}
                                </td>
                                <td className="p-3">
                                  {usage.batchSizeKg}
                                  kg
                                </td>
                                <td className="p-3">
                                  {format(usage.totalCost)}
                                </td>
                                <td className="p-3">{usage.notes || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    {t('savedFormulations.noUsageHistory', {
                      defaultValue: 'No usage history',
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <Skeleton className="h-[400px] w-full" />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
