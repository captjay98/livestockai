import { useTranslation } from 'react-i18next'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '~/components/ui/select'

interface CustomerFiltersProps {
    customerType?: string
    onCustomerTypeChange: (type?: string) => void
}

export function CustomerFilters({
    customerType,
    onCustomerTypeChange,
}: CustomerFiltersProps) {
    const { t } = useTranslation(['customers', 'common'])

    const customerTypes = [
        {
            value: 'individual',
            label: t('types.individual', { defaultValue: 'Individual' }),
        },
        {
            value: 'restaurant',
            label: t('types.restaurant', { defaultValue: 'Restaurant' }),
        },
        {
            value: 'retailer',
            label: t('types.retailer', { defaultValue: 'Retailer' }),
        },
        {
            value: 'wholesaler',
            label: t('types.wholesaler', { defaultValue: 'Wholesaler' }),
        },
    ]

    return (
        <Select
            value={customerType || 'all'}
            onValueChange={(value) =>
                onCustomerTypeChange(
                    value === 'all' || value === null ? undefined : value,
                )
            }
        >
            <SelectTrigger className="w-[150px] h-10">
                <SelectValue>
                    {customerType === undefined
                        ? t('types.all')
                        : t(`types.${customerType}`, {
                              defaultValue:
                                  customerType.charAt(0).toUpperCase() +
                                  customerType.slice(1),
                          })}
                </SelectValue>
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">{t('types.all')}</SelectItem>
                {customerTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                        {type.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    )
}
