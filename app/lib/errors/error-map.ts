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
  INVALID_API_KEY: {
    code: 40103,
    httpStatus: 401,
    category: 'AUTH',
    message: 'Invalid sensor API key',
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
  NOT_TASK_ASSIGNEE: {
    code: 40302,
    httpStatus: 403,
    category: 'FORBIDDEN',
    message: 'Not assigned to this task',
  },
  SENSOR_INACTIVE: {
    code: 40303,
    httpStatus: 403,
    category: 'FORBIDDEN',
    message: 'Sensor is deactivated',
  },
  NOT_LISTING_OWNER: {
    code: 40304,
    httpStatus: 403,
    category: 'FORBIDDEN',
    message: 'Only the listing owner can perform this action',
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
  BREED_NOT_FOUND: {
    code: 40419,
    httpStatus: 404,
    category: 'NOT_FOUND',
    message: 'Breed not found',
  },
  INGREDIENT_NOT_FOUND: {
    code: 40420,
    httpStatus: 404,
    category: 'NOT_FOUND',
    message: 'Feed ingredient not found',
  },
  FORMULATION_NOT_FOUND: {
    code: 40421,
    httpStatus: 404,
    category: 'NOT_FOUND',
    message: 'Feed formulation not found',
  },
  REQUIREMENT_NOT_FOUND: {
    code: 40422,
    httpStatus: 404,
    category: 'NOT_FOUND',
    message: 'Nutritional requirement not found',
  },
  REQUIREMENTS_NOT_FOUND: {
    code: 40423,
    httpStatus: 404,
    category: 'NOT_FOUND',
    message: 'Nutritional requirements not found for species and stage',
  },
  REPORT_NOT_FOUND: {
    code: 40424,
    httpStatus: 404,
    category: 'NOT_FOUND',
    message: 'Credit report not found',
  },
  REPORT_REQUEST_NOT_FOUND: {
    code: 40425,
    httpStatus: 404,
    category: 'NOT_FOUND',
    message: 'Report request not found',
  },
  // Digital Foreman NOT_FOUND errors
  WORKER_PROFILE_NOT_FOUND: {
    code: 40426,
    httpStatus: 404,
    category: 'NOT_FOUND',
    message: 'Worker profile not found',
  },
  GEOFENCE_NOT_FOUND: {
    code: 40427,
    httpStatus: 404,
    category: 'NOT_FOUND',
    message: 'Geofence not found',
  },
  TASK_ASSIGNMENT_NOT_FOUND: {
    code: 40428,
    httpStatus: 404,
    category: 'NOT_FOUND',
    message: 'Task assignment not found',
  },
  PAYROLL_PERIOD_NOT_FOUND: {
    code: 40429,
    httpStatus: 404,
    category: 'NOT_FOUND',
    message: 'Payroll period not found',
  },
  CHECK_IN_NOT_FOUND: {
    code: 40430,
    httpStatus: 404,
    category: 'NOT_FOUND',
    message: 'Check-in record not found',
  },
  // IoT Sensor NOT_FOUND errors
  SENSOR_NOT_FOUND: {
    code: 40431,
    httpStatus: 404,
    category: 'NOT_FOUND',
    message: 'Sensor not found',
  },
  LISTING_NOT_FOUND: {
    code: 40432,
    httpStatus: 404,
    category: 'NOT_FOUND',
    message: 'Listing not found',
  },
  CONTACT_REQUEST_NOT_FOUND: {
    code: 40433,
    httpStatus: 404,
    category: 'NOT_FOUND',
    message: 'Contact request not found',
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
  INFEASIBLE_FORMULATION: {
    code: 40003,
    httpStatus: 400,
    category: 'VALIDATION',
    message: 'No feasible formulation found with current constraints',
  },
  NO_PRICED_INGREDIENTS: {
    code: 40004,
    httpStatus: 400,
    category: 'VALIDATION',
    message: 'No ingredients with prices available',
  },
  // Digital Foreman validation errors
  NO_OPEN_CHECK_IN: {
    code: 40005,
    httpStatus: 400,
    category: 'VALIDATION',
    message: 'No open check-in found',
  },
  OUTSIDE_GEOFENCE: {
    code: 40006,
    httpStatus: 400,
    category: 'VALIDATION',
    message: 'Location is outside geofence',
  },
  PHOTO_REQUIRED: {
    code: 40007,
    httpStatus: 400,
    category: 'VALIDATION',
    message: 'Photo is required for this action',
  },
  // IoT Sensor validation errors
  READING_TOO_OLD: {
    code: 40008,
    httpStatus: 400,
    category: 'VALIDATION',
    message: 'Reading timestamp too old to accept',
  },
  LISTING_EXPIRED: {
    code: 40009,
    httpStatus: 400,
    category: 'VALIDATION',
    message: 'Listing has expired',
  },
  INVALID_PRICE_RANGE: {
    code: 40010,
    httpStatus: 400,
    category: 'VALIDATION',
    message: 'Minimum price cannot exceed maximum price',
  },
  CONTACT_OWN_LISTING: {
    code: 40011,
    httpStatus: 400,
    category: 'VALIDATION',
    message: 'Cannot contact yourself about your own listing',
  },
  ALREADY_EXISTS: {
    code: 40900,
    httpStatus: 409,
    category: 'VALIDATION',
    message: 'Resource already exists',
  },
  DUPLICATE_BREED: {
    code: 40901,
    httpStatus: 409,
    category: 'VALIDATION',
    message: 'A breed with this name already exists for this species',
  },
  DUPLICATE_CHECK_IN: {
    code: 40902,
    httpStatus: 409,
    category: 'VALIDATION',
    message: 'Check-in already exists for this time period',
  },
  OVERLAPPING_PAYROLL_PERIOD: {
    code: 40903,
    httpStatus: 409,
    category: 'VALIDATION',
    message: 'Payroll period overlaps with existing period',
  },
  DUPLICATE_CONTACT_REQUEST: {
    code: 40904,
    httpStatus: 409,
    category: 'VALIDATION',
    message: 'Contact request already submitted for this listing',
  },
  REQUEST_ALREADY_RESPONDED: {
    code: 40905,
    httpStatus: 409,
    category: 'VALIDATION',
    message: 'Contact request has already been responded to',
  },

  // ============================================
  // Extension Worker Mode Errors
  // ============================================

  // NOT_FOUND (404xx) - Start at 40434
  REGION_NOT_FOUND: {
    code: 40434,
    httpStatus: 404,
    category: 'NOT_FOUND',
    message: 'Region not found',
  },
  ACCESS_REQUEST_NOT_FOUND: {
    code: 40435,
    httpStatus: 404,
    category: 'NOT_FOUND',
    message: 'Access request not found',
  },
  ACCESS_GRANT_NOT_FOUND: {
    code: 40436,
    httpStatus: 404,
    category: 'NOT_FOUND',
    message: 'Access grant not found',
  },
  VISIT_RECORD_NOT_FOUND: {
    code: 40437,
    httpStatus: 404,
    category: 'NOT_FOUND',
    message: 'Visit record not found',
  },
  OUTBREAK_ALERT_NOT_FOUND: {
    code: 40438,
    httpStatus: 404,
    category: 'NOT_FOUND',
    message: 'Outbreak alert not found',
  },

  // FORBIDDEN (403xx) - Extension Worker
  EXTENSION_ACCESS_DENIED: {
    code: 40330,
    httpStatus: 403,
    category: 'FORBIDDEN',
    message: 'Extension access not granted or expired',
  },
  NOT_DISTRICT_MEMBER: {
    code: 40331,
    httpStatus: 403,
    category: 'FORBIDDEN',
    message: 'User not assigned to this district',
  },
  FINANCIAL_DATA_HIDDEN: {
    code: 40332,
    httpStatus: 403,
    category: 'FORBIDDEN',
    message: 'Financial visibility not granted',
  },

  // VALIDATION (400xx) - Start at 40012
  INVALID_DISTRICT_LEVEL: {
    code: 40012,
    httpStatus: 400,
    category: 'VALIDATION',
    message: 'District must be level 2 region',
  },
  ACCESS_ALREADY_GRANTED: {
    code: 40013,
    httpStatus: 400,
    category: 'VALIDATION',
    message: 'Active access grant already exists',
  },
  ACCESS_REQUEST_EXPIRED: {
    code: 40014,
    httpStatus: 400,
    category: 'VALIDATION',
    message: 'Access request has expired',
  },
  VISIT_EDIT_WINDOW_CLOSED: {
    code: 40015,
    httpStatus: 400,
    category: 'VALIDATION',
    message: 'Visit record can only be edited within 24 hours',
  },
  ACCESS_REQUEST_RATE_LIMITED: {
    code: 40016,
    httpStatus: 400,
    category: 'VALIDATION',
    message: 'Too many access requests. Try again tomorrow.',
  },
  EDIT_WINDOW_EXPIRED: {
    code: 40017,
    httpStatus: 400,
    category: 'VALIDATION',
    message:
      'Edit window has expired. Records can only be edited within 24 hours.',
  },
  NOT_SUPERVISOR: {
    code: 40331,
    httpStatus: 403,
    category: 'FORBIDDEN',
    message: 'Supervisor access required for this operation',
  },
  VISIT_NOT_FOUND: {
    code: 40439,
    httpStatus: 404,
    category: 'NOT_FOUND',
    message: 'Visit record not found',
  },
  ALERT_NOT_FOUND: {
    code: 40440,
    httpStatus: 404,
    category: 'NOT_FOUND',
    message: 'Alert not found',
  },

  // CONFLICT (409xx) - Start at 40906
  CONFLICT: {
    code: 40900,
    httpStatus: 409,
    category: 'CONFLICT',
    message: 'Resource conflict detected',
  },
  REGION_HAS_CHILDREN: {
    code: 40906,
    httpStatus: 409,
    category: 'CONFLICT',
    message: 'Cannot delete region with child regions',
  },
  REGION_HAS_FARMS: {
    code: 40907,
    httpStatus: 409,
    category: 'CONFLICT',
    message: 'Cannot delete region with assigned farms',
  },

  RATE_LIMIT_EXCEEDED: {
    code: 42900,
    httpStatus: 429,
    category: 'VALIDATION',
    message: 'Rate limit exceeded',
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
    message: 'Database operation failed',
  },
  SOLVER_ERROR: {
    code: 50002,
    httpStatus: 500,
    category: 'SERVER',
    message: 'Optimization solver error',
  },
  SOLVER_TIMEOUT: {
    code: 50003,
    httpStatus: 500,
    category: 'SERVER',
    message: 'Solver timeout - optimization took too long',
  },
  SOLVER_UNAVAILABLE: {
    code: 50004,
    httpStatus: 500,
    category: 'SERVER',
    message: 'Solver service unavailable',
  },
  EXTERNAL_SERVICE_ERROR: {
    code: 50005,
    httpStatus: 500,
    category: 'SERVER',
    message: 'External service error',
  },
  REPORT_GENERATION_FAILED: {
    code: 50006,
    httpStatus: 500,
    category: 'SERVER',
    message: 'Failed to generate credit report',
  },
} as const

export type ReasonCode = keyof typeof ErrorMap
