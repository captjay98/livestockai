import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '~/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { createSupplierFn } from '~/features/suppliers/server'

interface SupplierDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export const getSupplierTypes = (t: any) => [
  {
    value: 'hatchery',
    label: t('suppliers:types.hatchery', { defaultValue: 'Hatchery' }),
  },
  {
    value: 'feed_mill',
    label: t('suppliers:types.feed_mill', { defaultValue: 'Feed Mill' }),
  },
  {
    value: 'fingerlings',
    label: t('suppliers:types.fingerlings', {
      defaultValue: 'Fingerlings',
    }),
  },
  {
    value: 'pharmacy',
    label: t('suppliers:types.pharmacy', { defaultValue: 'Pharmacy' }),
  },
  {
    value: 'equipment',
    label: t('suppliers:types.equipment', { defaultValue: 'Equipment' }),
  },
  {
    value: 'other',
    label: t('suppliers:types.other', { defaultValue: 'Other' }),
  },
]

export function SupplierDialog({
  open,
  onOpenChange,
  onSuccess,
}: SupplierDialogProps) {
  const { t } = useTranslation(['suppliers', 'common'])
  const supplier_types = getSupplierTypes(t)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    location: '',
    products: '',
    supplierType: '' as
      | ''
      | 'hatchery'
      | 'feed_mill'
      | 'pharmacy'
      | 'equipment'
      | 'fingerlings'
      | 'other',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await createSupplierFn({
        data: {
          ...formData,
          products: formData.products
            ? formData.products.split(',').map((p) => p.trim())
            : [],
          email: formData.email || null,
          location: formData.location || null,
          supplierType: formData.supplierType || null,
        },
      })
      onOpenChange(false)
      toast.success(
        t('suppliers:form.addSuccess', {
          defaultValue: 'Supplier added',
        }),
      )
      setFormData({
        name: '',
        phone: '',
        email: '',
        location: '',
        products: '',
        supplierType: '',
      })
      onSuccess()
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : t('suppliers:error.create', {
              defaultValue: 'Failed to create supplier',
            }),
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('suppliers:form.addTitle')}</DialogTitle>
          <DialogDescription>{t('suppliers:form.addDesc')}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t('suppliers:form.name')}</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  name: e.target.value,
                }))
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">{t('suppliers:form.phone')}</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  phone: e.target.value,
                }))
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">{t('suppliers:form.email')}</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  email: e.target.value,
                }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">{t('suppliers:form.location')}</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  location: e.target.value,
                }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="supplierType">{t('suppliers:form.type')}</Label>
            <Select
              value={formData.supplierType}
              onValueChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  supplierType: value as typeof formData.supplierType,
                }))
              }
            >
              <SelectTrigger>
                <SelectValue>
                  {formData.supplierType
                    ? supplier_types.find(
                        (s) => s.value === formData.supplierType,
                      )?.label
                    : t('suppliers:form.selectType')}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {supplier_types.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="products">{t('suppliers:form.products')}</Label>
            <Input
              id="products"
              value={formData.products}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  products: e.target.value,
                }))
              }
              placeholder={t('suppliers:form.productsPlaceholder')}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t('suppliers:form.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !formData.name || !formData.phone}
            >
              {isSubmitting ? t('common:saving') : t('suppliers:form.add')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
