import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'sonner'
import { Check, ChevronLeft, ChevronRight, FileText } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Label } from '~/components/ui/label'
import { Textarea } from '~/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '~/components/ui/radio-group'
import { Checkbox } from '~/components/ui/checkbox'
import { Input } from '~/components/ui/input'
import { PageHeader } from '~/components/page-header'
import { Progress } from '~/components/ui/progress'
import { generateReportFn } from '~/features/credit-passport/server'
import { getBatchesFn } from '~/features/batches/server'
import { useFarm } from '~/features/farms/context'

export const Route = createFileRoute('/_auth/credit-passport/')({
  component: CreditPassportWizard,
})

const REPORT_TYPES = [
  {
    value: 'credit_assessment',
    label: 'Credit Assessment',
    description: 'Comprehensive creditworthiness evaluation',
  },
  {
    value: 'production_certificate',
    label: 'Production Certificate',
    description: 'Verified production capacity and history',
  },
  {
    value: 'impact_report',
    label: 'Impact Report',
    description: 'Environmental and social impact metrics',
  },
]

const DATE_PRESETS = [
  { value: '30', label: '30 Days' },
  { value: '60', label: '60 Days' },
  { value: '90', label: '90 Days' },
  { value: 'custom', label: 'Custom Range' },
]

interface Batch {
  id: string
  batchName: string | null
  species: string
  initialQuantity: number
}

function CreditPassportWizard() {
  const router = useRouter()
  const { selectedFarmId } = useFarm()

  // Fetch batches for the selected farm
  const { data: batches = [] } = useQuery({
    queryKey: ['batches', selectedFarmId],
    queryFn: () =>
      selectedFarmId
        ? getBatchesFn({ data: { farmId: selectedFarmId } })
        : Promise.resolve([]),
    enabled: !!selectedFarmId,
  })

  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    reportType: '',
    dateRange: '90',
    startDate: '',
    endDate: '',
    selectedBatches: [] as Array<string>,
    notes: '',
  })

  const totalSteps = 5
  const progress = (currentStep / totalSteps) * 100

  const handleNext = () => {
    if (currentStep < totalSteps) setCurrentStep(currentStep + 1)
  }

  const handlePrev = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1)
  }

  const handleSubmit = async () => {
    if (!selectedFarmId) return

    setIsSubmitting(true)
    try {
      const reportData = {
        farmIds: [selectedFarmId],
        reportType: formData.reportType as any,
        batchIds: formData.selectedBatches,
        customNotes: formData.notes || undefined,
        ...(formData.dateRange === 'custom'
          ? {
              startDate: new Date(formData.startDate),
              endDate: new Date(formData.endDate),
            }
          : {
              startDate: new Date(Date.now() - parseInt(formData.dateRange) * 24 * 60 * 60 * 1000),
              endDate: new Date(),
            }),
      }

      await generateReportFn({
        data: reportData,
      })

      toast.success('Report generated successfully')
      router.navigate({ to: '/credit-passport/history' })
    } catch (error) {
      toast.error('Failed to generate report')
    } finally {
      setIsSubmitting(false)
    }
  }

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.reportType
      case 2:
        return formData.dateRange === 'custom'
          ? formData.startDate && formData.endDate
          : formData.dateRange
      case 3:
        return formData.selectedBatches.length > 0
      case 4:
        return true // Notes optional
      case 5:
        return true // Preview
      default:
        return false
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Credit Passport"
        description="Generate verified reports for financial institutions and partners"
        icon={FileText}
      />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              Step {currentStep} of {totalSteps}
            </CardTitle>
            <span className="text-sm text-muted-foreground">
              {Math.round(progress)}% Complete
            </span>
          </div>
          <Progress value={progress} className="w-full" />
        </CardHeader>

        <CardContent className="space-y-6">
          {currentStep === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Select Report Type</h3>
              <RadioGroup
                value={formData.reportType}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, reportType: value }))
                }
              >
                {REPORT_TYPES.map((type) => (
                  <div
                    key={type.value}
                    className="flex items-start space-x-3 p-4 border rounded-lg"
                  >
                    <RadioGroupItem
                      value={type.value}
                      id={type.value}
                      className="mt-1"
                    />
                    <div className="space-y-1">
                      <Label htmlFor={type.value} className="font-medium">
                        {type.label}
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        {type.description}
                      </p>
                    </div>
                  </div>
                ))}
              </RadioGroup>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Select Date Range</h3>
              <RadioGroup
                value={formData.dateRange}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, dateRange: value }))
                }
              >
                {DATE_PRESETS.map((preset) => (
                  <div
                    key={preset.value}
                    className="flex items-center space-x-2"
                  >
                    <RadioGroupItem value={preset.value} id={preset.value} />
                    <Label htmlFor={preset.value}>{preset.label}</Label>
                  </div>
                ))}
              </RadioGroup>

              {formData.dateRange === 'custom' && (
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          startDate: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          endDate: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Select Batches</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {batches.map((batch: Batch) => (
                  <div
                    key={batch.id}
                    className="flex items-center space-x-2 p-2 border rounded"
                  >
                    <Checkbox
                      id={batch.id}
                      checked={formData.selectedBatches.includes(batch.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setFormData((prev) => ({
                            ...prev,
                            selectedBatches: [
                              ...prev.selectedBatches,
                              batch.id,
                            ],
                          }))
                        } else {
                          setFormData((prev) => ({
                            ...prev,
                            selectedBatches: prev.selectedBatches.filter(
                              (id) => id !== batch.id,
                            ),
                          }))
                        }
                      }}
                    />
                    <Label htmlFor={batch.id} className="flex-1">
                      {batch.batchName ||
                        `${batch.species} - ${batch.initialQuantity} units`}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">
                Additional Notes (Optional)
              </h3>
              <Textarea
                placeholder="Add any additional context or specific requirements for this report..."
                value={formData.notes}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, notes: e.target.value }))
                }
                rows={4}
              />
            </div>
          )}

          {currentStep === 5 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Preview & Generate</h3>
              <div className="space-y-3 p-4 bg-muted rounded-lg">
                <div>
                  <strong>Report Type:</strong>{' '}
                  {
                    REPORT_TYPES.find((t) => t.value === formData.reportType)
                      ?.label
                  }
                </div>
                <div>
                  <strong>Date Range:</strong>{' '}
                  {formData.dateRange === 'custom'
                    ? `${formData.startDate} to ${formData.endDate}`
                    : `Last ${formData.dateRange} days`}
                </div>
                <div>
                  <strong>Batches:</strong> {formData.selectedBatches.length}{' '}
                  selected
                </div>
                {formData.notes && (
                  <div>
                    <strong>Notes:</strong> {formData.notes}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={handlePrev}
              disabled={currentStep === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>

            {currentStep < totalSteps ? (
              <Button onClick={handleNext} disabled={!canProceed()}>
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!canProceed() || isSubmitting}
              >
                {isSubmitting ? 'Generating...' : 'Generate Report'}
                <Check className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
