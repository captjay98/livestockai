export const EXPENSE_CATEGORIES = [
    { value: 'feed', label: 'Feed' },
    { value: 'medicine', label: 'Medicine' },
    { value: 'equipment', label: 'Equipment' },
    { value: 'utilities', label: 'Utilities' },
    { value: 'labor', label: 'Labor' },
    { value: 'transport', label: 'Transport' },
    { value: 'livestock', label: 'Livestock' },
    { value: 'livestock_chicken', label: 'Livestock (Chicken)' },
    { value: 'livestock_fish', label: 'Livestock (Fish)' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'other', label: 'Other' },
] as const

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number]['value']
