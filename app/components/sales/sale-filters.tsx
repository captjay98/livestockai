import { Bird, Egg, Fish } from 'lucide-react'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '~/components/ui/select'
import { PAYMENT_STATUSES } from '~/features/sales/server'

interface SaleFiltersProps {
    livestockType?: string
    paymentStatus?: string
    onLivestockTypeChange: (value?: string) => void
    onPaymentStatusChange: (value?: string) => void
}

export function SaleFilters({
    livestockType,
    paymentStatus,
    onLivestockTypeChange,
    onPaymentStatusChange,
}: SaleFiltersProps) {
    return (
        <div className="flex gap-2">
            <Select
                value={livestockType || 'all'}
                onValueChange={(value) =>
                    onLivestockTypeChange(
                        value === 'all' || value === null ? undefined : value,
                    )
                }
            >
                <SelectTrigger className="w-[140px] h-10">
                    <SelectValue>
                        {livestockType === 'all' || !livestockType
                            ? 'All Types'
                            : livestockType === 'poultry'
                              ? 'Poultry'
                              : livestockType === 'fish'
                                ? 'Fish'
                                : 'Eggs'}
                    </SelectValue>
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="poultry">
                        <div className="flex items-center gap-2">
                            <Bird className="h-4 w-4" />
                            Poultry
                        </div>
                    </SelectItem>
                    <SelectItem value="fish">
                        <div className="flex items-center gap-2">
                            <Fish className="h-4 w-4" />
                            Fish
                        </div>
                    </SelectItem>
                    <SelectItem value="eggs">
                        <div className="flex items-center gap-2">
                            <Egg className="h-4 w-4" />
                            Eggs
                        </div>
                    </SelectItem>
                </SelectContent>
            </Select>

            <Select
                value={paymentStatus || 'all'}
                onValueChange={(value) =>
                    onPaymentStatusChange(
                        value === 'all' || value === null ? undefined : value,
                    )
                }
            >
                <SelectTrigger className="w-[140px] h-10">
                    <SelectValue>
                        {paymentStatus === 'all' || !paymentStatus
                            ? 'All Payments'
                            : PAYMENT_STATUSES.find(
                                  (s) => s.value === paymentStatus,
                              )?.label || 'All Payments'}
                    </SelectValue>
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Payments</SelectItem>
                    {PAYMENT_STATUSES.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                            <div className="flex items-center gap-2">
                                <span
                                    className={`w-2 h-2 rounded-full ${status.color.split(' ')[1]}`}
                                />
                                {status.label}
                            </div>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    )
}
