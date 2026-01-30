import type { Generated } from 'kysely'

// Audit Logs
export interface AuditLogTable {
  id: Generated<string>
  userId: string | null
  userName: string | null // Preserved even if user deleted
  action: string
  entityType: string
  entityId: string
  details: string | null // stored as jsonb but we stringify it
  ipAddress: string | null
  createdAt: Generated<Date>
}

// Growth Standards
// Note: Columns match actual DB schema from migration
export interface GrowthStandardTable {
  id: Generated<string>
  species: string // e.g., 'Broiler', 'Catfish', 'Angus', etc.
  day: number // Day of growth (0, 1, 2, ... 56 for broilers, 0-180 for catfish)
  expected_weight_g: number // Expected weight in grams at this day
  breedId: string | null // NEW: Optional breed-specific growth curve (null = species-level fallback)
}

// Market Prices
// Note: Columns match actual DB schema from migration
export interface MarketPriceTable {
  id: Generated<string>
  species: string // e.g., 'Broiler', 'Catfish'
  size_category: string // e.g., '1.5kg-1.8kg', 'Table Size (600g-1kg)'
  price_per_unit: string // DECIMAL - price per unit (bird or kg depending on species)
  updated_at: Generated<Date>
}

// Notifications
/**
 * User notifications.
 */
export interface NotificationTable {
  /** Unique notification identifier */
  id: Generated<string>
  /** User ID */
  userId: string
  /** Farm ID */
  farmId: string | null
  /** Type of notification */
  type: string // 'lowStock' | 'highMortality' | 'invoiceDue' | 'batchHarvest' | 'taskAssigned' | 'taskCompleted' | 'taskApproved' | 'taskRejected' | 'flaggedCheckIn'
  /** Notification title */
  title: string
  /** Notification message */
  message: string
  /** Read status */
  read: Generated<boolean>
  /** Action URL (optional) */
  actionUrl: string | null
  /** Additional metadata */
  metadata: Record<string, any> | null
  createdAt: Generated<Date>
}

// Tasks (Farm Checklists)
/**
 * Recurring farm tasks for daily/weekly/monthly check-ins.
 * Tasks can be farm-level (general maintenance) or batch-level (species-specific).
 */
export interface TaskTable {
  /** Unique task identifier */
  id: Generated<string>
  /** Farm this task belongs to */
  farmId: string
  /** Optional batch this task is associated with (null for farm-level tasks) */
  batchId: string | null
  /** Optional module key for module-specific tasks (poultry, aquaculture, etc.) */
  moduleKey: string | null
  /** Task title (e.g., "Check Water Lines") */
  title: string
  /** Optional description */
  description: string | null
  /** Task frequency */
  frequency: 'daily' | 'weekly' | 'monthly'
  /** Whether this is a system-generated default task */
  isDefault: Generated<boolean>
  createdAt: Generated<Date>
  updatedAt: Generated<Date>
}

/**
 * Records of task completions by users.
 */
export interface TaskCompletionTable {
  /** Unique completion identifier */
  id: Generated<string>
  /** Task that was completed */
  taskId: string
  /** User who completed the task */
  userId: string
  /** When the task was completed */
  completedAt: Generated<Date>
  /** Period start date (day/week/month start) for deduplication */
  periodStart: Date
}

// Report Configurations
export interface ReportConfigTable {
  /** Unique report configuration identifier */
  id: Generated<string>
  /** User who created this config */
  createdBy: string
  /** Farm this config belongs to */
  farmId: string
  /** Display name for the report */
  name: string
  /** Type of report */
  reportType: 'profit_loss' | 'inventory' | 'sales' | 'feed' | 'egg'
  /** Date range preset */
  dateRangeType: 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom'
  /** Custom start date for custom range */
  customStartDate: Date | null
  /** Custom end date for custom range */
  customEndDate: Date | null
  /** Whether to include charts in output */
  includeCharts: boolean
  /** Whether to include detailed data */
  includeDetails: boolean
  createdAt: Generated<Date>
  updatedAt: Generated<Date>
}

/**
 * Credit reports for farmers
 */
export interface CreditReportTable {
  /** Unique report identifier */
  id: Generated<string>
  /** User ID */
  userId: string
  /** Farm IDs included in report */
  farmIds: Array<string>
  /** Batch IDs included in report */
  batchIds: Array<string>
  /** Type of report */
  reportType: 'credit_assessment' | 'production_certificate' | 'impact_report'
  /** Report period start date */
  startDate: Date
  /** Report period end date */
  endDate: Date
  /** Validity period in days */
  validityDays: 30 | 60 | 90
  /** Report expiration date */
  expiresAt: Date
  /** Report hash for verification */
  reportHash: string
  /** Digital signature */
  signature: string
  /** Public key for verification */
  publicKey: string
  /** PDF URL */
  pdfUrl: string | null
  /** Metrics snapshot */
  metricsSnapshot: Record<string, any>
  /** Report status */
  status: 'active' | 'expired' | 'revoked'
  /** Custom notes */
  customNotes: string | null
  /** White label branding */
  whiteLabel: boolean
  createdAt: Generated<Date>
  updatedAt: Generated<Date>
  deletedAt: Date | null
}

/**
 * Report access requests
 */
export interface ReportRequestTable {
  /** Unique request identifier */
  id: Generated<string>
  /** Farmer user ID */
  farmerId: string
  /** Type of report requested */
  reportType: string
  /** Requester name */
  requesterName: string
  /** Requester email */
  requesterEmail: string
  /** Requester organization */
  requesterOrganization: string | null
  /** Purpose of request */
  purpose: string
  /** Request status */
  status: 'pending' | 'approved' | 'denied'
  /** When request was made */
  requestedAt: Generated<Date>
  /** When request was responded to */
  respondedAt: Date | null
  /** Response notes */
  responseNotes: string | null
}

/**
 * Report access audit logs
 */
export interface ReportAccessLogTable {
  /** Unique log identifier */
  id: Generated<string>
  /** Report ID that was accessed */
  reportId: string
  /** Type of access */
  accessType: 'view' | 'download' | 'verify'
  /** Accessor IP address */
  accessorIp: string | null
  /** Accessor user agent */
  accessorUserAgent: string | null
  /** Verification result */
  verificationResult: Record<string, any> | null
  /** When access occurred */
  accessedAt: Generated<Date>
}
