import { useState } from 'react'
import { useTranslation } from 'react-i18next'
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
import { useSupplierMutations } from '~/features/suppliers/mutations'

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
  const { createSupplier } = useSupplierMutations()
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createSupplier.mutate(
      {
        supplier: {
          ...formData,
          products: formData.products
            ? formData.products.split(',').map((p) => p.trim())
            : [],
          email: formData.email || null,
          location: formData.location || null,
          supplierType: formData.supplierType || null,
        },
      },
      {
        onSuccess: () => {
          onOpenChange(false)
          setFormData({
            name: '',
            phone: '',
            email: '',
            location: '',
            products: '',
            supplierType: '',
          })
          onSuccess()
        },
      },
    )
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
            <Label
              htmlFor="name"
              className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 pl-1"
            >
              {t('suppliers:form.name')}
            </Label>
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
              className="h-11 bg-black/5 dark:bg-white/5 border-transparent focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-all font-medium text-sm px-4 rounded-xl"
              style={{ color: 'var(--text-landing-primary)' }}
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="phone"
              className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 pl-1"
            >
              {t('suppliers:form.phone')}
            </Label>
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
              className="h-11 bg-black/5 dark:bg-white/5 border-transparent focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-all font-medium text-sm px-4 rounded-xl"
              style={{ color: 'var(--text-landing-primary)' }}
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="email"
              className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 pl-1"
            >
              {t('suppliers:form.email')}
            </Label>
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
              className="h-11 bg-black/5 dark:bg-white/5 border-transparent focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-all font-medium text-sm px-4 rounded-xl"
              style={{ color: 'var(--text-landing-primary)' }}
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="location"
              className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 pl-1"
            >
              {t('suppliers:form.location')}
            </Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  location: e.target.value,
                }))
              }
              className="h-11 bg-black/5 dark:bg-white/5 border-transparent focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-all font-medium text-sm px-4 rounded-xl"
              style={{ color: 'var(--text-landing-primary)' }}
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="supplierType"
              className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 pl-1"
            >
              {t('suppliers:form.type')}
            </Label>
            <Select
              value={formData.supplierType}
              onValueChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  supplierType: value as typeof formData.supplierType,
                }))
              }
            >
              <SelectTrigger
                className="h-11 bg-black/5 dark:bg-white/5 border-transparent focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-all font-medium text-sm px-4 rounded-xl"
                style={{ color: 'var(--text-landing-primary)' }}
              >
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
            <Label
              htmlFor="products"
              className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 pl-1"
            >
              {t('suppliers:form.products')}
            </Label>
            <Input
              id="products"
              value={formData.products}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  products: e.target.value,
                }))
              }
              placeholder={t('suppliers:form.productsPlaceholder', {
                defaultValue: 'e.g., Chicks, Feed, Vaccines',
              })}
              className="h-11 bg-black/5 dark:bg-white/5 border-transparent focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-all font-medium text-sm px-4 rounded-xl"
              style={{ color: 'var(--text-landing-primary)' }}
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
              disabled={
                createSupplier.isPending || !formData.name || !formData.phone
              }
            >
              {createSupplier.isPending
                ? t('common:saving')
                : t('suppliers:form.add')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
