import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight, Upload } from 'lucide-react'
import { BatchSelector } from './batch-selector'
import { useFormatCurrency } from '~/features/settings'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Textarea } from '~/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'

interface Batch {
  id: string
  batchName: string
  species: string
  currentQuantity: number
  livestockType: string
}

interface CreateListingFormProps {
  onSubmit: (data: any) => void
  batches: Array<Batch>
  isSubmitting?: boolean
}

interface FormData {
  livestockType: string
  species: string
  quantity: string
  minPrice: string
  maxPrice: string
  address: string
  coordinates: string
  fuzzingLevel: string
  description: string
  photos: Array<File>
  contactPreference: string
  expirationPeriod: string
}

const STEPS = [
  { id: 1, title: 'Livestock Details' },
  { id: 2, title: 'Pricing' },
  { id: 3, title: 'Location' },
  { id: 4, title: 'Details & Photos' },
]

const LIVESTOCK_TYPES = [
  { value: 'poultry', label: 'Poultry' },
  { value: 'fish', label: 'Fish' },
  { value: 'cattle', label: 'Cattle' },
  { value: 'goats', label: 'Goats' },
  { value: 'sheep', label: 'Sheep' },
]

export function CreateListingForm({
  onSubmit,
  batches,
  isSubmitting,
}: CreateListingFormProps) {
  const { t } = useTranslation('marketplace')
  const { format } = useFormatCurrency()
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<FormData>({
    livestockType: '',
    species: '',
    quantity: '',
    minPrice: '',
    maxPrice: '',
    address: '',
    coordinates: '',
    fuzzingLevel: 'medium',
    description: '',
    photos: [],
    contactPreference: 'phone',
    expirationPeriod: '7',
  })

  const updateFormData = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleBatchSelect = (batchId: string) => {
    const batch = batches.find((b) => b.id === batchId)
    if (batch) {
      setFormData((prev) => ({
        ...prev,
        livestockType: batch.livestockType,
        species: batch.species,
        quantity: batch.currentQuantity.toString(),
      }))
    }
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).slice(0, 5)
    updateFormData('photos', files)
  }

  const canGoNext = () => {
    switch (currentStep) {
      case 1:
        return formData.livestockType && formData.species
      case 2:
        return formData.quantity && formData.minPrice
      case 3:
        return formData.address || formData.coordinates
      case 4:
        return formData.description
      default:
        return false
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const renderFuzzedPreview = (type: 'price' | 'location') => {
    if (type === 'price' && formData.minPrice) {
      return (
        <div className="mt-2 p-2 bg-muted rounded text-sm">
          <span className="text-muted-foreground">Preview: </span>
          {format(Math.floor(Number(formData.minPrice) * 0.9))} -{' '}
          {format(
            Math.ceil(Number(formData.maxPrice || formData.minPrice) * 1.1),
          )}
        </div>
      )
    }
    if (type === 'location' && formData.address) {
      const fuzzedAddress =
        formData.address.split(' ').slice(0, -1).join(' ') + ' Area'
      return (
        <div className="mt-2 p-2 bg-muted rounded text-sm">
          <span className="text-muted-foreground">Preview: </span>
          {fuzzedAddress}
        </div>
      )
    }
    return null
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Step Indicator */}
      <div className="flex items-center justify-between mb-8">
        {STEPS.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep >= step.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {step.id}
            </div>
            <span className="ml-2 text-sm font-medium hidden sm:block">
              {step.title}
            </span>
            {index < STEPS.length - 1 && (
              <div
                className={`w-12 h-0.5 mx-4 ${
                  currentStep > step.id ? 'bg-primary' : 'bg-muted'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Livestock Details */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <div>
              <Label>Pre-fill from existing batch (optional)</Label>
              <BatchSelector batches={batches} onSelect={handleBatchSelect} />
            </div>

            <div>
              <Label htmlFor="livestockType">Livestock Type *</Label>
              <Select
                value={formData.livestockType}
                onValueChange={(value) =>
                  updateFormData('livestockType', value)
                }
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={t('placeholders.selectType', {
                      defaultValue: 'Select livestock type',
                    })}
                  />
                </SelectTrigger>
                <SelectContent>
                  {LIVESTOCK_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="species">Species *</Label>
              <Input
                id="species"
                value={formData.species}
                onChange={(e) => updateFormData('species', e.target.value)}
                placeholder={t('placeholders.speciesPlaceholder', {
                  defaultValue: 'e.g., Broiler, Catfish, Holstein',
                })}
              />
            </div>
          </div>
        )}

        {/* Step 2: Pricing */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="quantity">Quantity Available *</Label>
              <Input
                id="quantity"
                type="number"
                value={formData.quantity}
                onChange={(e) => updateFormData('quantity', e.target.value)}
                placeholder={t('placeholders.quantityPlaceholder', {
                  defaultValue: 'Number of animals',
                })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="minPrice">{t('form.minPrice')} *</Label>
                <Input
                  id="minPrice"
                  type="number"
                  value={formData.minPrice}
                  onChange={(e) => updateFormData('minPrice', e.target.value)}
                  placeholder={t('placeholders.zero', { defaultValue: '0' })}
                />
              </div>
              <div>
                <Label htmlFor="maxPrice">{t('form.maxPrice')}</Label>
                <Input
                  id="maxPrice"
                  type="number"
                  value={formData.maxPrice}
                  onChange={(e) => updateFormData('maxPrice', e.target.value)}
                  placeholder={t('placeholders.optional', {
                    defaultValue: 'Optional',
                  })}
                />
              </div>
            </div>

            {renderFuzzedPreview('price')}
          </div>
        )}

        {/* Step 3: Location */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="address">Address *</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => updateFormData('address', e.target.value)}
                placeholder={t('placeholders.addressPlaceholder', {
                  defaultValue: 'Farm address or nearest landmark',
                })}
              />
            </div>

            <div>
              <Label htmlFor="coordinates">GPS Coordinates (optional)</Label>
              <Input
                id="coordinates"
                value={formData.coordinates}
                onChange={(e) => updateFormData('coordinates', e.target.value)}
                placeholder={t('placeholders.gpsPlaceholder', {
                  defaultValue: 'Latitude, Longitude',
                })}
              />
            </div>

            <div>
              <Label htmlFor="fuzzingLevel">Privacy Level</Label>
              <Select
                value={formData.fuzzingLevel}
                onValueChange={(value) => updateFormData('fuzzingLevel', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">
                    Low - Show approximate area
                  </SelectItem>
                  <SelectItem value="medium">
                    Medium - Show general vicinity
                  </SelectItem>
                  <SelectItem value="high">
                    High - Show only city/region
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {renderFuzzedPreview('location')}
          </div>
        )}

        {/* Step 4: Details & Photos */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => updateFormData('description', e.target.value)}
                placeholder={t('placeholders.descriptionPlaceholder', {
                  defaultValue:
                    'Describe your livestock, health status, feeding, etc.',
                })}
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="photos">Photos (max 5)</Label>
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                <div className="mt-2">
                  <label htmlFor="photos" className="cursor-pointer">
                    <span className="text-primary hover:text-primary/80">
                      Upload photos
                    </span>
                    <input
                      id="photos"
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                {formData.photos.length > 0 && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {formData.photos.length} photo(s) selected
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contactPreference">Contact Preference</Label>
                <Select
                  value={formData.contactPreference}
                  onValueChange={(value) =>
                    updateFormData('contactPreference', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="phone">Phone</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="both">Both</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="expirationPeriod">
                  Listing Duration (days)
                </Label>
                <Select
                  value={formData.expirationPeriod}
                  onValueChange={(value) =>
                    updateFormData('expirationPeriod', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 days</SelectItem>
                    <SelectItem value="14">14 days</SelectItem>
                    <SelectItem value="30">30 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
            disabled={currentStep === 1}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          {currentStep < 4 ? (
            <Button
              type="button"
              onClick={() => setCurrentStep((prev) => prev + 1)}
              disabled={!canGoNext()}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button type="submit" disabled={!canGoNext() || isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Listing'}
            </Button>
          )}
        </div>
      </form>
    </div>
  )
}
