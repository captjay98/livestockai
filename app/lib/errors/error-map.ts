export const ErrorMap = {
  // Auth (401xx)
  UNAUTHORIZED: {
    code: 40100,
    httpStatus: 401,
    category: 'AUTH',
    message: 'Not authenticated',
  },
  SESSION_EXPIRED: {
    code: 40101,
    httpStatus: 401,
    category: 'AUTH',
    message: 'Session expired',
  },
  INVALID_CREDENTIALS: {
    code: 40102,
    httpStatus: 401,
    category: 'AUTH',
    message: 'Invalid credentials',
  },

  // Forbidden (403xx)
  ACCESS_DENIED: {
    code: 40300,
    httpStatus: 403,
    category: 'FORBIDDEN',
    message: 'Access denied',
  },
  BANNED: {
    code: 40301,
    httpStatus: 403,
    category: 'FORBIDDEN',
    message: 'User is banned',
  },

  // Not Found (404xx)
  NOT_FOUND: {
    code: 40400,
    httpStatus: 404,
    category: 'NOT_FOUND',
    message: 'Resource not found',
  },
  FARM_NOT_FOUND: {
    code: 40401,
    httpStatus: 404,
    category: 'NOT_FOUND',
    message: 'Farm not found',
  },
  BATCH_NOT_FOUND: {
    code: 40402,
    httpStatus: 404,
    category: 'NOT_FOUND',
    message: 'Batch not found',
  },
  CUSTOMER_NOT_FOUND: {
    code: 40403,
    httpStatus: 404,
    category: 'NOT_FOUND',
    message: 'Customer not found',
  },
  SUPPLIER_NOT_FOUND: {
    code: 40404,
    httpStatus: 404,
    category: 'NOT_FOUND',
    message: 'Supplier not found',
  },
  INVOICE_NOT_FOUND: {
    code: 40405,
    httpStatus: 404,
    category: 'NOT_FOUND',
    message: 'Invoice not found',
  },
  STRUCTURE_NOT_FOUND: {
    code: 40406,
    httpStatus: 404,
    category: 'NOT_FOUND',
    message: 'Structure not found',
  },
  SALE_NOT_FOUND: {
    code: 40407,
    httpStatus: 404,
    category: 'NOT_FOUND',
    message: 'Sale not found',
  },
  FEED_RECORD_NOT_FOUND: {
    code: 40408,
    httpStatus: 404,
    category: 'NOT_FOUND',
    message: 'Feed record not found',
  },
  VACCINATION_NOT_FOUND: {
    code: 40409,
    httpStatus: 404,
    category: 'NOT_FOUND',
    message: 'Vaccination record not found',
  },
  TREATMENT_NOT_FOUND: {
    code: 40410,
    httpStatus: 404,
    category: 'NOT_FOUND',
    message: 'Treatment record not found',
  },
  WEIGHT_SAMPLE_NOT_FOUND: {
    code: 40411,
    httpStatus: 404,
    category: 'NOT_FOUND',
    message: 'Weight sample not found',
  },
  WATER_QUALITY_NOT_FOUND: {
    code: 40412,
    httpStatus: 404,
    category: 'NOT_FOUND',
    message: 'Water quality record not found',
  },
  EGG_RECORD_NOT_FOUND: {
    code: 40413,
    httpStatus: 404,
    category: 'NOT_FOUND',
    message: 'Egg record not found',
  },
  EXPENSE_NOT_FOUND: {
    code: 40414,
    httpStatus: 404,
    category: 'NOT_FOUND',
    message: 'Expense not found',
  },
  MORTALITY_RECORD_NOT_FOUND: {
    code: 40415,
    httpStatus: 404,
    category: 'NOT_FOUND',
    message: 'Mortality record not found',
  },
  USER_NOT_FOUND: {
    code: 40416,
    httpStatus: 404,
    category: 'NOT_FOUND',
    message: 'User not found',
  },
  MEDICATION_NOT_FOUND: {
    code: 40417,
    httpStatus: 404,
    category: 'NOT_FOUND',
    message: 'Medication not found',
  },
  FEED_INVENTORY_NOT_FOUND: {
    code: 40418,
    httpStatus: 404,
    category: 'NOT_FOUND',
    message: 'Feed inventory not found',
  },

  // Validation (400xx)
  VALIDATION_ERROR: {
    code: 40000,
    httpStatus: 400,
    category: 'VALIDATION',
    message: 'Validation failed',
  },
  INVALID_INPUT: {
    code: 40001,
    httpStatus: 400,
    category: 'VALIDATION',
    message: 'Invalid input',
  },
  INSUFFICIENT_STOCK: {
    code: 40002,
    httpStatus: 400,
    category: 'VALIDATION',
    message: 'Insufficient stock',
  },
  ALREADY_EXISTS: {
    code: 40900,
    httpStatus: 409,
    category: 'VALIDATION',
    message: 'Resource already exists',
  },

  // Server (500xx)
  INTERNAL_ERROR: {
    code: 50000,
    httpStatus: 500,
    category: 'SERVER',
    message: 'Internal server error',
  },
  DATABASE_ERROR: {
    code: 50001,
    httpStatus: 500,
    category: 'SERVER',
    message: 'Database error',
  },
} as const

export type ReasonCode = keyof typeof ErrorMap
