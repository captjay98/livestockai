import { useEffect, useState } from 'react'
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

export interface CustomerFormData {
    name: string
    phone: string
    email: string
    location: string
    customerType: '' | 'individual' | 'restaurant' | 'retailer' | 'wholesaler'
}

interface CustomerFormDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    initialData?: CustomerFormData | null
    onSubmit: (data: CustomerFormData) => Promise<void>
    isSubmitting: boolean
    mode: 'create' | 'edit'
}

export function CustomerFormDialog({
    open,
    onOpenChange,
    initialData,
    onSubmit,
    isSubmitting,
    mode,
}: CustomerFormDialogProps) {
    const { t } = useTranslation(['customers', 'common'])
    const [formData, setFormData] = useState<CustomerFormData>({
        name: '',
        phone: '',
        email: '',
        location: '',
        customerType: '',
    })
    const [error, setError] = useState('')

    useEffect(() => {
        if (open) {
            if (mode === 'edit' && initialData) {
                setFormData(initialData)
            } else {
                setFormData({
                    name: '',
                    phone: '',
                    email: '',
                    location: '',
                    customerType: '',
                })
            }
            setError('')
        }
    }, [open, mode, initialData])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        try {
            await onSubmit(formData)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred')
        }
    }

    const customerTypes = [
        {
            value: 'individual',
            label: t('customers:types.individual', {
                defaultValue: 'Individual',
            }),
        },
        {
            value: 'restaurant',
            label: t('customers:types.restaurant', {
                defaultValue: 'Restaurant',
            }),
        },
        {
            value: 'retailer',
            label: t('customers:types.retailer', { defaultValue: 'Retailer' }),
        },
        {
            value: 'wholesaler',
            label: t('customers:types.wholesaler', {
                defaultValue: 'Wholesaler',
            }),
        },
    ]

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>
                        {mode === 'create'
                            ? t('customers:form.addTitle', {
                                  defaultValue: 'Add Customer',
                              })
                            : t('customers:form.editTitle', {
                                  defaultValue: 'Edit Customer',
                              })}
                    </DialogTitle>
                    {mode === 'create' && (
                        <DialogDescription>
                            {t('customers:form.addDesc', {
                                defaultValue: 'Enter customer details below',
                            })}
                        </DialogDescription>
                    )}
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">
                            {t('customers:form.name', { defaultValue: 'Name' })}
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
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="phone">
                            {t('customers:form.phone', {
                                defaultValue: 'Phone',
                            })}
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
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="location">
                            {t('customers:form.location', {
                                defaultValue: 'Location',
                            })}
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
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="customerType">
                            {t('customers:form.type', { defaultValue: 'Type' })}
                        </Label>
                        <Select
                            value={formData.customerType}
                            onValueChange={(value: string | null) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    customerType:
                                        value as CustomerFormData['customerType'],
                                }))
                            }
                        >
                            <SelectTrigger>
                                <SelectValue>
                                    {formData.customerType
                                        ? customerTypes.find(
                                              (item) =>
                                                  item.value ===
                                                  formData.customerType,
                                          )?.label
                                        : t('customers:form.selectType', {
                                              defaultValue: 'Select type',
                                          })}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                {customerTypes.map((type) => (
                                    <SelectItem
                                        key={type.value}
                                        value={type.value}
                                    >
                                        {type.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">
                            {t('customers:form.email', {
                                defaultValue: 'Email',
                            })}
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
                        />
                    </div>

                    {error && (
                        <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                            {error}
                        </div>
                    )}

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isSubmitting}
                        >
                            {t('common:cancel', { defaultValue: 'Cancel' })}
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting || !formData.name}
                        >
                            {isSubmitting
                                ? t('common:saving', {
                                      defaultValue: 'Saving...',
                                  })
                                : mode === 'create'
                                  ? t('customers:form.create', {
                                        defaultValue: 'Add Customer',
                                    })
                                  : t('customers:form.save', {
                                        defaultValue: 'Save Changes',
                                    })}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
