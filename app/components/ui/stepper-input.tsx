import { Minus, Plus } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { cn } from '~/lib/utils'

interface StepperInputProps {
    value: number
    onChange: (value: number) => void
    min?: number
    max?: number
    step?: number
    label?: string
    unit?: string
    quickAddAmounts?: Array<number>
    className?: string
}

export function StepperInput({
    value,
    onChange,
    min = 0,
    max = 10000,
    step = 1,
    label,
    unit,
    quickAddAmounts = [1, 5, 10, 50],
    className,
}: StepperInputProps) {
    const handleIncrement = () => {
        if (value < max) {
            onChange(Math.min(value + step, max))
        }
    }

    const handleDecrement = () => {
        if (value > min) {
            onChange(Math.max(value - step, min))
        }
    }

    const handleQuickAdd = (amount: number) => {
        const newValue = value + amount
        if (newValue <= max) {
            onChange(newValue)
        }
    }

    return (
        <div className={cn('space-y-3', className)}>
            {label && <label className="text-sm font-medium">{label}</label>}

            <div className="flex items-center gap-4">
                <Button
                    variant="outline"
                    size="icon"
                    className="h-14 w-14 rounded-full shrink-0 border-2"
                    onClick={handleDecrement}
                    disabled={value <= min}
                >
                    <Minus className="h-6 w-6" />
                </Button>

                <div className="flex-1 text-center">
                    <div className="relative">
                        <Input
                            type="number"
                            value={value}
                            onChange={(e) => onChange(Number(e.target.value))}
                            className="h-14 text-center text-2xl font-bold bg-muted/50 border-2 focus-visible:ring-0 focus-visible:border-primary px-2"
                        />
                        {unit && (
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">
                                {unit}
                            </span>
                        )}
                    </div>
                </div>

                <Button
                    variant="outline"
                    size="icon"
                    className="h-14 w-14 rounded-full shrink-0 border-2 bg-primary/5 border-primary/20 hover:bg-primary/10 hover:border-primary/50 text-primary"
                    onClick={handleIncrement}
                    disabled={value >= max}
                >
                    <Plus className="h-6 w-6" />
                </Button>
            </div>

            <div className="flex flex-wrap gap-2 justify-center">
                {quickAddAmounts.map((amount) => (
                    <Button
                        key={amount}
                        variant="secondary"
                        size="sm"
                        className="rounded-full px-4 h-8 text-xs font-medium bg-secondary/50 hover:bg-secondary border border-transparent hover:border-border transition-all active:scale-95"
                        onClick={() => handleQuickAdd(amount)}
                    >
                        +{amount}
                    </Button>
                ))}
            </div>
        </div>
    )
}
