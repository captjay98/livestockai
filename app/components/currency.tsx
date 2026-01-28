import type { MoneyInput } from '~/features/settings/currency'
import { useFormatCurrency } from '~/features/settings'

interface CurrencyProps {
    amount: MoneyInput
    compact?: boolean
}

export function Currency({ amount, compact }: CurrencyProps) {
    const { format, formatCompact } = useFormatCurrency()
    return <>{compact ? formatCompact(amount) : format(amount)}</>
}
