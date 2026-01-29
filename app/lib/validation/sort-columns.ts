/**
 * Centralized sort column validation to prevent SQL injection.
 * All repositories using sql.raw() for sorting MUST use these validators.
 */

export const FEED_SORT_COLUMNS = [
  'date',
  'cost',
  'quantityKg',
  'feedType',
  'createdAt',
] as const
export const WEIGHT_SORT_COLUMNS = [
  'date',
  'averageWeightKg',
  'sampleSize',
  'createdAt',
] as const
export const WATER_QUALITY_SORT_COLUMNS = [
  'date',
  'ph',
  'temperatureCelsius',
  'dissolvedOxygenMgL',
  'ammoniaMgL',
  'createdAt',
] as const
export const MORTALITY_SORT_COLUMNS = [
  'date',
  'quantity',
  'cause',
  'createdAt',
] as const
export const CUSTOMER_SORT_COLUMNS = [
  'name',
  'phone',
  'email',
  'location',
  'customerType',
  'createdAt',
] as const
export const SUPPLIER_SORT_COLUMNS = [
  'name',
  'phone',
  'email',
  'location',
  'supplierType',
  'createdAt',
] as const
export const EGG_SORT_COLUMNS = [
  'date',
  'quantityCollected',
  'quantityBroken',
  'quantitySold',
  'createdAt',
] as const
export const INVOICE_SORT_COLUMNS = [
  'date',
  'dueDate',
  'totalAmount',
  'status',
  'invoiceNumber',
  'createdAt',
] as const
export const VACCINATION_SORT_COLUMNS = [
  'dateAdministered',
  'vaccineName',
  'nextDueDate',
  'createdAt',
] as const

function createValidator<T extends ReadonlyArray<string>>(
  allowed: T,
  defaultCol: T[number],
): (col: string) => T[number] {
  return (col) =>
    allowed.includes(col as T[number]) ? (col as T[number]) : defaultCol
}

export const validateFeedSort = createValidator(FEED_SORT_COLUMNS, 'date')
export const validateWeightSort = createValidator(WEIGHT_SORT_COLUMNS, 'date')
export const validateWaterQualitySort = createValidator(
  WATER_QUALITY_SORT_COLUMNS,
  'date',
)
export const validateMortalitySort = createValidator(
  MORTALITY_SORT_COLUMNS,
  'date',
)
export const validateCustomerSort = createValidator(
  CUSTOMER_SORT_COLUMNS,
  'createdAt',
)
export const validateSupplierSort = createValidator(
  SUPPLIER_SORT_COLUMNS,
  'createdAt',
)
export const validateEggSort = createValidator(EGG_SORT_COLUMNS, 'date')
export const validateInvoiceSort = createValidator(INVOICE_SORT_COLUMNS, 'date')
export const validateVaccinationSort = createValidator(
  VACCINATION_SORT_COLUMNS,
  'dateAdministered',
)
