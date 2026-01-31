export const EXPENSE_CATEGORIES = [
  { value: 'feed', label: 'Feed' },
  { value: 'medicine', label: 'Medicine' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'labor', label: 'Labor' },
  { value: 'transport', label: 'Transport' },
  { value: 'livestock', label: 'Livestock (General)' },
  { value: 'livestock_chicken', label: 'Livestock (Poultry)' },
  { value: 'livestock_fish', label: 'Livestock (Fish)' },
  { value: 'livestock_cattle', label: 'Livestock (Cattle)' },
  { value: 'livestock_goats', label: 'Livestock (Goats)' },
  { value: 'livestock_sheep', label: 'Livestock (Sheep)' },
  { value: 'livestock_bees', label: 'Livestock (Bees)' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'veterinary', label: 'Veterinary' },
  { value: 'other', label: 'Other' },
] as const

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number]['value']
