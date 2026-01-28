import { Bird, Egg, Fish, ShoppingCart } from 'lucide-react'

export const TYPE_COLORS: Record<string, string> = {
    poultry: 'text-orange-600 bg-orange-100',
    fish: 'text-blue-600 bg-blue-100',
    eggs: 'text-yellow-600 bg-yellow-100',
    other: 'text-gray-600 bg-gray-100',
}

export const getTypeIcon = (type: string) => {
    switch (type) {
        case 'poultry':
            return <Bird className="h-4 w-4" />
        case 'fish':
            return <Fish className="h-4 w-4" />
        case 'eggs':
            return <Egg className="h-4 w-4" />
        default:
            return <ShoppingCart className="h-4 w-4" />
    }
}
