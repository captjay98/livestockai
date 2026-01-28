import { Label } from '~/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '~/components/ui/select'

interface SafetyMarginSelectorProps {
    value: string
    onChange: (value: string) => void
    options: Array<{ value: string; label: string }>
}

export function SafetyMarginSelector({
    value,
    onChange,
    options,
}: SafetyMarginSelectorProps) {
    return (
        <div className="space-y-2">
            <Label>Safety Margin</Label>
            <Select value={value} onValueChange={(v) => onChange(v || '2')}>
                <SelectTrigger className="h-12">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {options.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    )
}
